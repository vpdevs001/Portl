import { pgEnum } from 'drizzle-orm/pg-core';

// ===== IDENTITY & STRUCTURE =====

export const userRoleEnum = pgEnum('user_role', ['resident', 'security_guard', 'society_admin']);

// ===== VISITOR MANAGEMENT =====

export const visitorTypeEnum = pgEnum('visitor_type', [
  'guest',
  'delivery',
  'cab',
  'service_staff',
  'admin_visitor'
]);

export const approverTypeEnum = pgEnum('approver_type', ['resident', 'admin']);

export const visitorStatusEnum = pgEnum('visitor_status', [
  'pending',
  'approved',
  'rejected',
  'expired',
  'checked_in',
  'completed'
]);

export const visitorSourceEnum = pgEnum('visitor_source', [
  'guard_request',
  'pre_approval',
  'admin_initiated'
]);

// ===== COMMUNITY MANAGEMENT =====

export const complaintStatusEnum = pgEnum('complaint_status', [
  'open',
  'in_progress',
  'resolved',
  'closed'
]);

// ===== AMENITIES =====

export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled']);

// ===== MAINTENANCE & PAYMENTS =====

export const dueStatusEnum = pgEnum('due_status', ['pending', 'paid', 'overdue']);

export const paymentConfirmationStatusEnum = pgEnum('payment_confirmation_status', [
  'pending',
  'approved',
  'rejected'
]);

// ===== INVITATIONS =====

export const inviteStatusEnum = pgEnum('invite_status', [
  'pending',
  'accepted',
  'rejected',
  'cancelled'
]);
