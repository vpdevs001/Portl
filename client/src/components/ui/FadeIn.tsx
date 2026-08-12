import { type ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type FadeInProps = {
  children: ReactNode;
  /** Stagger position — each step adds 60ms of entrance delay (capped). */
  index?: number;
  className?: string;
};

/**
 * Shared entrance animation — a soft rise-and-fade used for screen sections
 * and list cards. Pass `index` to stagger siblings. Reanimated's `entering`
 * only fires on mount, so items don't re-animate when React Query refetches
 * in the background (keys stay stable).
 */
export function FadeIn({ index = 0, className, children }: FadeInProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 60)
        .duration(420)
        .springify()
        .damping(20)
        .stiffness(160)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
