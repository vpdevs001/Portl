import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { societies, flats } from './identity.schema';
import { complaintStatusEnum, noticeCategoryEnum } from './enums';

export const notices = pgTable('notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => user.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: noticeCategoryEnum('category').notNull().default('general'),
  // Null = stays visible indefinitely. Once set and passed, the notice is
  // filtered out of the default feed (see notices.service.ts) rather than
  // deleted outright — admins can still reach it via ?includeExpired=true.
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const polls = pgTable('polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => user.id),
  question: text('question').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const pollOptions = pgTable('poll_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollId: uuid('poll_id')
    .notNull()
    .references(() => polls.id, { onDelete: 'cascade' }),
  optionText: varchar('option_text', { length: 255 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const pollVotes = pgTable('poll_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollId: uuid('poll_id')
    .notNull()
    .references(() => polls.id, { onDelete: 'cascade' }),
  pollOptionId: uuid('poll_option_id')
    .notNull()
    .references(() => pollOptions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const complaints = pgTable('complaints', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  flatId: uuid('flat_id')
    .notNull()
    .references(() => flats.id, { onDelete: 'cascade' }),
  raisedBy: uuid('raised_by')
    .notNull()
    .references(() => user.id),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description').notNull(),
  status: complaintStatusEnum('status').notNull().default('open'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
