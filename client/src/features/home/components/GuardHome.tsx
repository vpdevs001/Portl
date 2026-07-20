import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Text, View, useColorScheme } from 'react-native';

/**
 * GuardHome — placeholder for the security_guard Home tab content.
 *
 * Chapter 7 will replace this with the live visitor queue / register screen —
 * the guard's primary action surface: scan visitor QR codes, log walk-in
 * visitors, see pending approvals, and view the live gate log.
 *
 * No drawer, no extra navigation layer — action-first: the register / queue
 * is immediately visible on this screen, no extra tap required. This role's
 * Home tab is the highest-priority Chapter 7 deliverable.
 */
export function GuardHome() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">Guard Home</Text>
          <Text className="text-xs font-sans text-muted mt-1">
            Gate management &amp; visitor queue
          </Text>
        </View>

        {/* Placeholder body */}
        <View className="flex-1 items-center justify-center gap-4 pb-20">
          {/* Emblem */}
          <View className="w-16 h-16 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
            <Ionicons name="shield" size={28} color={theme.primary} />
          </View>

          <Text className="text-base font-serif-semibold text-foreground text-center">
            Guard Home
          </Text>
          <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
            Chapter 7 fills this with the live visitor queue and register — scan QR codes, log
            walk-in visitors, and manage gate approvals directly from this screen.
          </Text>

          <View className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl w-full">
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-1">
              Priority for Chapter 7
            </Text>
            <Text className="text-xs font-sans text-foreground-secondary leading-5">
              The guard Home tab is the highest-priority Chapter 7 deliverable — it&apos;s the most
              time-sensitive, action-critical screen in the app.
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
