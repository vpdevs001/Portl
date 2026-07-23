import { Stack } from 'expo-router';

export default function GuardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="register-visitor" />
      <Stack.Screen name="visitor-queue" />
      <Stack.Screen name="verify-pass" />
    </Stack>
  );
}
