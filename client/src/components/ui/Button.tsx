import { ActivityIndicator, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'dangerSoft' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ionicons name rendered before the label. */
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Fire a light haptic on press (default true). */
  haptic?: boolean;
  className?: string;
};

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-card border border-border',
  outline: 'border border-primary bg-transparent',
  danger: 'bg-danger',
  dangerSoft: 'bg-danger/10 border border-danger/20',
  ghost: 'bg-transparent'
};

const TEXT: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-foreground',
  outline: 'text-primary',
  danger: 'text-white',
  dangerSoft: 'text-danger',
  ghost: 'text-primary'
};

const SIZE_CONTAINER: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2.5 rounded-lg gap-1.5',
  md: 'px-4 py-3.5 rounded-xl gap-2',
  lg: 'px-5 py-4 rounded-xl gap-2'
};

const SIZE_TEXT: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

const SIZE_ICON: Record<ButtonSize, number> = { sm: 14, md: 17, lg: 18 };

/**
 * The one button. Replaces the app's copy-pasted Pressable+spinner combos.
 * Handles variants, loading spinner, icon, haptics and the press-scale
 * micro-interaction in one place.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  haptic = true,
  className
}: ButtonProps) {
  const theme = useTheme();

  const accent =
    variant === 'primary'
      ? theme.primaryForeground
      : variant === 'danger'
        ? '#ffffff'
        : variant === 'dangerSoft'
          ? theme.danger
          : variant === 'secondary'
            ? theme.foreground
            : theme.primary;

  const isDisabled = disabled || loading;

  function handlePress() {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  }

  return (
    <PressableScale
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`flex-row items-center justify-center ${SIZE_CONTAINER[size]} ${CONTAINER[variant]} ${
        isDisabled ? 'opacity-50' : ''
      } ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={accent} />
      ) : (
        <>
          {icon ? <Ionicons name={icon as never} size={SIZE_ICON[size]} color={accent} /> : null}
          <Text className={`font-sans-bold ${SIZE_TEXT[size]} ${TEXT[variant]}`}>{label}</Text>
        </>
      )}
    </PressableScale>
  );
}
