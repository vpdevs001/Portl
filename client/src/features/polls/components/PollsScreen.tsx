import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Text, View, useColorScheme } from 'react-native';

/**
 * PollsScreen — shared screen for all roles.
 *
 * The tab is role-gated at the *action* level, not the screen level:
 *   - society_admin: sees a "Create Poll" affordance (Chapter 11)
 *   - resident / security_guard: sees the vote-only polls feed (Chapter 11)
 *
 * This placeholder exists to prove the role-gating pattern is wired
 * correctly. The real empty state design and data fetching are Chapter 11's
 * work — do not design them here.
 */
export function PollsScreen() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === 'society_admin';
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <View className="mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-serif-bold text-foreground">Polls</Text>
            <Text className="text-xs font-sans text-muted mt-1">Society decisions &amp; votes</Text>
          </View>
          {/* Admin gets a visible but non-functional create affordance */}
          {isAdmin && (
            <View className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex-row items-center gap-1">
              <Ionicons name="add" size={14} color={theme.primary} />
              <View>
                <Text className="text-xs font-sans-bold text-primary">Create Poll</Text>
                <Text className="text-[9px] font-sans text-muted text-center">(Chapter 11)</Text>
              </View>
            </View>
          )}
        </View>

        {/* Role-gated placeholder body */}
        <View className="flex-1 items-center justify-center gap-3 pb-20">
          <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
            <Ionicons name="stats-chart-outline" size={24} color={theme.primary} />
          </View>

          {isAdmin ? (
            <>
              <Text className="text-base font-serif-semibold text-foreground text-center">
                No polls yet
              </Text>
              <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
                Create Poll (Chapter 11) — as society admin, you&apos;ll be able to create polls and
                collect votes from residents directly from here.
              </Text>
            </>
          ) : (
            <>
              <Text className="text-base font-serif-semibold text-foreground text-center">
                No polls yet
              </Text>
              <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
                Polls feed (Chapter 11) — polls created by your society admin will appear here for
                you to vote on.
              </Text>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
