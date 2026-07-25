import { apiRequest } from '@/lib/api';
import { enqueueOfflineAction } from '@/lib/offline-queue';

/**
 * Chapter 17 — distinguishes a network-layer failure from a real server
 * error (4xx/5xx). React Native's fetch throws a `TypeError` (e.g.
 * "Network request failed") when the request never reaches the network at
 * all; `apiRequest` throws a plain `Error` built from the server's own
 * response when the request *did* reach the backend. Only the former
 * should be queued — queuing after a real server error risks a double
 * write once connectivity returns and the original request also lands.
 */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

/**
 * Wraps `apiRequest` for the small set of guard gate-writes that need to
 * survive a dropped connection (see offline-queue.ts). On a network-layer
 * failure, queues the write to SQLite and resolves with `offlineResult`
 * instead of rejecting, so the caller's mutation still "succeeds" from the
 * guard's point of view — the UI doesn't stall waiting on a socket-less
 * gate. `useOfflineSync` replays the real request once connectivity is
 * back.
 */
export async function apiRequestOfflineAware<T>(
  path: string,
  options: RequestInit & { method: string },
  offlineResult: T
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }

    const payload =
      options.body !== undefined && options.body !== null
        ? JSON.parse(options.body as string)
        : null;
    await enqueueOfflineAction(path, options.method, payload);
    return offlineResult;
  }
}
