import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useColorScheme';

type InputProps = TextInputProps & {
  className?: string;
};

/**
 * Themed TextInput — card background, hairline border, theme-aware
 * placeholder color (the old screens hardcoded the light-mode gray, which
 * glowed in dark mode).
 */
export function Input({ className, placeholderTextColor, ...props }: InputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? theme.muted}
      className={`bg-card border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground ${className ?? ''}`}
      {...props}
    />
  );
}

/** Uppercase gold section label + control, the app's standard form row. */
export function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`mb-4 ${className ?? ''}`}>
      <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
}
