import { apiRequest } from '@/lib/api';

// Moved here from the visitors feature (Chapter 16), mirroring the same
// move on the server — the register endpoint was pulled forward into
// Chapter 7 since Visitor Management was the first thing that needed a
// push, but it's always belonged to a notifications module conceptually.

export async function registerPushToken(payload: { expoPushToken: string; deviceId?: string }) {
  return apiRequest<{ id: string }>('/api/notifications/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// New in Chapter 16 — called on logout so a stale device doesn't keep
// receiving pushes for a session that's no longer active on it. The token
// travels as a path segment, and Expo tokens contain `[`/`]`, so it must be
// URL-encoded.
export async function unregisterPushToken(expoPushToken: string) {
  return apiRequest<{ message: string }>(
    `/api/notifications/unregister/${encodeURIComponent(expoPushToken)}`,
    { method: 'DELETE' }
  );
}
