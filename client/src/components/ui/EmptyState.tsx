import { Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { FadeIn } from './FadeIn';

type EmptyStateProps = {
  icon: string;
  title: string;
  subtitle?: string;
  /**
   * 'boxed' — dashed-border panel (home dashboards). 'plain' — bare centered
   * layout for FlatList EmptyComponent slots.
   */
  variant?: 'boxed' | 'plain';
  className?: string;
};

/** Friendly empty placeholder with a soft entrance animation. */
export function EmptyState({
  icon,
  title,
  subtitle,
  variant = 'plain',
  className
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <FadeIn
      className={
        variant === 'boxed'
          ? `items-center justify-center rounded-2xl border border-dashed border-border p-6 min-h-[200px] ${className ?? ''}`
          : `items-center justify-center py-16 px-6 ${className ?? ''}`
      }
    >
      <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-3">
        <Ionicons name={icon as never} size={24} color={theme.primary} />
      </View>
      <Text className="text-base font-serif-semibold text-foreground text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-sm font-sans text-foreground-secondary text-center mt-2 leading-5 px-2">
          {subtitle}
        </Text>
      ) : null}
    </FadeIn>
  );
}
