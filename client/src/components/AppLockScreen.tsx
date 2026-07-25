import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppLock } from '@/hooks/useAppLock';
import { Screen } from '@/components/Screen';

/**
 * Rendered in place of the whole app (see app/_layout.tsx) while
 * `useAppLock().locked` is true. `attemptUnlock` is fired automatically on
 * entering the locked state, so this mainly covers the "Face ID failed /
 * user dismissed the prompt" case with a manual retry.
 */
export function AppLockScreen() {
  const { attemptUnlock } = useAppLock();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen className="flex-1 bg-background items-center justify-center px-8" edges={[]}>
      <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
        <Ionicons name="lock-closed-outline" size={32} color={theme.primary} />
      </View>
      <Text className="text-xl font-serif-semibold text-foreground mb-2 text-center">
        Portl is Locked
      </Text>
      <Text className="text-sm font-sans text-muted text-center mb-8">
        Verify with Face ID, fingerprint, or your device passcode to continue.
      </Text>
      <Pressable
        onPress={attemptUnlock}
        className="px-6 py-3.5 rounded-xl bg-primary active:bg-primary/90 flex-row items-center gap-2"
      >
        <Ionicons name="finger-print-outline" size={18} color={theme.primaryForeground} />
        <Text className="text-primary-foreground font-sans-semibold text-sm">Try Again</Text>
      </Pressable>
    </Screen>
  );
}
