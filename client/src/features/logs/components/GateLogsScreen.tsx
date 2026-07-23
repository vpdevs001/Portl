import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useGateLogs } from '@/features/logs/hooks/use-logs';
import type { GateLog } from '@/features/logs/services/logs';

type LogFilter = 'all' | 'resident' | 'staff' | 'guest';

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function GateLogsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Gate logs</Text>
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

        <Text className="text-xs font-sans text-muted mb-4">{groupedSubtitle}</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, flat or role…"
          placeholderTextColor={theme.muted}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans text-sm mb-3"
        />

        <View className="flex-row bg-surface rounded-xl p-1 mb-4">
          {(['all', 'resident', 'staff', 'guest'] as LogFilter[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setType(value)}
              className={`flex-1 items-center py-2.5 rounded-lg ${type === value ? 'bg-card' : ''}`}
            >
              <Text
                className={`text-xs font-sans-bold capitalize ${type === value ? 'text-primary' : 'text-muted'}`}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Ionicons name="journal-outline" size={36} color={theme.muted} />
                <Text className="text-sm font-sans text-muted mt-4">No gate logs for today yet.</Text>
              </View>
            }
            renderItem={({ item }) => <LogRow log={item} />}
          />
        )}
      </View>
    </Screen>
  );
}

function LogRow({ log }: { log: GateLog }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="bg-card border border-border rounded-2xl p-4 gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <TypeBadge type={log.type} />
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
    </View>
  );
}

function TypeBadge({ type }: { type: GateLog['type'] }) {
  const styles = {
    resident: 'bg-primary/10',
    staff: 'bg-warning/10',
    guest: 'bg-success/10'
  }[type];
  const textStyles = {
    resident: 'text-primary',
    staff: 'text-warning',
    guest: 'text-success'
  }[type];

  return (
    <View className={`px-2 py-0.5 rounded-full ${styles}`}>
      <Text className={`text-[10px] font-sans-bold uppercase ${textStyles}`}>
        {type}
      </Text>
    </View>
  );
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
