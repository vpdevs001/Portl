import { apiRequest } from '@/lib/api';

export type VisitorRequest = {
  id: string;
  name: string;
  phone?: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
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

export async function createVisitorRequest(payload: Record<string, unknown>) {
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
  return apiRequest<{ id: string }>(`/api/visitors/request/${id}/log-entry`, {
    method: 'POST'
  });
}

export async function logVisitorExit(id: string) {
  return apiRequest<{ id: string }>(`/api/visitors/request/${id}/log-exit`, {
    method: 'POST'
  });
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

export async function registerPushToken(payload: { expoPushToken: string; deviceId?: string }) {
  return apiRequest<{ id: string }>('/api/notifications/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ─── Chapter 8 — Pre-Approvals ──────────────────────────────────────────────

export type PreApproval = VisitorRequest & {
  passCode?: string;
  validFrom?: string;
  validUntil?: string;
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
