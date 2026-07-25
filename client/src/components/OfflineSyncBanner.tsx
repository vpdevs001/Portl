import { Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOfflineSync } from '@/hooks/useOfflineSync';

/**
 * Chapter 17 — sits at the top of the Guard stack (see guard/_layout.tsx).
 * Shows nothing when online with an empty queue — a guard shift with no
 * connectivity issues should never see this. Otherwise shows either the
 * offline state (with however many taps are queued so far) or the
 * draining-the-queue state once connectivity returns, so a guard can see
 * their taps registering rather than wondering if they were lost.
 */
export function OfflineSyncBanner() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  const offline = !isOnline;

  return (
    <View
      className={`flex-row items-center gap-2 px-4 py-2.5 ${
        offline ? 'bg-warning/15' : 'bg-primary/15'
      }`}
    >
      <Ionicons
        name={offline ? 'cloud-offline-outline' : 'sync-outline'}
        size={14}
        color={offline ? theme.warning : theme.primary}
      />
      <Text
        className={`text-xs font-sans-semibold flex-1 ${offline ? 'text-warning' : 'text-primary'}`}
      >
        {offline
          ? pendingCount > 0
            ? `Offline — ${pendingCount} action${pendingCount === 1 ? '' : 's'} queued`
            : "Offline — you're still able to log entries/exits"
          : isSyncing
            ? `Syncing ${pendingCount} queued action${pendingCount === 1 ? '' : 's'}…`
            : 'Back online — all synced'}
      </Text>
    </View>
  );
}
