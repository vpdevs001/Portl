import { apiRequest } from '@/lib/api';
import { apiRequestOfflineAware } from '@/lib/offline-mutation';

export type VisitorRequest = {
  id: string;
  name: string;
  phone?: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'checked_in' | 'completed';
  visitorType: 'guest' | 'delivery' | 'cab' | 'service_staff' | 'admin_visitor';
  approverType?: 'resident' | 'admin';
  vehicleNumber?: string;
  photo?: string;
  createdAt: string;
  flat?: { number?: string; name?: string; flatNumber?: string };
  createdByUser?: { name?: string };
  deliveryDetails?: { companyName?: string; orderId?: string };
  cabDetails?: { providerName?: string; vehicleNumber?: string; driverName?: string };
  serviceStaffDetails?: { serviceType?: string; companyName?: string };
};

export async function fetchPendingVisitors() {
  return apiRequest<VisitorRequest[]>('/api/visitors/pending');
}

// Mirrors the Zod schema in server/src/modules/visitors/visitors.schema.ts —
// no shared types package between server/client (standing project decision),
// so keep the two manually in sync.
export type CreateVisitorRequestInput = {
  visitorType: VisitorRequest['visitorType'];
  name: string;
  phone?: string;
  purpose?: string;
  vehicleNumber?: string;
  flatId?: string;
  approverType: 'resident' | 'admin';
  source: 'guard_request' | 'pre_approval';
  photo?: string;
  details?:
    | { companyName: string; orderId?: string }
    | { providerName: string; vehicleNumber?: string; driverName?: string }
    | { serviceType: string; companyName?: string };
};

export async function createVisitorRequest(payload: CreateVisitorRequestInput) {
  return apiRequest<VisitorRequest>('/api/visitors/request', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function respondToVisitorRequest(id: string, status: 'approved' | 'rejected') {
  return apiRequest<VisitorRequest>(`/api/visitors/request/${id}/respond`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

export async function logVisitorEntry(id: string) {
  // Chapter 17 — queues locally via SQLite if the gate loses connectivity
  // mid-shift, rather than failing the guard's tap outright.
  return apiRequestOfflineAware<{ id: string }>(
    `/api/visitors/request/${id}/log-entry`,
    { method: 'POST', body: JSON.stringify({}) },
    { id: 'queued-offline' }
  );
}

export async function logVisitorExit(id: string) {
  return apiRequestOfflineAware<{ id: string }>(
    `/api/visitors/request/${id}/log-exit`,
    { method: 'POST', body: JSON.stringify({}) },
    { id: 'queued-offline' }
  );
}

export async function uploadVisitorPhoto(payload: {
  fileName: string;
  contentType: string;
  base64: string;
}) {
  return apiRequest<{ url: string }>('/api/upload', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// registerPushToken moved to features/notifications/services/notifications.ts (Chapter 16)

// ─── Chapter 8 — Pre-Approvals ──────────────────────────────────────────────

export type PreApproval = VisitorRequest & {
  passCode?: string;
  validFrom?: string;
  validUntil?: string;
  isInside?: boolean;
};

export async function createPreApproval(payload: {
  name: string;
  phone?: string;
  purpose?: string;
  visitorType?: 'guest' | 'delivery' | 'cab' | 'service_staff';
  validFrom?: string;
  validUntil: string;
}) {
  return apiRequest<PreApproval>('/api/visitors/pre-approve', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchPreApprovals() {
  return apiRequest<PreApproval[]>('/api/visitors/pre-approvals');
}

export async function verifyPass(payload: { passCode?: string; requestId?: string }) {
  return apiRequest<PreApproval>('/api/visitors/verify-pass', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchCheckedInVisitors() {
  return apiRequest<VisitorRequest[]>('/api/visitors/checked-in');
}
