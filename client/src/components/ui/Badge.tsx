import { Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'muted' | 'info';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Ionicons name rendered before the label. */
  icon?: string;
  className?: string;
};

// Static class maps — Tailwind scans at build time, so dynamic
// `bg-${tone}/10` strings would never be generated.
const BG: Record<BadgeTone, string> = {
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  danger: 'bg-danger/10',
  muted: 'bg-muted/10',
  info: 'bg-info/10'
};

const TEXT: Record<BadgeTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-muted',
  info: 'text-info'
};

/** Status pill — uppercase micro-label with a tinted background. */
export function Badge({ label, tone = 'muted', icon, className }: BadgeProps) {
  const theme = useTheme();

  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${BG[tone]} ${className ?? ''}`}
    >
      {icon ? <Ionicons name={icon as never} size={11} color={theme[tone]} /> : null}
      <Text className={`text-[10px] font-sans-bold uppercase tracking-wider ${TEXT[tone]}`}>
        {label}
      </Text>
    </View>
  );
}
