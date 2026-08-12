import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useTheme } from '@/hooks/useColorScheme';
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
  // Server-side scoped to the caller's own flat (see logs.service.ts).
  const { data, isLoading, refetch, isRefetching } = useGateLogs({ type: 'guest' });

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Visitor Entry History"
          subtitle="Guests logged at the gate for your flat"
          showBack
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <EmptyState
                icon="time-outline"
                title="No visitors yet"
                subtitle="No visitors logged for your flat yet."
              />
            }
            renderItem={({ item, index }) => (
              <FadeIn index={index}>
                <VisitorRow log={item} />
              </FadeIn>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

function VisitorRow({ log }: { log: GateLog }) {
  const theme = useTheme();

  return (
    <Card className="p-4 gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1.5">
            <Badge label="Guest" tone="success" />
            {log.isInside ? <Badge label="Inside" tone="success" /> : null}
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
    </Card>
  );
}
