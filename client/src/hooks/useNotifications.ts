import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRegisterPushToken } from '@/features/visitors/hooks/use-visitors';

// Minimal version, pulled forward from Chapter 16 since Chapter 7 (Visitor
// Management) is the first thing that actually needs to send a push.
// Chapter 16 later adds the notification-tap listener and deep-link
// redirects on top of this — this hook only handles registration.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

/**
 * Registers the device's Expo push token with the backend. Call once from
 * an authenticated screen (the (app) layout) — a no-op if permissions are
 * denied or this is a simulator/emulator without a real push token.
 */
export function useNotifications() {
  const registerToken = useRegisterPushToken();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    async function register() {
      // Push tokens aren't issued to simulators/emulators.
      if (!Device.isDevice) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      registerToken.mutate({
        expoPushToken: tokenResponse.data,
        deviceId: Device.osInternalBuildId ?? Device.modelId ?? undefined
      });
    }

    register().catch(() => {
      // Best-effort — the client-side 5s poll is still the fallback.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
