import { QueryCache, QueryClient, MutationCache } from '@tanstack/react-query';
import { getErrorMessage } from './errors';
import { emitToast } from './toast-bridge';

// Type-safe `meta` — lets any query/mutation opt out of the global error
// toast below with `meta: { suppressErrorToast: true }` (checked at compile
// time instead of being an untyped bag of `unknown`).
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { suppressErrorToast?: boolean };
    mutationMeta: { suppressErrorToast?: boolean };
  }
}

// staleTime: 0 + refetchOnWindowFocus — deliberately aggressive rather than
// TanStack's usual defaults. Stale data at the gate (a guard looking at a
// visitor-approval queue) is a real product problem here, not just cosmetic
// staleness. Slower-changing data (notices, staff directory) should override
// staleTime per-query rather than relaxing this global default.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: 2
    }
  },
  // Any query/mutation can opt out of this global toast with
  // `meta: { suppressErrorToast: true }` — used by the handful of screens
  // that already render their own inline error banner for a given action, so
  // the person isn't told about the same failure twice.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressErrorToast) return;
      // Only surface a toast when this failure actually leaves the screen
      // with nothing to show (first load, or every retry failed and there's
      // no previously-cached data). A background refetch of a screen that's
      // already showing good data isn't worth interrupting the person for —
      // they'll get fresh data next time regardless.
      if (query.state.data !== undefined) return;
      emitToast(getErrorMessage(error), 'error');
    }
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressErrorToast) return;
      emitToast(getErrorMessage(error), 'error');
    }
  })
});
