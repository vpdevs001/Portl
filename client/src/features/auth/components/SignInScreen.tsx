import { useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/Button';

export function SignInScreen() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use a ref as the primary re-entrance guard — setState is async and
  // a second tap can slip through between the press and the re-render.
  const inFlightRef = useRef(false);
  const theme = useTheme();

  const handleGoogleSignIn = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      // On Android, expo-web-browser keeps a module-level Linking subscription
      // (_redirectSubscription) across calls. If a previous session didn't
      // resolve cleanly (e.g. user pressed back), that subscription is still
      // set and the next openAuthSessionAsync throws "invalid state". Dismiss
      // any lingering session before we start a fresh one.
      if (Platform.OS === 'android') {
        try {
          WebBrowser.dismissAuthSession();
        } catch {}
      }

      const { error: signInError } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/'
      });

      if (signInError) {
        setError(signInError.message ?? 'Google sign-in failed');
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      // Swallow the "invalid state" error — it means the browser was already
      // open/closed without completing OAuth. Just reset so the user can retry.
      if (rawMessage.includes('invalid state')) {
        setError('Sign-in was interrupted. Please try again.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      inFlightRef.current = false;
      setIsSigningIn(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-between px-6 py-16">
      {/* Top spacing / empty view */}
      <View />

      {/* Hero Branding — staged entrance */}
      <View className="items-center gap-4">
        <Animated.View entering={ZoomIn.duration(600).springify().damping(15)}>
          <View className="w-20 h-20 rounded-3xl border border-primary/30 bg-card items-center justify-center mb-4">
            <Ionicons name="business" size={34} color={theme.primary} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500).springify().damping(18)}>
          <Text className="text-5xl font-serif-bold text-foreground text-center">Portl</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(500).springify().damping(18)}>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="w-6 h-px bg-primary/40" />
            <View className="w-1.5 h-1.5 rounded-full bg-primary" />
            <View className="w-6 h-px bg-primary/40" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(500).springify().damping(18)}>
          <Text className="text-base font-sans text-foreground-secondary text-center px-6 leading-6">
            The secure gateway to your private estate — visitors, dues, amenities and community, in
            one place.
          </Text>
        </Animated.View>
      </View>

      {/* Call to Actions */}
      <Animated.View
        entering={FadeInDown.delay(520).duration(500).springify().damping(18)}
        className="gap-4 w-full"
      >
        {error ? (
          <View className="p-3 bg-danger/10 border border-danger/20 rounded-xl mb-2">
            <Text className="text-danger font-sans text-center text-sm">{error}</Text>
          </View>
        ) : null}

        <Button
          label={isSigningIn ? 'Signing you in…' : 'Continue with Google'}
          icon={isSigningIn ? undefined : 'logo-google'}
          size="lg"
          loading={isSigningIn}
          onPress={handleGoogleSignIn}
          className="w-full"
        />

        <Text className="text-xs font-sans text-muted text-center mt-2">
          By signing in, you agree to Portl’s terms of service and security policy.
        </Text>
      </Animated.View>
    </View>
  );
}
