/**
 * Central place for turning "what the backend/network sent us" into
 * "what we tell the user". Every request goes through `apiRequest` (see
 * api.ts), which always throws an `ApiError` — so anywhere in the app that
 * catches a request failure should format it with `getErrorMessage` rather
 * than reading `error.message` directly or falling back to a raw status
 * code / generic string.
 */

/**
 * Thrown by `apiRequest` for every failed request. Mirrors the server's
 * error envelope (`{ success: false, error: { code, message, details } }` —
 * see server/src/common/http/app-response.ts) plus the HTTP status.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** True when the device never got a response at all (offline, DNS failure, server unreachable). */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'NETWORK_ERROR';
}

export const NETWORK_ERROR_MESSAGE =
  "Can't reach the server. Check your internet connection and try again.";

const TIMEOUT_ERROR_MESSAGE = 'That took too long to respond. Please try again.';

/**
 * Defensive fallback only — in practice every AppError the server throws
 * already carries a specific, user-facing `message` (see
 * server/src/common/errors/error-codes.ts for the full list of codes this
 * mirrors). This only kicks in if a response is somehow missing one.
 */
const FALLBACK_BY_CODE: Record<string, string> = {
  NOT_FOUND: "We couldn't find what you were looking for.",
  BAD_REQUEST: 'That request looks invalid. Please check the details and try again.',
  CONFLICT: 'That conflicts with something that already exists.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to do that.",
  VALIDATION_ERROR: 'Some of the details you entered are invalid.',
  INVALID_REFERENCE: 'One of the selected items no longer exists.',
  MISSING_FIELD: 'Please fill in all required fields.',
  DATABASE_ERROR: 'Something went wrong on our end. Please try again.',
  ROUTE_NOT_FOUND: "That page or action doesn't exist.",
  INTERNAL_SERVER_ERROR: 'Something went wrong on our end. Please try again.',
  AUTH_FAILURE: 'We had trouble signing you in. Please try again.',
  UPLOAD_FAILED: 'The file upload failed. Please try again.',
  RATE_LIMITED: "You're doing that too much — please wait a moment and try again."
};

/** Last-resort fallback, keyed by raw HTTP status, for responses with no JSON body at all. */
const FALLBACK_BY_STATUS: Record<number, string> = {
  400: 'That request was invalid. Please check the details and try again.',
  401: 'Please sign in again to continue.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  408: TIMEOUT_ERROR_MESSAGE,
  409: 'That conflicts with something that already exists.',
  429: "You're doing that too much — please wait a moment and try again.",
  500: 'Something went wrong on our end. Please try again.',
  502: 'Our server is temporarily unavailable. Please try again shortly.',
  503: 'Our server is temporarily unavailable. Please try again shortly.',
  504: TIMEOUT_ERROR_MESSAGE
};

const GENERIC_FALLBACK = 'Something went wrong. Please try again.';

/** A raw fetch-level failure's `.message` on iOS/Android/web — never shown to the user directly. */
function looksLikeNetworkFailure(message: string): boolean {
  return /network request failed|failed to fetch|load failed|the internet connection appears to be offline/i.test(
    message
  );
}

/**
 * Turn any caught error into a short, user-facing sentence.
 * Use this everywhere a request failure reaches the UI — Alert.alert,
 * inline error banners, toasts, etc. — instead of `error.message` directly.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      error.message ||
      FALLBACK_BY_CODE[error.code] ||
      FALLBACK_BY_STATUS[error.status] ||
      GENERIC_FALLBACK
    );
  }

  if (error instanceof Error) {
    if (looksLikeNetworkFailure(error.message)) {
      return NETWORK_ERROR_MESSAGE;
    }
    return error.message || GENERIC_FALLBACK;
  }

  return GENERIC_FALLBACK;
}
