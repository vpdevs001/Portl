import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { authClient } from '@/lib/auth-client';

export default function SignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/'
    });

    if (signInError) {
      setError(signInError.message ?? 'Google sign-in failed');
    }

    setIsSigningIn(false);
  };

  return (
    <View className="flex-1 bg-background justify-between px-6 py-16">
      {/* Top spacing / empty view */}
      <View />

      {/* Hero Branding */}
      <View className="items-center gap-4">
        {/* Decorative gold emblem */}
        <View className="w-16 h-16 rounded-full border border-primary/30 bg-card items-center justify-center mb-6">
          <Text className="text-primary font-serif-semibold text-3xl">P</Text>
        </View>

        <Text className="text-4xl font-serif-bold text-foreground text-center">Portl</Text>
        <Text className="text-base font-sans text-foreground-secondary text-center px-4">
          A secure gateway to your private estate, towers, and flat management.
        </Text>
      </View>

      {/* Call to Actions */}
      <View className="gap-4 w-full">
        {error ? (
          <View className="p-3 bg-danger/10 border border-danger/20 rounded-xl mb-4">
            <Text className="text-danger font-sans text-center text-sm">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isSigningIn}
          className={`w-full py-4 rounded-xl items-center justify-center flex-row gap-3 bg-primary active:opacity-90 ${
            isSigningIn ? 'opacity-50' : ''
          }`}
        >
          {isSigningIn ? (
            <ActivityIndicator size="small" color="#1a1409" />
          ) : (
            <>
              {/* Gold text on dark primary foreground */}
              <Text className="text-primary-foreground font-sans-semibold text-base">
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Text className="text-xs font-sans text-muted text-center mt-4">
          By signing in, you agree to Portl&apos;s terms of service and security policy.
        </Text>
      </View>
    </View>
  );
}
