import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { societies, flats } from './identity.schema';
import { approverTypeEnum, visitorSourceEnum, visitorStatusEnum, visitorTypeEnum } from './enums';

export const visitorRequests = pgTable('visitor_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  flatId: uuid('flat_id').references(() => flats.id, { onDelete: 'set null' }),
  visitorType: visitorTypeEnum('visitor_type').notNull(),
  approverType: approverTypeEnum('approver_type').notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  photo: text('photo'),
  purpose: text('purpose'),
  status: visitorStatusEnum('status').notNull().default('pending'),
  source: visitorSourceEnum('source').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => user.id),
  approvedBy: uuid('approved_by').references(() => user.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const deliveryDetails = pgTable('delivery_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorRequestId: uuid('visitor_request_id')
    .notNull()
    .references(() => visitorRequests.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 150 }).notNull(),
  orderId: varchar('order_id', { length: 100 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const cabDetails = pgTable('cab_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorRequestId: uuid('visitor_request_id')
    .notNull()
    .references(() => visitorRequests.id, { onDelete: 'cascade' }),
  providerName: varchar('provider_name', { length: 150 }).notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 30 }),
  driverName: varchar('driver_name', { length: 150 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const serviceStaffDetails = pgTable('service_staff_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorRequestId: uuid('visitor_request_id')
    .notNull()
    .references(() => visitorRequests.id, { onDelete: 'cascade' }),
  serviceType: varchar('service_type', { length: 100 }).notNull(),
  companyName: varchar('company_name', { length: 150 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});
