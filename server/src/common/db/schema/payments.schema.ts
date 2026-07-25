import { numeric, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { societies, flats } from './identity.schema';
import { dueStatusEnum, paymentConfirmationStatusEnum } from './enums';

export const maintenanceDues = pgTable(
  'maintenance_dues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    societyId: uuid('society_id')
      .notNull()
      .references(() => societies.id, { onDelete: 'cascade' }),
    flatId: uuid('flat_id')
      .notNull()
      .references(() => flats.id, { onDelete: 'cascade' }),
    // "YYYY-MM" — one row per flat per calendar month, materialized lazily
    // the first time anyone asks for the current month's dues. This is
    // what makes the month rollover automatic: a new period key means no
    // row exists yet, so the next read creates it fresh as 'pending'.
    period: varchar('period', { length: 7 }).notNull(),
    // Snapshot of the flat's monthlyAmount at the moment this due was
    // created — so changing a flat's rate later doesn't rewrite history.
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: dueStatusEnum('status').notNull().default('pending'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (table) => [unique('maintenance_dues_flat_period_unique').on(table.flatId, table.period)]
);

export const paymentConfirmations = pgTable('payment_confirmations', {
  id: uuid('id').primaryKey().defaultRandom(),
  dueId: uuid('due_id')
    .notNull()
    .references(() => maintenanceDues.id, { onDelete: 'cascade' }),
  flatId: uuid('flat_id')
    .notNull()
    .references(() => flats.id, { onDelete: 'cascade' }),
  raisedBy: uuid('raised_by')
    .notNull()
    .references(() => user.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  screenshot: text('screenshot').notNull(),
  upiRef: varchar('upi_ref', { length: 100 }),
  status: paymentConfirmationStatusEnum('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => user.id),
  rejectionReason: text('rejection_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
