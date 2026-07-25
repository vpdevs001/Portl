import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { apiRequest } from '@/lib/api';
import {
  clearSyncedOfflineActions,
  countPendingOfflineActions,
  listPendingOfflineActions,
  markOfflineActionSynced
} from '@/lib/offline-queue';

/**
 * Chapter 17 — drains the offline queue once connectivity returns.
 *
 * `expo-network` rather than `@react-native-community/netinfo`: it's
 * already a project dependency (Chapter 3's native-module batch), so this
 * avoids adding a second connectivity library and the rebuild that would
 * come with it.
 *
 * Replays queued actions sequentially (not in parallel/`Promise.all`) —
 * this matters specifically for entry/exit pairs. An exit log replayed
 * before its matching entry log would hit the server out of order.
 */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInFlight = useRef(false);

  const refreshPendingCount = useCallback(() => {
    countPendingOfflineActions()
      .then(setPendingCount)
      .catch(() => undefined);
  }, []);

  const sync = useCallback(async () => {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    setIsSyncing(true);

    try {
      const pending = await listPendingOfflineActions();
      for (const action of pending) {
        try {
          const payload = JSON.parse(action.payload);
          await apiRequest(action.endpoint, {
            method: action.method,
            body: JSON.stringify(payload)
          });
          await markOfflineActionSynced(action.id);
        } catch {
          // Stop at the first failure rather than skipping ahead — if this
          // one failed because we dropped offline again mid-replay, later
          // actions (possibly exits paired to this entry) shouldn't jump
          // the queue. The next reconnect retries from here.
          break;
        }
      }
      await clearSyncedOfflineActions();
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    } finally {
      syncInFlight.current = false;
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [queryClient, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();

    let wasConnected = true;

    Network.getNetworkStateAsync()
      .then((state) => {
        const connected = !!state.isConnected;
        wasConnected = connected;
        setIsOnline(connected);
      })
      .catch(() => undefined);

    const subscription = Network.addNetworkStateListener((state) => {
      const connected = !!state.isConnected;
      setIsOnline(connected);

      if (connected && !wasConnected) {
        sync();
      }
      wasConnected = connected;
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pendingCount, isSyncing, sync };
}
