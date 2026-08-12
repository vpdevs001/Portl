import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  className?: string;
};

/**
 * Selectable filter/option chip — gold fill when active, card outline
 * otherwise. Used for category pickers, filter rows and option strips.
 */
export function Chip({ label, selected, onPress, icon, className }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
        selected ? 'bg-primary border-primary' : 'bg-card border-border'
      } ${className ?? ''}`}
    >
      {icon ? (
        <Ionicons
          name={icon as never}
          size={15}
          color={selected ? theme.primaryForeground : theme.foregroundSecondary}
        />
      ) : null}
      <Text
        className={`text-xs font-sans-bold ${
          selected ? 'text-primary-foreground' : 'text-foreground-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
