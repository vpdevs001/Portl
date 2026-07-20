import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
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
    }),
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
