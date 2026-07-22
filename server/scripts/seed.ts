import { db } from '../src/common/db';
import { societies, towers, flats } from '../src/common/db/schema/identity.schema';
import { user } from '../src/common/db/schema/auth.schema';
import { societyInvites } from '../src/common/db/schema/invites.schema';
import { eq } from 'drizzle-orm';

const SOCIETY_ID = '11111111-1111-1111-1111-111111111111';
const TOWER_A_ID = '22222222-2222-2222-2222-222222222222';
const TOWER_B_ID = '33333333-3333-3333-3333-333333333333';

const FLAT_A101_ID = 'a1011111-1111-1111-1111-111111111111';
const FLAT_A102_ID = 'a1021111-1111-1111-1111-111111111111';
const FLAT_B101_ID = 'b1011111-1111-1111-1111-111111111111';

const ADMIN_ID = '44444444-4444-4444-4444-444444444444';
const RESIDENT_USER_ID = '55555555-5555-5555-5555-555555555555';
const GUARD_USER_ID = '66666666-6666-6666-6666-666666666666';

const INVITE_RESIDENT_ID = '77777777-7777-7777-7777-777777777777';
const INVITE_GUARD_ID = '88888888-8888-8888-8888-888888888888';

async function seed() {
  console.log('Seeding database...');

  // 1. Seed Society
  await db
    .insert(societies)
    .values({
      id: SOCIETY_ID,
      name: 'Portl Heights',
      address: '123 Luxury Avenue, Golden Hills',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    })
    .onConflictDoNothing();

  // 2. Seed Towers
  await db
    .insert(towers)
    .values([
      { id: TOWER_A_ID, societyId: SOCIETY_ID, name: 'A Wing' },
      { id: TOWER_B_ID, societyId: SOCIETY_ID, name: 'B Wing' }
    ])
    .onConflictDoNothing();

  // 3. Seed Flats
  await db
    .insert(flats)
    .values([
      {
        id: FLAT_A101_ID,
        societyId: SOCIETY_ID,
        towerId: TOWER_A_ID,
        flatNumber: 'A-101',
        floor: 1
      },
      {
        id: FLAT_A102_ID,
        societyId: SOCIETY_ID,
        towerId: TOWER_A_ID,
        flatNumber: 'A-102',
        floor: 1
      },
      {
        id: FLAT_B101_ID,
        societyId: SOCIETY_ID,
        towerId: TOWER_B_ID,
        flatNumber: 'B-101',
        floor: 1
      }
    ])
    .onConflictDoNothing();

  // 4. Seed Society Admin User
  await db
    .insert(user)
    .values({
      id: ADMIN_ID,
      name: 'Admin Portl',
      email: 'admin@portl.com',
      emailVerified: true,
      role: 'society_admin',
      societyId: SOCIETY_ID
    })
    .onConflictDoNothing();

  // Ensure admin user is society admin (in case they were inserted with different details previously)
  await db
    .update(user)
    .set({ role: 'society_admin', societyId: SOCIETY_ID })
    .where(eq(user.id, ADMIN_ID));

  // 5. Seed Unassigned Users (for inviting)
  await db
    .insert(user)
    .values([
      {
        id: RESIDENT_USER_ID,
        name: 'Resident Portl',
        email: 'resident@portl.com',
        emailVerified: true,
        role: null,
        societyId: null
      },
      {
        id: GUARD_USER_ID,
        name: 'Guard Portl',
        email: 'guard@portl.com',
        emailVerified: true,
        role: null,
        societyId: null
      }
    ])
    .onConflictDoNothing();

  // 6. Seed Pending Invites
  await db
    .insert(societyInvites)
    .values([
      {
        id: INVITE_RESIDENT_ID,
        societyId: SOCIETY_ID,
        invitedUserId: RESIDENT_USER_ID,
        invitedBy: ADMIN_ID,
        role: 'resident',
        flatId: FLAT_A101_ID,
        status: 'pending'
      },
      {
        id: INVITE_GUARD_ID,
        societyId: SOCIETY_ID,
        invitedUserId: GUARD_USER_ID,
        invitedBy: ADMIN_ID,
        role: 'security_guard',
        flatId: null,
        status: 'pending'
      }
    ])
    .onConflictDoNothing();

  console.log('Seeding completed successfully.');
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
