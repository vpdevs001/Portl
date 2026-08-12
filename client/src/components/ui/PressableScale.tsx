import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type PressableScaleProps = PressableProps & {
  /** Scale applied while pressed. Defaults to 0.97 — subtle, not rubbery. */
  scaleTo?: number;
  className?: string;
};

/**
 * Drop-in Pressable that adds a springy scale-down micro-interaction on
 * press. The animated wrapper owns only the transform — all styling still
 * lives on the inner Pressable's className, so Uniwind styles apply exactly
 * the same as a plain Pressable.
 */
export function PressableScale({
  scaleTo = 0.97,
  className,
  children,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...props}
        className={className}
        onPressIn={(event) => {
          // Reanimated shared values are ref-like — mutating .value inside an
          // event handler is the intended API, not a React state violation.
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          onPressOut?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
