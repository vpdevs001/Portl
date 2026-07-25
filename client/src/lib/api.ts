import { authClient } from './auth-client';
import { ApiError } from './errors';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiEnvelope<T> = { success: true; data: T };

/** Shape of our server's error envelope — see server/src/common/http/app-response.ts. */
type ServerErrorBody = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

/**
 * Defensive fallback for a response that came back but wasn't our JSON
 * envelope at all (e.g. a proxy/load-balancer's HTML error page, or a 502
 * from a host that never reached our app) — status is still meaningful even
 * when there's no `error.message` to read.
 */
function fallbackMessageForStatus(status: number): string {
  if (status >= 500) return 'Something went wrong on our end. Please try again.';
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 401) return 'Please sign in again to continue.';
  if (status === 403) return "You don't have permission to do that.";
  if (status === 429) return "You're doing that too much — please wait a moment and try again.";
  return 'That request could not be completed. Please try again.';
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  // authClient.$fetch's internal baseURL always has "/api/auth" appended by
  // Better Auth itself (it's scoped to Better Auth's own routes, e.g.
  // get-session, sign-in/social — not our app's routes). Passing a relative
  // path like "/api/societies" here would resolve against that auth-scoped
  // base and produce ".../api/auth/api/societies", which is wrong.
  //
  // Fix: build the full absolute URL against our own API base and pass that
  // in instead. better-fetch treats any URL starting with "http" as already
  // absolute and uses it as-is, ignoring baseURL entirely — while still
  // routing through this same $fetch instance, so @better-auth/expo's
  // session-cookie attachment hooks (which are wired specifically to this
  // instance) still fire correctly.
  const hasBody = options?.body !== undefined && options.body !== null;
  const requestOptions: RequestInit = { ...options };

  if (hasBody) {
    requestOptions.headers = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> | undefined)
    };
  } else if (options?.headers) {
    requestOptions.headers = options.headers;
  }

  let result: Awaited<ReturnType<typeof authClient.$fetch<ApiEnvelope<T>>>>;
  try {
    result = await authClient.$fetch<ApiEnvelope<T>>(`${API_BASE_URL}${path}`, requestOptions);
  } catch {
    // authClient.$fetch throws (rather than returning `{ error }`) when the
    // request never got a response at all — device offline, DNS failure,
    // server unreachable. There's no status/body to read here.
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      "Can't reach the server. Check your internet connection and try again."
    );
  }

  const { data, error } = result;

  if (error) {
    // better-auth's $fetch (built on better-fetch) puts `status`/`statusText`
    // alongside whatever JSON body the server sent, spread in directly — it
    // does NOT put the message at `error.message`. Our server always
    // responds with `{ success: false, error: { code, message, details } }`
    // (see server/src/common/http/app-response.ts), so the real message
    // lives at `error.error.message`. Reading `error.message` here (the
    // previous bug) is always `undefined`, which is why every failure used
    // to render as a bare "Error 404" / "Error 500" instead of a real message.
    const body = error as unknown as Partial<ServerErrorBody> & {
      status: number;
      statusText?: string;
    };

    if (body.error?.message) {
      throw new ApiError(
        body.status,
        body.error.code ?? 'UNKNOWN',
        body.error.message,
        body.error.details
      );
    }

    // We got a response, but it wasn't our JSON envelope (e.g. an HTML error
    // page from a proxy, or a stripped body on some infra failure).
    throw new ApiError(body.status, 'UNKNOWN', fallbackMessageForStatus(body.status));
  }

  return data.data;
}
