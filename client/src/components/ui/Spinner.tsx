import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/hooks/useColorScheme';

type SpinnerProps = {
  size?: 'small' | 'large';
  /** Override color — defaults to the theme primary. */
  color?: string;
  className?: string;
};

/** Themed ActivityIndicator — never reach for a raw hex color again. */
export function Spinner({ size = 'small', color, className }: SpinnerProps) {
  const theme = useTheme();
  return <ActivityIndicator size={size} color={color ?? theme.primary} className={className} />;
}

/** Full-area centered loading state, used while a screen's first load runs. */
export function LoadingScreen() {
  const theme = useTheme();
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}
