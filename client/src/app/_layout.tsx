import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/hooks/useColorScheme';
import { fontsToLoad } from '@/constants/fonts';
import { authClient } from '@/lib/auth-client';

import '../global.css';

SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

function RootNavigation() {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inAppGroup = segments[0] === '(app)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
    } else {
      const hasSociety = !!session.user?.societyId;

      if (!hasSociety) {
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)');
        }
      } else {
        if (!inAppGroup) {
          router.replace('/(app)/home');
        }
      }
    }
  }, [session, isPending, segments, router]);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#a9832e" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontsToLoad);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryProvider>
          <RootNavigation />
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
