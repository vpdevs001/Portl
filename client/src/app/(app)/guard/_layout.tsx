import { Stack } from 'expo-router';
import { View } from 'react-native';
import { OfflineSyncBanner } from '@/components/OfflineSyncBanner';

export default function GuardLayout() {
  return (
    <View className="flex-1 bg-background">
      <OfflineSyncBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="register-visitor" />
        <Stack.Screen name="visitor-queue" />
        <Stack.Screen name="verify-pass" />
        <Stack.Screen name="resident-search" />
        <Stack.Screen name="gate-logs" />
        <Stack.Screen name="emergency-alert" />
      </Stack>
    </View>
  );
}
