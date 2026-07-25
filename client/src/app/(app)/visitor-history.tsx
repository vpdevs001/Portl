import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useGateLogs } from '@/features/logs/hooks/use-logs';
import type { GateLog } from '@/features/logs/services/logs';

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function VisitorHistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // Server-side scoped to the caller's own flat (see logs.service.ts).
  const { data, isLoading, refetch, isRefetching } = useGateLogs({ type: 'guest' });

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Visitor Entry History</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => refetch()}
              hitSlop={12}
              className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
            >
              <Ionicons
                name="refresh"
                size={18}
                color={theme.foreground}
                style={isRefetching ? { opacity: 0.4 } : undefined}
              />
            </Pressable>
            <DrawerButton />
          </View>
        </View>

        <Text className="text-xs font-sans text-muted mb-4">
          Guests logged at the gate for your flat
        </Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Ionicons name="time-outline" size={36} color={theme.muted} />
                <Text className="text-sm font-sans text-muted mt-4">
                  No visitors logged for your flat yet.
                </Text>
              </View>
            }
            renderItem={({ item }) => <VisitorRow log={item} />}
          />
        )}
      </View>
    </Screen>
  );
}

function VisitorRow({ log }: { log: GateLog }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="bg-card border border-border rounded-2xl p-4 gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="px-2 py-0.5 rounded-full bg-success/10">
              <Text className="text-[10px] font-sans-bold uppercase text-success">Guest</Text>
            </View>
            {log.isInside ? (
              <View className="px-2 py-0.5 rounded-full bg-success/10">
                <Text className="text-[10px] font-sans-bold text-success uppercase">Inside</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-sm font-sans-semibold text-foreground">{log.name}</Text>
          {log.subtitle ? (
            <Text className="text-xs font-sans text-muted mt-0.5">{log.subtitle}</Text>
          ) : null}
        </View>
        <Text className="text-[10px] font-sans text-muted">{formatDateLabel(log.entryTime)}</Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface border border-border/50 rounded-xl p-3">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="log-in-outline" size={12} color={theme.success} />
            <Text className="text-[10px] font-sans-bold text-muted uppercase">Entry</Text>
          </View>
          <Text className="text-sm font-mono-semibold text-foreground">
            {formatTime(log.entryTime)}
          </Text>
        </View>
        <View className="flex-1 bg-surface border border-border/50 rounded-xl p-3">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons
              name="log-out-outline"
              size={12}
              color={log.exitTime ? theme.foregroundSecondary : theme.muted}
            />
            <Text className="text-[10px] font-sans-bold text-muted uppercase">Exit</Text>
          </View>
          <Text className="text-sm font-mono-semibold text-foreground">
            {formatTime(log.exitTime)}
          </Text>
        </View>
      </View>
    </View>
  );
}
