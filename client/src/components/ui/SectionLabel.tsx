import { Text } from 'react-native';

/** The app's recurring small-caps gold section label. */
export function SectionLabel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-xs font-sans-bold text-primary uppercase tracking-wider ${className ?? ''}`}
    >
      {children}
    </Text>
  );
}
