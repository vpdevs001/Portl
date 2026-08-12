import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { Input } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/hooks/useColorScheme';
import { useGateLogs } from '@/features/logs/hooks/use-logs';
import type { GateLog } from '@/features/logs/services/logs';

type LogFilter = 'all' | 'resident' | 'staff' | 'guest';

const FILTER_OPTIONS: { value: LogFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'resident', label: 'Residents' },
  { value: 'staff', label: 'Staff' },
  { value: 'guest', label: 'Guests' }
];

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function GateLogsScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<LogFilter>('all');
  const [date] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading, refetch, isRefetching } = useGateLogs({
    search: search || undefined,
    type,
    date
  });

  const groupedSubtitle = useMemo(() => {
    const count = data?.length ?? 0;
    return `${count} log${count === 1 ? '' : 's'} today`;
  }, [data?.length]);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Gate logs"
          subtitle={groupedSubtitle}
          showBack
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        <View className="flex-row items-center bg-card border border-border rounded-xl px-3 mb-3">
          <Ionicons name="search-outline" size={18} color={theme.muted} />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, flat or role…"
            className="flex-1 ml-2 border-0 bg-transparent px-0"
          />
        </View>

        <SegmentedControl
          options={FILTER_OPTIONS}
          value={type}
          onChange={setType}
          className="mb-4"
        />

        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <EmptyState
                icon="journal-outline"
                title="No gate logs"
                subtitle="No gate logs for today yet."
              />
            }
            renderItem={({ item, index }) => (
              <FadeIn index={index}>
                <LogRow log={item} />
              </FadeIn>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

function LogRow({ log }: { log: GateLog }) {
  const theme = useTheme();

  return (
    <Card className="p-4 gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1.5">
            <TypeBadge type={log.type} />
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
        <TimeBlock
          label="Entry"
          time={formatTime(log.entryTime)}
          icon="log-in-outline"
          color={theme.success}
        />
        <TimeBlock
          label="Exit"
          time={formatTime(log.exitTime)}
          icon="log-out-outline"
          color={log.exitTime ? theme.foregroundSecondary : theme.muted}
        />
      </View>
    </Card>
  );
}

function TypeBadge({ type }: { type: GateLog['type'] }) {
  const tones: Record<GateLog['type'], BadgeTone> = {
    resident: 'primary',
    staff: 'warning',
    guest: 'success'
  };
  return <Badge label={type} tone={tones[type]} />;
}

function TimeBlock({
  label,
  time,
  icon,
  color
}: {
  label: string;
  time: string;
  icon: string;
  color: string;
}) {
  return (
    <View className="flex-1 bg-surface border border-border/50 rounded-xl p-3">
      <View className="flex-row items-center gap-1.5 mb-1">
        <Ionicons name={icon as never} size={12} color={color} />
        <Text className="text-[10px] font-sans-bold text-muted uppercase">{label}</Text>
      </View>
      <Text className="text-sm font-mono-semibold text-foreground">{time}</Text>
    </View>
  );
}
