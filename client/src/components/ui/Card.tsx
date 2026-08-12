import { View, type ViewProps } from 'react-native';
import { PressableScale } from './PressableScale';

type CardProps = ViewProps & {
  className?: string;
  /** When provided, the card becomes tappable with the scale micro-interaction. */
  onPress?: () => void;
};

/**
 * The standard surface card — bg-card, hairline border, 2xl radius.
 * Pass onPress for a tappable card (gets the press-scale animation).
 */
export function Card({ className, onPress, children, ...props }: CardProps) {
  const classes = `bg-card border border-border rounded-2xl ${className ?? ''}`;

  if (onPress) {
    return (
      <PressableScale className={classes} onPress={onPress}>
        {children}
      </PressableScale>
    );
  }

  return (
    <View className={classes} {...props}>
      {children}
    </View>
  );
}
