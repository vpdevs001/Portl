import { Ionicons } from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { useDrawer } from '@/context/DrawerContext';
import { useTheme } from '@/hooks/useColorScheme';
import { PressableScale } from '@/components/ui/PressableScale';

export function DrawerButton() {
  const { openDrawer } = useDrawer();
  const theme = useTheme();

  return (
    <PressableScale
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        openDrawer();
      }}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel="Open navigation menu"
      className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
    >
      <Ionicons name="menu" size={22} color={theme.foreground} />
    </PressableScale>
  );
}
