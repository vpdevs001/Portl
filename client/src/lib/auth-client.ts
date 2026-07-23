import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import type { BetterAuthClientPlugin } from 'better-auth/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: 'portl',
      storagePrefix: 'portl',
      storage: SecureStore
    }) as BetterAuthClientPlugin,
    // Mirrors server/src/lib/auth.ts's user.additionalFields by convention —
    // no shared types package between server/client (standing project
    // decision), so keep these two definitions manually in sync.
    inferAdditionalFields({
      user: {
        societyId: { type: 'string', required: false },
        flatId: { type: 'string', required: false },
        role: { type: ['resident', 'security_guard', 'society_admin'], required: false },
        phone: { type: 'string', required: false },
        isActive: { type: 'boolean', required: false }
      }
    })
  ]
});

export type AppRole = 'resident' | 'security_guard' | 'society_admin';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  societyId?: string | null;
  flatId?: string | null;
  role?: AppRole | null;
  phone?: string | null;
  isActive?: boolean | null;
};

type BaseSessionHook = ReturnType<typeof authClient.useSession>;
type BaseSessionData = NonNullable<BaseSessionHook['data']>;
export type AppSession = Omit<BaseSessionData, 'user'> & { user: AppUser };

export function useAppSession() {
  return authClient.useSession() as Omit<BaseSessionHook, 'data'> & {
    data: AppSession | null | undefined;
  };
}
