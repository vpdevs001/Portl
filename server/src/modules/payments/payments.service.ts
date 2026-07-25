import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../common/db';
import { AppError } from '../../common/errors/app-error';
import { ERROR_CODES } from '../../common/errors/error-codes';
import { maintenanceDues, paymentConfirmations, pushTokens } from '../../common/db/schema';
import { sendPushNotifications } from '../../lib/push';
import { uploadToImageKit } from '../../lib/imagekit';
import type {
  Caller,
  ConfirmPaymentInput,
  GenerateDuesInput,
  ListDuesQuery,
  VerifyPaymentInput
} from './payments.types';

// ─── Dues ───────────────────────────────────────────────────────────────────

export async function generateDues(caller: Caller, dto: GenerateDuesInput) {
  const targetFlats = dto.flatIds?.length
    ? await db.query.flats.findMany({
        where: { id: { in: dto.flatIds }, societyId: caller.societyId },
        columns: { id: true }
      })
    : await db.query.flats.findMany({
        where: { societyId: caller.societyId },
        columns: { id: true }
      });

  if (targetFlats.length === 0) {
    throw AppError.badRequest('No matching flats found for this society');
  }

  const created = await db
    .insert(maintenanceDues)
    .values(
      targetFlats.map((flat) => ({
        societyId: caller.societyId,
        flatId: flat.id,
        period: dto.period,
        amount: dto.amount.toFixed(2),
        dueDate: dto.dueDate,
        status: 'pending' as const
      }))
    )
    .returning();

  return created;
}

export async function listDues(caller: Caller, query: ListDuesQuery) {
  if (caller.role === 'society_admin') {
    return await db.query.maintenanceDues.findMany({
      where: {
        societyId: caller.societyId,
        ...(query.status ? { status: query.status } : {})
      },
      with: { flat: true },
      orderBy: { dueDate: 'desc' }
    });
  }

  if (!caller.flatId) {
    return [];
  }

  return await db.query.maintenanceDues.findMany({
    where: {
      societyId: caller.societyId,
      flatId: caller.flatId,
      ...(query.status ? { status: query.status } : {})
    },
    with: {
      paymentConfirmations: { orderBy: { createdAt: 'desc' }, limit: 1 }
    },
    orderBy: { dueDate: 'desc' }
  });
}

async function findDueInSociety(dueId: string, societyId: string) {
  const due = await db.query.maintenanceDues.findFirst({
    where: { id: dueId, societyId }
  });

  if (!due) {
    throw AppError.notFound('Maintenance due not found');
  }

  return due;
}

// ─── Payment confirmations ──────────────────────────────────────────────────

export async function confirmPayment(caller: Caller, dto: ConfirmPaymentInput) {
  if (!caller.flatId) {
    throw AppError.forbidden('You are not assigned to a flat');
  }

  const due = await findDueInSociety(dto.dueId, caller.societyId);

  if (due.flatId !== caller.flatId) {
    throw AppError.forbidden('This due does not belong to your flat');
  }

  if (due.status === 'paid') {
    throw AppError.conflict('This due has already been marked as paid');
  }

  const uploaded = await uploadToImageKit({
    base64: dto.screenshot,
    fileName: `payment-${dto.dueId}-${Date.now()}.jpg`,
    folder: 'payments'
  });

  const [created] = await db
    .insert(paymentConfirmations)
    .values({
      dueId: dto.dueId,
      flatId: caller.flatId,
      raisedBy: caller.id,
      amount: dto.amount.toFixed(2),
      screenshot: uploaded.url,
      upiRef: dto.upiRef ?? null,
      status: 'pending'
    })
    .returning();

  if (!created) {
    throw new AppError(500, ERROR_CODES.DATABASE_ERROR, 'Failed to save payment confirmation');
  }

  // Fire-and-forget, same pattern as visitor requests / complaints —
  // never blocks the response if the push itself fails.
  void notifyAdmins(caller.societyId, due.period).catch(() => undefined);

  return created;
}

export async function listPaymentConfirmations(caller: Caller) {
  if (caller.role === 'society_admin') {
    return await db.query.paymentConfirmations.findMany({
      where: { due: { societyId: caller.societyId } },
      with: {
        due: true,
        flat: true,
        raisedByUser: { columns: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!caller.flatId) {
    return [];
  }

  return await db.query.paymentConfirmations.findMany({
    where: { flatId: caller.flatId },
    with: {
      due: true,
      flat: true,
      raisedByUser: { columns: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function verifyPayment(
  caller: Caller,
  confirmationId: string,
  dto: VerifyPaymentInput
) {
  const confirmation = await db.query.paymentConfirmations.findFirst({
    where: { id: confirmationId, due: { societyId: caller.societyId } }
  });

  if (!confirmation) {
    throw AppError.notFound('Payment confirmation not found');
  }

  if (confirmation.status !== 'pending') {
    throw AppError.conflict('This payment confirmation has already been reviewed');
  }

  const updated = await db.transaction(async (tx) => {
    const [updatedConfirmation] = await tx
      .update(paymentConfirmations)
      .set({
        status: dto.status,
        reviewedBy: caller.id,
        rejectionReason: dto.status === 'rejected' ? (dto.rejectionReason ?? null) : null
      })
      .where(eq(paymentConfirmations.id, confirmationId))
      .returning();

    if (!updatedConfirmation) {
      throw new AppError(500, ERROR_CODES.DATABASE_ERROR, 'Failed to update payment confirmation');
    }

    // Approving marks the underlying due as paid. Rejecting leaves the due
    // exactly as it was (still pending/overdue) — the resident can submit
    // a fresh confirmation.
    if (dto.status === 'approved') {
      await tx
        .update(maintenanceDues)
        .set({ status: 'paid' })
        .where(
          and(eq(maintenanceDues.id, updatedConfirmation.dueId), eq(maintenanceDues.societyId, caller.societyId))
        );
    }

    return updatedConfirmation;
  });

  void notifyResident(updated).catch(() => undefined);

  return updated;
}

// ─── Notifications ──────────────────────────────────────────────────────────

async function notifyAdmins(societyId: string, period: string) {
  const admins = await db.query.user.findMany({
    where: { societyId, role: 'society_admin' },
    columns: { id: true }
  });

  if (admins.length === 0) {
    return;
  }

  const tokens = await db
    .select({ token: pushTokens.expoPushToken })
    .from(pushTokens)
    .where(
      inArray(
        pushTokens.userId,
        admins.map((a) => a.id)
      )
    );

  await sendPushNotifications(
    tokens.map((t) => t.token),
    {
      title: 'New payment confirmation',
      body: `A resident submitted a payment proof for ${period}`,
      data: { type: 'payment_confirmation' }
    }
  );
}

async function notifyResident(confirmation: typeof paymentConfirmations.$inferSelect) {
  const tokens = await db
    .select({ token: pushTokens.expoPushToken })
    .from(pushTokens)
    .where(eq(pushTokens.userId, confirmation.raisedBy));

  const approved = confirmation.status === 'approved';

  await sendPushNotifications(
    tokens.map((t) => t.token),
    {
      title: approved ? 'Payment verified' : 'Payment rejected',
      body: approved
        ? 'Your maintenance payment has been confirmed as paid.'
        : `Your payment proof was rejected${confirmation.rejectionReason ? `: ${confirmation.rejectionReason}` : '.'}`,
      data: { dueId: confirmation.dueId, type: 'payment_confirmation' }
    }
  );
}
