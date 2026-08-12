import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { FadeIn } from '@/components/ui/FadeIn';

type OnboardingHeaderProps = {
  title: string;
  subtitle: string;
  /** Current 1-based step. Omit both step props to hide the progress bar. */
  step?: number;
  totalSteps?: number;
  showBack?: boolean;
};

/**
 * Shared hero header for the (onboarding) flow — big serif title, muted
 * subtitle, optional back link, and an animated gold progress bar that
 * tweens to the current step.
 */
export function OnboardingHeader({
  title,
  subtitle,
  step,
  totalSteps,
  showBack = false
}: OnboardingHeaderProps) {
  const router = useRouter();
  const theme = useTheme();

  const progress = useSharedValue(0);
  const pct = step && totalSteps ? Math.min(step / totalSteps, 1) : 0;

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 500 });
  }, [pct, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  return (
    <View className="mb-8">
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 py-1 mb-5 self-start"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={18} color={theme.primary} />
          <Text className="text-primary font-sans-medium text-sm">Back</Text>
        </Pressable>
      ) : null}

      {step && totalSteps ? (
        <View className="mb-5">
          <Text className="text-[11px] font-sans-bold text-primary uppercase tracking-wider mb-2">
            Step {step} of {totalSteps}
          </Text>
          <View className="h-1 rounded-full bg-surface overflow-hidden">
            <Animated.View className="h-1 rounded-full bg-primary" style={barStyle} />
          </View>
        </View>
      ) : null}

      <FadeIn>
        <Text className="text-3xl font-serif-bold text-foreground mb-3">{title}</Text>
        <Text className="text-sm font-sans text-foreground-secondary leading-5">{subtitle}</Text>
      </FadeIn>
    </View>
  );
}
