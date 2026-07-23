import { authClient } from './auth-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiEnvelope<T> = { success: true; data: T };

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

  const { data, error } = await authClient.$fetch<ApiEnvelope<T>>(
    `${API_BASE_URL}${path}`,
    requestOptions
  );

  if (error) {
    throw new Error(error.message ?? `Error ${error.status}`);
  }

  return data.data;
}
