import { Pressable, Text } from 'react-native';

type FilterPillProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
  className?: string;
};

// Small, compact selector button — used for status filters and category
// pickers throughout the app. Intentionally NOT `rounded-full`: a tighter
// `rounded-lg` reads as a button rather than a big pill/capsule.
export function FilterPill({ label, active, onPress, className = '' }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-lg border mr-2 ${
        active ? 'bg-primary border-primary' : 'bg-card border-border'
      } ${className}`}
    >
      <Text
        className={`text-xs font-sans-bold ${
          active ? 'text-primary-foreground' : 'text-foreground-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
