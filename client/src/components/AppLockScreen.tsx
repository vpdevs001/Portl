import { Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { useAppLock } from '@/hooks/useAppLock';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';

/**
 * Rendered in place of the whole app (see app/_layout.tsx) while
 * `useAppLock().locked` is true. `attemptUnlock` is fired automatically on
 * entering the locked state, so this mainly covers the "Face ID failed /
 * user dismissed the prompt" case with a manual retry.
 */
export function AppLockScreen() {
  const { attemptUnlock } = useAppLock();
  const theme = useTheme();

  return (
    <Screen className="flex-1 bg-background items-center justify-center px-8" edges={[]}>
      <Animated.View entering={ZoomIn.duration(500).springify().damping(16)}>
        <View className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 items-center justify-center mb-6">
          <Ionicons name="lock-closed-outline" size={32} color={theme.primary} />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).duration(400)} className="items-center">
        <Text className="text-xl font-serif-semibold text-foreground mb-2 text-center">
          Portl is Locked
        </Text>
        <Text className="text-sm font-sans text-muted text-center mb-8 leading-5">
          Verify with Face ID, fingerprint, or your device passcode to continue.
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(220).duration(400)}>
        <Button
          label="Unlock"
          icon="finger-print-outline"
          onPress={attemptUnlock}
          className="px-8"
        />
      </Animated.View>
    </Screen>
  );
}
