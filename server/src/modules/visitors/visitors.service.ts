import { randomInt } from 'node:crypto';
import { and, eq, inArray, isNull, lt } from 'drizzle-orm';
import { db } from '../../common/db';
import { AppError } from '../../common/errors/app-error';
import { assertBelongsToSociety } from '../../common/helpers/tenant.helper';
import { sendPushNotifications } from '../../lib/push';
import {
  cabDetails,
  deliveryDetails,
  pushTokens,
  serviceStaffDetails,
  visitorEntryLogs,
  visitorRequests
} from '../../common/db/schema';
import type {
  CreatePreApprovalInput,
  CreateVisitorRequestInput,
  RegisterPushTokenInput,
  RespondVisitorRequestInput,
  UploadVisitorPhotoInput,
  VerifyPassInput
} from './visitors.types.ts';

type CallerRole = 'resident' | 'security_guard' | 'society_admin';

type Caller = {
  id: string;
  societyId: string;
  role: CallerRole;
  flatId?: string | null;
};

// A guard-initiated request left untouched this long is treated as expired
// on the next read, rather than sitting `pending` forever. See plan.md
// Chapter 7 — deliberately a lazy check-on-read, not a scheduled job.
const PENDING_EXPIRY_MINUTES = 30;

export async function createVisitorRequest(
  societyId: string,
  createdBy: string,
  dto: CreateVisitorRequestInput
) {
  const request = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(visitorRequests)
      .values({
        societyId,
        flatId: dto.flatId ?? null,
        visitorType: dto.visitorType,
        approverType: dto.approverType ?? 'resident',
        name: dto.name,
        phone: dto.phone ?? null,
        photo: dto.photo ?? null,
        purpose: dto.purpose ?? null,
        vehicleNumber: dto.vehicleNumber ?? null,
        status: 'pending',
        source: dto.source ?? 'guard_request',
        createdBy
      })
      .returning();

    if (!created) {
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to create visitor request');
    }

    if (dto.visitorType === 'delivery') {
      await tx.insert(deliveryDetails).values({
        visitorRequestId: created.id,
        companyName: dto.details?.companyName ?? dto.details?.company ?? 'Unknown',
        orderId: dto.details?.orderId ?? null
      });
    }

    if (dto.visitorType === 'cab') {
      await tx.insert(cabDetails).values({
        visitorRequestId: created.id,
        providerName: dto.details?.providerName ?? dto.details?.company ?? 'Unknown',
        vehicleNumber: dto.details?.vehicleNumber ?? null,
        driverName: dto.details?.driverName ?? null
      });
    }

    if (dto.visitorType === 'service_staff') {
      await tx.insert(serviceStaffDetails).values({
        visitorRequestId: created.id,
        serviceType: dto.details?.serviceType ?? 'Service',
        companyName: dto.details?.companyName ?? dto.details?.company ?? null
      });
    }

    return created;
  });

  // Fire-and-forget: routes to the flat's residents, or to every society
  // admin, depending on approverType. Never blocks/fails the response —
  // the client's 5s poll is the fallback if this doesn't land.
  void notifyApprovers(request).catch(() => undefined);

  return request;
}

async function notifyApprovers(request: typeof visitorRequests.$inferSelect) {
  const recipientIds =
    request.approverType === 'admin'
      ? (
          await db.query.user.findMany({
            where: { societyId: request.societyId, role: 'society_admin' },
            columns: { id: true }
          })
        ).map((row) => row.id)
      : request.flatId
        ? (
            await db.query.user.findMany({
              where: { flatId: request.flatId! },
              columns: { id: true }
            })
          ).map((row) => row.id)
        : [];

  if (recipientIds.length === 0) {
    return;
  }

  const tokens = await db
    .select({ token: pushTokens.expoPushToken })
    .from(pushTokens)
    .where(inArray(pushTokens.userId, recipientIds));

  await sendPushNotifications(
    tokens.map((t) => t.token),
    {
      title: 'New visitor at the gate',
      body: `${request.name} is waiting — ${request.visitorType.replace('_', ' ')}`,
      data: { visitorRequestId: request.id, type: 'visitor_request' }
    }
  );
}

async function expirePendingRequests(societyId: string) {
  const cutoff = new Date(Date.now() - PENDING_EXPIRY_MINUTES * 60_000);

  await db
    .update(visitorRequests)
    .set({ status: 'expired' })
    .where(
      and(
        eq(visitorRequests.societyId, societyId),
        eq(visitorRequests.status, 'pending'),
        lt(visitorRequests.createdAt, cutoff)
      )
    );
}

export async function listPendingRequests(caller: Caller) {
  await expirePendingRequests(caller.societyId);

  if (caller.role === 'security_guard') {
    // Guard sees every pending request at the gate, regardless of who it
    // routes to.
    return await db.query.visitorRequests.findMany({
      where: { societyId: caller.societyId, status: 'pending' },
      with: {
        deliveryDetails: true,
        cabDetails: true,
        serviceStaffDetails: true,
        createdByUser: true,
        flat: true
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)]
    });
  }

  if (caller.role === 'society_admin') {
    return await db.query.visitorRequests.findMany({
      where: { societyId: caller.societyId, status: 'pending', approverType: 'admin' },
      with: {
        deliveryDetails: true,
        cabDetails: true,
        serviceStaffDetails: true,
        createdByUser: true,
        flat: true
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)]
    });
  }

  // Resident: only requests routed to their own flat.
  if (!caller.flatId) {
    return [];
  }

  return await db.query.visitorRequests.findMany({
    where: {
      societyId: caller.societyId,
      status: 'pending',
      approverType: 'resident',
      flatId: caller.flatId!
    },
    with: {
      deliveryDetails: true,
      cabDetails: true,
      serviceStaffDetails: true,
      createdByUser: true,
      flat: true
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)]
  });
}

export async function respondToVisitorRequest(
  caller: Caller,
  requestId: string,
  dto: RespondVisitorRequestInput
) {
  return await db.transaction(async (tx) => {
    const conditions = [
      eq(visitorRequests.id, requestId),
      eq(visitorRequests.status, 'pending'),
      eq(visitorRequests.societyId, caller.societyId)
    ];

    // Bake the caller's own authorization directly into the WHERE clause
    // (Chapter 5's hybrid tenant-scoping pattern) rather than fetch-then-
    // check: a resident can only resolve their own flat's resident-routed
    // requests; an admin can only resolve admin-routed requests.
    if (caller.role === 'resident') {
      if (!caller.flatId) {
        throw AppError.forbidden('You are not assigned to a flat');
      }
      conditions.push(eq(visitorRequests.approverType, 'resident'));
      conditions.push(eq(visitorRequests.flatId, caller.flatId));
    } else if (caller.role === 'society_admin') {
      conditions.push(eq(visitorRequests.approverType, 'admin'));
    } else {
      throw AppError.forbidden('Only residents and admins can respond to visitor requests');
    }

    const [updated] = await tx
      .update(visitorRequests)
      .set({ status: dto.status, approvedBy: caller.id })
      .where(and(...conditions))
      .returning();

    if (!updated) {
      throw AppError.conflict(
        'This request has already been handled, expired, or does not belong to you.'
      );
    }

    return updated;
  });
}

async function assertRequestInSociety(requestId: string, societyId: string) {
  const request = await db.query.visitorRequests.findFirst({
    where: { id: requestId },
    columns: { id: true, societyId: true }
  });

  assertBelongsToSociety(request, societyId, 'Visitor request');
}

export async function logEntry(societyId: string, userId: string, requestId: string) {
  await assertRequestInSociety(requestId, societyId);

  const [entry] = await db
    .insert(visitorEntryLogs)
    .values({
      visitorRequestId: requestId,
      entryTime: new Date(),
      entryMarkedBy: userId
    })
    .returning();

  return entry;
}

export async function logExit(societyId: string, userId: string, requestId: string) {
  await assertRequestInSociety(requestId, societyId);

  const [entry] = await db
    .update(visitorEntryLogs)
    .set({
      exitTime: new Date(),
      exitMarkedBy: userId
    })
    .where(and(eq(visitorEntryLogs.visitorRequestId, requestId), isNull(visitorEntryLogs.exitTime)))
    .returning();

  if (!entry) {
    throw AppError.notFound('No open entry log found for this visitor request');
  }

  return entry;
}

export async function uploadVisitorPhoto(input: UploadVisitorPhotoInput) {
  return {
    url: `https://example.com/uploads/${input.fileName}`,
    fileName: input.fileName,
    contentType: input.contentType
  };
}

export async function registerPushToken(userId: string, dto: RegisterPushTokenInput) {
  const [token] = await db
    .insert(pushTokens)
    .values({
      userId,
      expoPushToken: dto.expoPushToken,
      deviceId: dto.deviceId ?? null
    })
    .onConflictDoUpdate({
      target: [pushTokens.userId, pushTokens.expoPushToken],
      set: { deviceId: dto.deviceId ?? null }
    })
    .returning();

  return token;
}

// ─── Chapter 8 — Pre-Approvals ──────────────────────────────────────────────

// Excludes 0/O and 1/I/L — a guard reading this off a resident's phone
// screen at the gate shouldn't have to guess which character it is.
const PASS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PASS_CODE_LENGTH = 6;
const PASS_CODE_MAX_ATTEMPTS = 5;

function generatePassCode(): string {
  let code = '';
  for (let i = 0; i < PASS_CODE_LENGTH; i++) {
    code += PASS_CODE_ALPHABET[randomInt(PASS_CODE_ALPHABET.length)];
  }
  return code;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

export async function createPreApproval(caller: Caller, dto: CreatePreApprovalInput) {
  if (!caller.flatId) {
    throw AppError.forbidden('You are not assigned to a flat');
  }

  const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
  const validUntil = new Date(dto.validUntil);

  // Codes collide roughly never (32^6 keyspace scoped per society), but the
  // unique constraint is the real guarantee — this loop just makes the rare
  // collision invisible to the caller instead of surfacing a 409.
  for (let attempt = 1; attempt <= PASS_CODE_MAX_ATTEMPTS; attempt++) {
    try {
      const [created] = await db
        .insert(visitorRequests)
        .values({
          societyId: caller.societyId,
          flatId: caller.flatId,
          visitorType: dto.visitorType ?? 'guest',
          approverType: 'resident',
          name: dto.name,
          phone: dto.phone ?? null,
          purpose: dto.purpose ?? null,
          status: 'approved',
          source: 'pre_approval',
          createdBy: caller.id,
          approvedBy: caller.id,
          passCode: generatePassCode(),
          validFrom,
          validUntil
        })
        .returning();

      if (!created) {
        throw new AppError(500, 'DATABASE_ERROR', 'Failed to create pre-approval');
      }

      return created;
    } catch (err) {
      if (isUniqueViolation(err) && attempt < PASS_CODE_MAX_ATTEMPTS) {
        continue;
      }
      throw err;
    }
  }

  // Unreachable — the loop above always returns or throws — but keeps
  // TypeScript's control-flow analysis happy about a return on every path.
  throw new AppError(500, 'DATABASE_ERROR', 'Failed to generate a unique pass code');
}

export async function listPreApprovals(caller: Caller) {
  // Only what this resident personally created — matches plan.md's
  // "pre-approvals they created", not every pre-approval for their flat.
  return await db.query.visitorRequests.findMany({
    where: {
      societyId: caller.societyId,
      source: 'pre_approval',
      createdBy: caller.id
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function verifyPass(caller: Caller, dto: VerifyPassInput) {
  const request = dto.requestId
    ? await db.query.visitorRequests.findFirst({
        where: { id: dto.requestId, societyId: caller.societyId, source: 'pre_approval' },
        with: { flat: true, createdByUser: true }
      })
    : await db.query.visitorRequests.findFirst({
        where: {
          passCode: dto.passCode!.toUpperCase(),
          societyId: caller.societyId,
          source: 'pre_approval'
        },
        with: { flat: true, createdByUser: true }
      });

  if (!request) {
    throw AppError.notFound('No pre-approval found for this code');
  }

  if (request.status !== 'approved') {
    throw AppError.conflict('This pre-approval is no longer active');
  }

  const now = new Date();
  if (request.validFrom && now < request.validFrom) {
    throw AppError.badRequest('This pass is not valid yet');
  }
  if (request.validUntil && now > request.validUntil) {
    throw AppError.conflict('This pre-approval pass has expired');
  }

  return request;
}
