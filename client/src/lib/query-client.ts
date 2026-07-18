import { QueryClient } from '@tanstack/react-query';

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
  }
});
