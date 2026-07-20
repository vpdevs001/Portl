import { eq, sql } from 'drizzle-orm';
import { db } from '../../common/db';
import { societies, towers, flats } from '../../common/db/schema/identity.schema';
import { user } from '../../common/db/schema/auth.schema';
import { AppError } from '../../common/errors/app-error';
import type { CreateSocietyInput, CreateTowerInput, CreateFlatInput } from './society.schema';

export async function createSocietyAndAssignAdmin(userId: string, dto: CreateSocietyInput) {
  return await db.transaction(async (tx) => {
    // Check if user already belongs to a society
    const currentUser = await tx.query.user.findFirst({
      where: { id: userId }
    });

    if (!currentUser) {
      throw AppError.unauthorized('User not found');
    }

    if (currentUser.societyId) {
      throw AppError.conflict('User is already assigned to a society');
    }

    // Create society
    const [newSociety] = await tx
      .insert(societies)
      .values({
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode
      })
      .returning();

    if (!newSociety) {
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to create society');
    }

    // Assign user as society admin
    await tx
      .update(user)
      .set({
        societyId: newSociety.id,
        role: 'society_admin'
      })
      .where(eq(user.id, userId));

    return newSociety;
  });
}

export async function createTower(societyId: string, dto: CreateTowerInput) {
  const [newTower] = await db
    .insert(towers)
    .values({
      societyId,
      name: dto.name
    })
    .returning();

  if (!newTower) {
    throw new AppError(500, 'DATABASE_ERROR', 'Failed to create tower');
  }

  return newTower;
}

export async function createFlat(societyId: string, dto: CreateFlatInput) {
  // Validate that the tower belongs to this society
  const tower = await db.query.towers.findFirst({
    where: { id: dto.towerId, societyId }
  });

  if (!tower) {
    throw AppError.notFound('Tower not found in this society');
  }

  const [newFlat] = await db
    .insert(flats)
    .values({
      societyId,
      towerId: dto.towerId,
      flatNumber: dto.flatNumber,
      floor: dto.floor ?? null
    })
    .returning();

  if (!newFlat) {
    throw new AppError(500, 'DATABASE_ERROR', 'Failed to create flat');
  }

  return newFlat;
}

export async function getSocietyDetails(societyId: string) {
  const society = await db.query.societies.findFirst({
    where: { id: societyId },
    with: {
      towers: true
    }
  });

  if (!society) {
    throw AppError.notFound('Society not found');
  }

  // Count flats and users
  const [flatCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(flats)
    .where(eq(flats.societyId, societyId));

  const [memberCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(eq(user.societyId, societyId));

  return {
    ...society,
    flatCount: flatCountResult?.count ?? 0,
    memberCount: memberCountResult?.count ?? 0
  };
}

export async function listTowers(societyId: string) {
  return await db.query.towers.findMany({
    where: { societyId },
    orderBy: { name: 'asc' }
  });
}

export async function listFlats(societyId: string, towerId?: string) {
  return await db.query.flats.findMany({
    where: towerId ? { societyId, towerId } : { societyId },
    orderBy: { flatNumber: 'asc' }
  });
}

export async function listMembers(societyId: string, role?: 'resident' | 'security_guard' | 'society_admin') {
  return await db.query.user.findMany({
    where: role ? { societyId, role } : { societyId },
    orderBy: { name: 'asc' }
  });
}
