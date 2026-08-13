/**
 * Demo seed — run with `bun run db:seed`.
 *
 * Creates one fully-wired demo society ("Green Meadows") so a fresh checkout
 * is explorable end-to-end: towers, flats, four users spanning all three
 * roles, amenities, notices, a poll with votes, a complaint, staff, and the
 * current month's maintenance dues.
 *
 * Signing in: authentication is Google-only, so seed emails must be real
 * Google accounts you control. Override via env before running:
 *
 *   SEED_ADMIN_EMAIL=you@gmail.com SEED_RESIDENT_EMAIL=you2@gmail.com bun run db:seed
 *
 * Idempotent: if the demo society already exists, the script exits without
 * writing anything (safe to run repeatedly).
 */
import 'dotenv/config';
import { db } from './index.ts';
import {
  amenities,
  amenityBookings,
  complaints,
  flats,
  maintenanceDues,
  notices,
  pollOptions,
  polls,
  pollVotes,
  societies,
  staffDirectory,
  towers,
  user
} from './schema/index.ts';

const SOCIETY_NAME = 'Green Meadows Society';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'portl.admin.demo@gmail.com';
const GUARD_EMAIL = process.env.SEED_GUARD_EMAIL ?? 'portl.guard.demo@gmail.com';
const RESIDENT_EMAIL = process.env.SEED_RESIDENT_EMAIL ?? 'portl.resident.demo@gmail.com';
const RESIDENT2_EMAIL = process.env.SEED_RESIDENT2_EMAIL ?? 'portl.resident2.demo@gmail.com';

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** `.returning()` rows are typed `T[]` — assert the ones we know we inserted. */
function must<T>(value: T | undefined, what: string): T {
  if (!value) throw new Error(`Seed: expected ${what} to exist`);
  return value;
}

async function seed() {
  const existing = await db.query.societies.findFirst({ where: { name: SOCIETY_NAME } });
  if (existing) {
    console.log(`Seed: "${SOCIETY_NAME}" already exists (id ${existing.id}) — nothing to do.`);
    process.exit(0);
  }

  console.log('Seed: creating demo society…');

  // ── Society ────────────────────────────────────────────────────────────
  const societyRows = await db
    .insert(societies)
    .values({
      name: SOCIETY_NAME,
      address: '12 Palm Avenue, Sector 21',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      upiId: 'greenmeadows@okhdfcbank'
    })
    .returning();
  const society = must(societyRows[0], 'society');

  // ── Towers & flats ───────────────────────────────────────────────────────
  const towerRows = await db
    .insert(towers)
    .values([
      { societyId: society.id, name: 'Tower A' },
      { societyId: society.id, name: 'Tower B' }
    ])
    .returning();
  const towerA = must(towerRows[0], 'towerA');
  const towerB = must(towerRows[1], 'towerB');

  const flatRows = await db
    .insert(flats)
    .values([
      {
        societyId: society.id,
        towerId: towerA.id,
        flatNumber: 'A-101',
        floor: 1,
        flatType: '2bhk',
        monthlyAmount: '2500'
      },
      {
        societyId: society.id,
        towerId: towerA.id,
        flatNumber: 'A-102',
        floor: 1,
        flatType: '1bhk',
        monthlyAmount: '1800'
      },
      {
        societyId: society.id,
        towerId: towerA.id,
        flatNumber: 'A-201',
        floor: 2,
        flatType: '3bhk',
        monthlyAmount: '3200'
      },
      {
        societyId: society.id,
        towerId: towerA.id,
        flatNumber: 'A-202',
        floor: 2,
        flatType: '2bhk',
        monthlyAmount: '2500'
      },
      {
        societyId: society.id,
        towerId: towerB.id,
        flatNumber: 'B-101',
        floor: 1,
        flatType: '2bhk',
        monthlyAmount: '2500'
      },
      {
        societyId: society.id,
        towerId: towerB.id,
        flatNumber: 'B-102',
        floor: 1,
        flatType: '1bhk',
        monthlyAmount: '1800'
      },
      {
        societyId: society.id,
        towerId: towerB.id,
        flatNumber: 'B-201',
        floor: 2,
        flatType: '3bhk',
        monthlyAmount: '3200'
      },
      {
        societyId: society.id,
        towerId: towerB.id,
        flatNumber: 'B-202',
        floor: 2,
        flatType: '2bhk',
        monthlyAmount: '2500'
      }
    ])
    .returning();

  // ── Users (one per role + a second resident) ─────────────────────────────
  const userRows = await db
    .insert(user)
    .values([
      {
        name: 'Aarti Sharma',
        email: ADMIN_EMAIL,
        emailVerified: true,
        societyId: society.id,
        role: 'society_admin'
      },
      {
        name: 'Rajesh Yadav',
        email: GUARD_EMAIL,
        emailVerified: true,
        societyId: society.id,
        role: 'security_guard'
      },
      {
        name: 'Vikram Mehta',
        email: RESIDENT_EMAIL,
        emailVerified: true,
        societyId: society.id,
        role: 'resident',
        flatId: must(flatRows[0], 'flat A-101').id
      },
      {
        name: 'Priya Nair',
        email: RESIDENT2_EMAIL,
        emailVerified: true,
        societyId: society.id,
        role: 'resident',
        flatId: must(flatRows[2], 'flat A-201').id
      }
    ])
    .returning();
  const admin = must(userRows[0], 'admin');
  const resident = must(userRows[2], 'resident');
  const resident2 = must(userRows[3], 'resident2');

  // ── Amenities + one booking ──────────────────────────────────────────────
  const amenityRows = await db
    .insert(amenities)
    .values([
      {
        societyId: society.id,
        name: 'Clubhouse',
        description: 'Open 8 AM – 10 PM. Max 4-hour slots per flat per day.',
        capacity: 40
      },
      {
        societyId: society.id,
        name: 'Swimming Pool',
        description: 'Lifeguard on duty weekends. Children must be accompanied.',
        capacity: 20
      }
    ])
    .returning();
  const clubhouse = must(amenityRows[0], 'clubhouse');

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const slotStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10);
  const slotEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12);

  await db.insert(amenityBookings).values({
    amenityId: clubhouse.id,
    flatId: must(flatRows[0], 'flat A-101').id,
    bookedBy: resident.id,
    startTime: slotStart,
    endTime: slotEnd,
    status: 'confirmed'
  });

  // ── Notices ──────────────────────────────────────────────────────────────
  await db.insert(notices).values([
    {
      societyId: society.id,
      createdBy: admin.id,
      title: 'Water supply maintenance — Tower A',
      description:
        'Water will be shut off in Tower A this Friday 11 AM – 1 PM for pump servicing. Please store water accordingly.',
      category: 'maintenance'
    },
    {
      societyId: society.id,
      createdBy: admin.id,
      title: 'Diwali get-together at the clubhouse',
      description:
        'Join us Saturday 7 PM for the society Diwali celebration. Snacks and diyas provided — bring your festive spirit!',
      category: 'event'
    }
  ]);

  // ── Poll with votes ──────────────────────────────────────────────────────
  const pollRows = await db
    .insert(polls)
    .values({
      societyId: society.id,
      createdBy: admin.id,
      question: 'Should we install EV charging points in the visitor parking area?',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .returning();
  const poll = must(pollRows[0], 'poll');

  const optionRows = await db
    .insert(pollOptions)
    .values([
      { pollId: poll.id, optionText: 'Yes, install 2 chargers' },
      { pollId: poll.id, optionText: 'Yes, but only 1 for now' },
      { pollId: poll.id, optionText: 'Not needed yet' }
    ])
    .returning();

  await db.insert(pollVotes).values([
    { pollId: poll.id, pollOptionId: must(optionRows[0], 'option0').id, userId: resident.id },
    { pollId: poll.id, pollOptionId: must(optionRows[1], 'option1').id, userId: resident2.id }
  ]);

  // ── Complaint ────────────────────────────────────────────────────────────
  await db.insert(complaints).values({
    societyId: society.id,
    flatId: must(flatRows[0], 'flat A-101').id,
    raisedBy: resident.id,
    title: 'Lobby light flickering',
    description: 'The tube light near Tower A ground-floor lobby flickers constantly at night.',
    category: 'electrical',
    status: 'in_progress',
    adminComments: 'Electrician visit scheduled for tomorrow morning.'
  });

  // ── Staff directory ──────────────────────────────────────────────────────
  await db.insert(staffDirectory).values([
    { societyId: society.id, name: 'Sunita Devi', roleTitle: 'Maid', phone: '+91 98200 11111' },
    {
      societyId: society.id,
      name: 'Ramesh Kumar',
      roleTitle: 'Electrician',
      phone: '+91 98200 22222'
    },
    { societyId: society.id, name: 'Abdul Khan', roleTitle: 'Driver', phone: '+91 98200 33333' }
  ]);

  // ── Current month's dues for the occupied flats ──────────────────────────
  const period = currentPeriod();
  await db.insert(maintenanceDues).values([
    {
      societyId: society.id,
      flatId: must(flatRows[0], 'flat A-101').id,
      period,
      amount: must(flatRows[0], 'flat A-101').monthlyAmount,
      status: 'paid'
    },
    {
      societyId: society.id,
      flatId: must(flatRows[2], 'flat A-201').id,
      period,
      amount: must(flatRows[2], 'flat A-201').monthlyAmount,
      status: 'pending'
    }
  ]);

  console.log(`Seed: done. Society "${SOCIETY_NAME}" (${society.id})`);
  console.log('Seed users (sign in with the matching Google account):');
  console.log(`  admin    → ${ADMIN_EMAIL}`);
  console.log(`  guard    → ${GUARD_EMAIL}`);
  console.log(`  resident → ${RESIDENT_EMAIL} (flat A-101)`);
  console.log(`  resident → ${RESIDENT2_EMAIL} (flat A-201)`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
