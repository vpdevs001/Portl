import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { authClient } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerButton } from '@/components/DrawerButton';

export function PollsScreen() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === 'society_admin';
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Top Header Bar with Drawer Button */}
        <View className="flex-row items-center justify-between pb-4 mb-4 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <DrawerButton />
            <View>
              <Text className="text-2xl font-serif-bold text-foreground">Polls</Text>
              <Text className="text-xs font-sans text-muted">Society decisions &amp; votes</Text>
            </View>
          </View>

          {/* Admin gets a visible create affordance */}
          {isAdmin && (
            <View className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex-row items-center gap-1">
              <Ionicons name="add" size={14} color={theme.primary} />
              <View>
                <Text className="text-xs font-sans-bold text-primary">Create Poll</Text>
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
                Create polls to collect votes &amp; community feedback on estate decisions.
              </Text>
            </>
          ) : (
            <>
              <Text className="text-base font-serif-semibold text-foreground text-center">
                No polls yet
              </Text>
              <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
                Active polls created by your society admin will appear here for voting.
              </Text>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
