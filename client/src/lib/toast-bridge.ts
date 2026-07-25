/**
 * Tiny pub/sub so plain modules that aren't React components — namely
 * query-client.ts's global QueryCache/MutationCache error handlers — can
 * trigger a toast without importing React or reaching for a hook.
 *
 * `components/Toast.tsx`'s <ToastProvider> is the sole subscriber in
 * practice: it registers itself on mount and unregisters on unmount.
 */

export type ToastVariant = 'error' | 'success';

export type ToastListener = (message: string, variant: ToastVariant) => void;

let listener: ToastListener | null = null;

export function registerToastListener(next: ToastListener | null): void {
  listener = next;
}

/** Fire-and-forget — a no-op before <ToastProvider> has mounted. */
export function emitToast(message: string, variant: ToastVariant = 'error'): void {
  listener?.(message, variant);
}
