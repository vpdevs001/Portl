import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { authClient } from '@/lib/auth-client';

export default function Index() {
  const { data: session, isPending } = authClient.useSession();
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

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.subtitle}>{session.user.name}</Text>
        <Text style={styles.email}>{session.user.email}</Text>
        <Button title="Sign out" onPress={handleSignOut} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portl</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={isSigningIn ? 'Signing in…' : 'Continue with Google'}
        onPress={handleGoogleSignIn}
        disabled={isSigningIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  error: {
    color: '#c0392b',
    textAlign: 'center',
    marginBottom: 8
  }
});
