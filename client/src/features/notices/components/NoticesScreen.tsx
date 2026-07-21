import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * NoticesScreen — shared screen for all roles.
 *
 * The tab is role-gated at the *action* level, not the screen level:
 *   - society_admin: sees a "Create Notice" affordance (Chapter 10)
 *   - resident / security_guard: sees the read-only notices feed (Chapter 10)
 *
 * This placeholder exists to prove the role-gating pattern is wired
 * correctly. The real empty state design and data fetching are Chapter 10's
 * work — do not design them here.
 */
export function NoticesScreen() {
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
            <Text className="text-2xl font-serif-bold text-foreground">Notices</Text>
            <Text className="text-xs font-sans text-muted mt-1">Estate announcements</Text>
          </View>
          {/* Admin gets a visible but non-functional create affordance */}
          {isAdmin && (
            <View className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex-row items-center gap-1">
              <Ionicons name="add" size={14} color={theme.primary} />
              <View>
                <Text className="text-xs font-sans-bold text-primary">Create Notice</Text>
                <Text className="text-[9px] font-sans text-muted text-center">(Chapter 10)</Text>
              </View>
            </View>
          )}
        </View>

        {/* Role-gated placeholder body */}
        <View className="flex-1 items-center justify-center gap-3 pb-20">
          <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
            <Ionicons name="megaphone-outline" size={24} color={theme.primary} />
          </View>

          {isAdmin ? (
            <>
              <Text className="text-base font-serif-semibold text-foreground text-center">
                No notices yet
              </Text>
              <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
                Create Notice (Chapter 10) — as society admin, you&apos;ll be able to publish
                announcements to all residents and staff from here.
              </Text>
            </>
          ) : (
            <>
              <Text className="text-base font-serif-semibold text-foreground text-center">
                No notices yet
              </Text>
              <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
                Notices feed (Chapter 10) — announcements from your society admin will appear here.
              </Text>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
