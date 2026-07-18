import { useEffect, type PropsWithChildren } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

// TanStack Query's `refetchOnWindowFocus` is a browser concept — there is no
// window-focus event on React Native. This listener bridges app
// foreground/background state into TanStack's focusManager so
// refetchOnWindowFocus (set in query-client.ts) actually does something on
// iOS/Android instead of silently never firing.
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
