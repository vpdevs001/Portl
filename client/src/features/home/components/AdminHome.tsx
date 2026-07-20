import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Text, View, useColorScheme } from 'react-native';

/**
 * AdminHome — placeholder for the society_admin Home tab content.
 *
 * Chapter 7 will replace this with a dashboard overview section featuring
 * key estate metrics (pending approvals, active visitors, flagged complaints),
 * plus a full-screen drawer navigator that expands to cover the tab bar when
 * the admin enters the wider console (residents list, flats, towers, staff
 * directory, dues, complaint resolution, amenities).
 *
 * IMPORTANT — drawer placement note for Chapter 7:
 * The admin console drawer must cover the full screen (tab bar hidden while
 * browsing) rather than rendering as a docked side panel underneath the
 * persistent tab bar. This is intentional — the admin console is a context
 * shift, not a tab-level sub-screen. The drawer navigator will be attached
 * here (or in a dedicated AdminConsoleDrawer component it renders) and will
 * use Expo Router's modal presentation or a custom animated overlay that
 * toggles tabBar visibility, NOT the default docked-drawer pattern.
 */
export function AdminHome() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">Admin Dashboard</Text>
          <Text className="text-xs font-sans text-muted mt-1">
            Society administration overview
          </Text>
        </View>

        {/* Placeholder body */}
        <View className="flex-1 items-center justify-center gap-4 pb-20">
          {/* Gold emblem */}
          <View className="w-16 h-16 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
            <Ionicons name="shield-checkmark" size={28} color={theme.primary} />
          </View>

          <Text className="text-base font-serif-semibold text-foreground text-center">
            Admin Dashboard
          </Text>
          <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
            Chapter 7 builds this into a live dashboard overview — pending visitor approvals, estate
            metrics, and quick actions.
          </Text>

          {/* Admin console note */}
          <View className="mt-4 p-4 bg-surface border border-border/60 rounded-xl w-full">
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              Admin Console (Chapter TBD)
            </Text>
            <Text className="text-xs font-sans text-foreground-secondary leading-5">
              The full admin console — residents, flats, towers, staff directory, dues, complaints,
              amenities — will open as a full-screen drawer that hides the tab bar while browsing,
              rather than a docked side panel.
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
