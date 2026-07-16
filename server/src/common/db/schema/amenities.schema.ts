import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { societies, flats, users } from './identity.schema';
import { bookingStatusEnum } from './enums';

export const amenities = pgTable('amenities', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  capacity: integer('capacity'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const amenityBookings = pgTable('amenity_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  amenityId: uuid('amenity_id')
    .notNull()
    .references(() => amenities.id, { onDelete: 'cascade' }),
  flatId: uuid('flat_id')
    .notNull()
    .references(() => flats.id, { onDelete: 'cascade' }),
  bookedBy: uuid('booked_by')
    .notNull()
    .references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
