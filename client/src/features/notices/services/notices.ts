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

export type UpdateNoticeInput = Partial<CreateNoticeInput> & { expiresAt?: string | null };

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
