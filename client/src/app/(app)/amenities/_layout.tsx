import { Stack } from 'expo-router';

export default function AmenitiesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="book" />
    </Stack>
  );
}
