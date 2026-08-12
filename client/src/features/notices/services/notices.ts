import { apiRequest } from '@/lib/api';

export type NoticeCategory = 'emergency' | 'maintenance' | 'event' | 'general';

export type Notice = {
  id: string;
  title: string;
  description: string;
  category: NoticeCategory;
  // Null = no expiry, stays visible indefinitely.
  expiresAt: string | null;
  createdAt: string;
  createdByUser?: { id: string; name: string };
};

export type CreateNoticeInput = {
  title: string;
  description: string;
  category?: NoticeCategory;
  expiresAt?: string;
};

// Omit-then-extend: a plain `Partial & { expiresAt?: string | null }`
// intersection would narrow expiresAt back to `string | undefined` — the
// null matters, it's how an edit clears an existing expiry.
export type UpdateNoticeInput = Omit<Partial<CreateNoticeInput>, 'expiresAt'> & {
  expiresAt?: string | null;
};

export async function fetchNotices(includeExpired = false) {
  const query = includeExpired ? '?includeExpired=true' : '';
  return apiRequest<Notice[]>(`/api/notices${query}`);
}

export async function createNotice(payload: CreateNoticeInput) {
  return apiRequest<Notice>('/api/notices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateNotice(id: string, payload: UpdateNoticeInput) {
  return apiRequest<Notice>(`/api/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteNotice(id: string) {
  return apiRequest<{ id: string }>(`/api/notices/${id}`, {
    method: 'DELETE'
  });
}

// Chapter 17 — guard-only broadcast, always category 'emergency'. Backed by
// its own endpoint rather than createNotice, so a guard can only ever send
// this narrow shape.
export async function createEmergencyAlert(payload: { title: string; description: string }) {
  return apiRequest<Notice>('/api/notices/emergency-alert', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
