import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

/** Pulsing placeholder block — use for loading lists instead of a spinner. */
export function Skeleton({ className }: { className?: string }) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={animatedStyle}
      className={`bg-surface border border-border/40 rounded-xl ${className ?? ''}`}
    />
  );
}

/** A card-shaped skeleton matching the standard list card silhouette. */
export function SkeletonCard() {
  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3 gap-3">
      <View className="flex-row items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </View>
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3.5 w-1/2" />
    </View>
  );
}

/** Stack of skeleton cards for first-load list screens. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
