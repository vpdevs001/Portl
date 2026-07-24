import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="complaints/manage" />
      <Stack.Screen name="amenities/logs" />
      <Stack.Screen name="amenities/create" />
      <Stack.Screen name="gate-logs" />
    </Stack>
  );
}
