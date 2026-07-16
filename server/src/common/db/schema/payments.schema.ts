import { date, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { societies, flats, users } from './identity.schema';
import { dueStatusEnum, paymentConfirmationStatusEnum } from './enums';

export const maintenanceDues = pgTable('maintenance_dues', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  flatId: uuid('flat_id')
    .notNull()
    .references(() => flats.id, { onDelete: 'cascade' }),
  period: varchar('period', { length: 20 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  status: dueStatusEnum('status').notNull().default('pending'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

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
    .references(() => users.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  screenshot: text('screenshot').notNull(),
  upiRef: varchar('upi_ref', { length: 100 }),
  status: paymentConfirmationStatusEnum('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
