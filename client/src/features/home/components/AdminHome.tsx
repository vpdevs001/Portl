import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  usePendingVisitors,
  useRespondToVisitorRequest
} from '@/features/visitors/hooks/use-visitors';
import { VisitorResidentCard } from './VisitorResidentCard';
import { ActivityIndicator, ScrollView, Text, View, useColorScheme } from 'react-native';

/**
 * AdminHome — the society_admin Home tab content.
 *
 * Chapter 7 wires this to the live admin-routed visitor queue (requests
 * with approverType = 'admin' — e.g. prospective flat buyers or anyone
 * whose approval authority is the admin rather than a specific flat).
 *
 * The full admin console (residents, flats, towers, staff directory, dues,
 * complaint resolution, amenities) is intentionally deferred — that's a
 * full-screen drawer that hides the tab bar while browsing, a context
 * shift rather than a tab-level sub-screen, and lands in a later chapter.
 */
export function AdminHome() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading } = usePendingVisitors();
  const respond = useRespondToVisitorRequest();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">Admin Dashboard</Text>
          <Text className="text-xs font-sans text-muted mt-1">
            Visitor requests routed to you
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            {!data || data.length === 0 ? (
              <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-border p-6 min-h-[220px]">
                <Ionicons name="shield-checkmark-outline" size={28} color={theme.primary} />
                <Text className="text-base font-serif-semibold text-foreground mt-3">
                  No pending approvals
                </Text>
                <Text className="text-sm font-sans text-foreground-secondary text-center mt-2 px-4">
                  Admin-routed visitor requests — like prospective buyers — will appear here.
                </Text>
              </View>
            ) : (
              data.map((request) => (
                <VisitorResidentCard
                  key={request.id}
                  request={request}
                  onRespond={(id, status) => respond.mutate({ id, status })}
                />
              ))
            )}
          </ScrollView>
        )}

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
    </Screen>
  );
}
