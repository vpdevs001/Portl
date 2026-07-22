import { Pressable } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useDrawer } from '@/context/DrawerContext';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function DrawerButton() {
  const { openDrawer } = useDrawer();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      onPress={openDrawer}
      className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center active:bg-surface"
    >
      <Ionicons name="menu" size={22} color={theme.foreground} />
    </Pressable>
  );
}
