import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * iOS-style segmented control (bg-surface track, raised card thumb) — the
 * pattern previously hand-rolled in gate logs, resident search, verify pass
 * and the appearance picker. Fires a selection haptic on change.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      className={`flex-row bg-surface border border-border/50 rounded-xl p-1 gap-1 ${className ?? ''}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                Haptics.selectionAsync().catch(() => undefined);
                onChange(option.value);
              }
            }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${
              active ? 'bg-card border border-border/60' : ''
            }`}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon as never}
                size={14}
                color={active ? theme.primary : theme.foregroundSecondary}
              />
            ) : null}
            <Text
              className={`text-xs font-sans-bold ${
                active ? 'text-primary' : 'text-foreground-secondary'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
