import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMyEntryLogs } from '@/features/logs/hooks/use-logs';

function formatTime(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ResidentEntryHistoryCard() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading } = useMyEntryLogs();

  const recent = (data ?? []).slice(0, 5);

  return (
    <View className="bg-card border border-border rounded-2xl p-6 mb-5 gap-3">
      <View className="flex-row items-center gap-2 mb-1">
        <Ionicons name="journal-outline" size={14} color={theme.primary} />
        <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
          Gate Entry History
        </Text>
      </View>

      <Text className="text-xs font-sans text-muted leading-5">
        Recent check-ins and check-outs logged by security at the gate.
      </Text>

      {isLoading ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : recent.length === 0 ? (
        <View className="py-6 items-center">
          <Ionicons name="time-outline" size={24} color={theme.muted} />
          <Text className="text-sm font-sans text-muted mt-2">No gate logs yet.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {recent.map((log) => (
            <View
              key={log.id}
              className="flex-row items-center justify-between bg-surface border border-border/50 rounded-xl px-3 py-3"
            >
              <View className="flex-1 pr-3">
                <Text className="text-xs font-sans-semibold text-foreground">
                  {formatTime(log.entryTime)}
                </Text>
                <Text className="text-[10px] font-sans text-muted mt-0.5">
                  {log.exitTime ? `Exit ${formatTime(log.exitTime)}` : 'Still inside'}
                </Text>
              </View>
              <View
                className={`px-2 py-1 rounded-full ${log.isInside ? 'bg-success/10' : 'bg-muted/10'}`}
              >
                <Text
                  className={`text-[10px] font-sans-bold uppercase ${log.isInside ? 'text-success' : 'text-muted'}`}
                >
                  {log.isInside ? 'Inside' : 'Completed'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
