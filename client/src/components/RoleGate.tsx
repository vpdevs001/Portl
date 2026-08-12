import { type ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useAppSession, type AppRole } from '@/lib/auth-client';
import { LoadingScreen } from '@/components/ui/Spinner';

/**
 * Client-side route gate — the server already 403s cross-role API calls,
 * but without this a resident could still *open* guard/admin screens and
 * stare at a broken empty UI. Renders children only for the listed roles;
 * everyone else lands back on Home.
 */
export function RoleGate({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { data: session, isPending } = useAppSession();

  if (isPending) {
    return <LoadingScreen />;
  }

  const role = session?.user?.role;
  if (!role || !roles.includes(role)) {
    return <Redirect href="/(app)/home" />;
  }

  return <>{children}</>;
}
