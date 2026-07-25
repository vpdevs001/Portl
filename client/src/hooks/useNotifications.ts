import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { useRegisterPushToken } from '@/features/notifications/hooks/use-notifications';

// Chapter 16 — adds the notification-tap listener and deep-link redirect on
// top of the registration-only version pulled forward into Chapter 7. Every
// notification's `data` payload now follows the standard envelope built on
// the server (`common/services/push.service.ts`):
//
//   { screen: '/(app)/notices', params: { noticeId: '...' } }
//
// `screen` is an Expo Router pathname, `params` are passed straight through
// to `router.push`.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

type NotificationData = {
  screen?: string;
  params?: Record<string, unknown>;
};

/**
 * Registers the device's Expo push token with the backend and wires up
 * tap-to-navigate. Call once from an authenticated screen (the (app)
 * layout) — registration is a no-op if permissions are denied or this is a
 * simulator/emulator without a real push token.
 */
export function useNotifications() {
  const registerToken = useRegisterPushToken();
  const router = useRouter();
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

  useEffect(() => {
    function navigateFromNotification(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as NotificationData | undefined;

      if (!data?.screen) return;

      // `screen` comes from the server, so Expo Router's static route typing
      // (`typedRoutes: true` in app.json) can't verify it at compile time —
      // this is the one deliberate escape hatch, same idea as a server-driven
      // redirect URL elsewhere in the app.
      router.push({
        pathname: data.screen,
        params: data.params as Record<string, string> | undefined
      } as Href);
    }

    // Cold start: app was killed and the person tapped a notification to
    // open it. Warm/background taps are covered by the listener below.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) navigateFromNotification(response);
    });

    const subscription =
      Notifications.addNotificationResponseReceivedListener(navigateFromNotification);

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
