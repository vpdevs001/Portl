import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Text, View, useColorScheme } from 'react-native';

/**
 * ResidentHome — placeholder for the resident Home tab content.
 *
 * Chapter 7 will replace this with the live approval-card feed — incoming
 * visitor requests the resident can approve or deny in real time, plus a
 * summary of recent gate activity at their flat.
 *
 * No drawer, no extra navigation layer — action-first: the approval cards
 * are the primary content, surface-level in the tab, no extra tap required.
 */
export function ResidentHome() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">Home</Text>
          <Text className="text-xs font-sans text-muted mt-1">
            Your gate &amp; visitor activity
          </Text>
        </View>

        {/* Placeholder body */}
        <View className="flex-1 items-center justify-center gap-4 pb-20">
          {/* Emblem */}
          <View className="w-16 h-16 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
            <Ionicons name="home" size={28} color={theme.primary} />
          </View>

          <Text className="text-base font-serif-semibold text-foreground text-center">
            Resident Home
          </Text>
          <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
            Chapter 7 fills this with live visitor approval cards — incoming gate requests you can
            approve or deny from this screen, no extra tap required.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
