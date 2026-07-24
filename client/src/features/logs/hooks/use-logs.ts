import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  fetchGateLogs,
  fetchGateResidents,
  fetchGateStaff,
  logResidentEntry,
  logStaffEntry
} from '@/features/logs/services/logs';

export function useGateLogs(params?: {
  date?: string;
  search?: string;
  type?: 'resident' | 'staff' | 'guest' | 'all';
}) {
  return useQuery({
    queryKey: ['logs', 'gate', params],
    queryFn: () => fetchGateLogs(params)
  });
}

export function useMyEntryLogs() {
  return useQuery({
    queryKey: ['logs', 'my'],
    queryFn: () => fetchGateLogs({ type: 'resident' })
  });
}

export function useGateResidents(params?: { search?: string; towerId?: string; flatId?: string }) {
  return useQuery({
    queryKey: ['logs', 'residents', params],
    queryFn: () => fetchGateResidents(params)
  });
}

export function useGateStaff(search?: string) {
  return useQuery({
    queryKey: ['logs', 'staff', { search }],
    queryFn: () => fetchGateStaff(search)
  });
}

export function useLogResidentEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: 'entry' | 'exit' }) =>
      logResidentEntry(userId, action),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  });
}

export function useLogStaffEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, action }: { staffId: string; action: 'entry' | 'exit' }) =>
      logStaffEntry(staffId, action),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  });
}
