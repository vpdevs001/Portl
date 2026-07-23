import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { societies } from './identity.schema';
import { visitorRequests } from './visitors.schema';

export const visitorEntryLogs = pgTable('visitor_entry_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorRequestId: uuid('visitor_request_id')
    .notNull()
    .references(() => visitorRequests.id, { onDelete: 'cascade' }),
  entryTime: timestamp('entry_time'),
  exitTime: timestamp('exit_time'),
  entryMarkedBy: uuid('entry_marked_by').references(() => user.id),
  exitMarkedBy: uuid('exit_marked_by').references(() => user.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const residentEntryLogs = pgTable('resident_entry_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  entryTime: timestamp('entry_time'),
  exitTime: timestamp('exit_time'),
  entryMarkedBy: uuid('entry_marked_by').references(() => user.id),
  exitMarkedBy: uuid('exit_marked_by').references(() => user.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const staffDirectory = pgTable('staff_directory', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  roleTitle: varchar('role_title', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  photo: text('photo'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const staffEntryLogs = pgTable('staff_entry_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id')
    .notNull()
    .references(() => staffDirectory.id, { onDelete: 'cascade' }),
  entryTime: timestamp('entry_time'),
  exitTime: timestamp('exit_time'),
  entryMarkedBy: uuid('entry_marked_by').references(() => user.id),
  exitMarkedBy: uuid('exit_marked_by').references(() => user.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
