import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { DrawerButton } from '@/components/DrawerButton';
import { PressableScale } from './PressableScale';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Show a back chevron on the left (router.back()). */
  showBack?: boolean;
  /** Show the global drawer button. */
  drawer?: boolean;
  /** Wire up a spinning-while-fetching refresh button on the right. */
  onRefresh?: () => void;
  isRefetching?: boolean;
  /** Extra content on the right side, before the refresh/drawer buttons. */
  right?: ReactNode;
  /**
   * 'lg' — big serif title + subtitle with a hairline divider, for the
   * top-level tab screens. 'md' (default) — compact centered title row for
   * pushed/stack screens.
   */
  size?: 'md' | 'lg';
};

/** Round bordered icon button used for header actions (refresh, etc.). */
export function HeaderIconButton({
  icon,
  onPress,
  spinning = false,
  label
}: {
  icon: string;
  onPress: () => void;
  spinning?: boolean;
  /** Accessibility label — falls back to a prettified icon name. */
  label?: string;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon.replace(/-outline$/, '').replace(/-/g, ' ')}
      className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
    >
      <Ionicons
        name={icon as never}
        size={18}
        color={theme.foreground}
        style={spinning ? { opacity: 0.4 } : undefined}
      />
    </PressableScale>
  );
}

/**
 * The one screen header. Kills the four slightly-different hand-rolled
 * header rows that were copy-pasted across every screen.
 */
export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  drawer = false,
  onRefresh,
  isRefetching = false,
  right,
  size = 'md'
}: ScreenHeaderProps) {
  const router = useRouter();
  const theme = useTheme();

  if (size === 'lg') {
    return (
      <View className="flex-row items-center justify-between pb-4 mb-2 border-b border-border/50">
        <View className="flex-row items-center gap-3 flex-1 pr-3">
          {drawer ? <DrawerButton /> : null}
          <View className="flex-1">
            <Text className="text-2xl font-serif-bold text-foreground" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-xs font-sans text-muted mt-0.5" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {right}
          {onRefresh ? (
            <HeaderIconButton icon="refresh" onPress={onRefresh} spinning={isRefetching} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between mb-4 gap-3">
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-6"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={theme.foreground} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text
          className={`text-lg font-serif-semibold text-foreground ${showBack ? 'text-center' : ''}`}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={`text-xs font-sans text-muted mt-0.5 ${showBack ? 'text-center' : ''}`}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        {right}
        {onRefresh ? (
          <HeaderIconButton icon="refresh" onPress={onRefresh} spinning={isRefetching} />
        ) : null}
        {drawer ? <DrawerButton /> : null}
      </View>
    </View>
  );
}
