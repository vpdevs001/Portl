import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPreApproval,
  createVisitorRequest,
  fetchPendingVisitors,
  fetchPreApprovals,
  logVisitorEntry,
  logVisitorExit,
  registerPushToken,
  respondToVisitorRequest,
  uploadVisitorPhoto,
  verifyPass
} from '@/features/visitors/services/visitors';
import * as Haptics from 'expo-haptics';

export function usePendingVisitors() {
  return useQuery({
    queryKey: ['visitors', 'pending'],
    queryFn: fetchPendingVisitors,
    // Polling fallback in case a push notification is slow or dropped.
    refetchInterval: 5000,
    refetchIntervalInBackground: true
  });
}

export function useCreateVisitorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVisitorRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['visitors', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    }
  });
}

export function useRespondToVisitorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      respondToVisitorRequest(id, status),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['visitors', 'pending'] });
    }
  });
}

export function useLogVisitorEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => logVisitorEntry(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['visitors', 'pending'] });
    }
  });
}

export function useLogVisitorExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => logVisitorExit(id),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['visitors', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    }
  });
}

export function useUploadVisitorPhoto() {
  return useMutation({
    mutationFn: uploadVisitorPhoto,
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  });
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: registerPushToken
  });
}

// ─── Chapter 8 — Pre-Approvals ──────────────────────────────────────────────

export function usePreApprovals() {
  return useQuery({
    queryKey: ['visitors', 'pre-approvals'],
    queryFn: fetchPreApprovals
  });
}

export function useCreatePreApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPreApproval,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['visitors', 'pre-approvals'] });
    }
  });
}

export function useVerifyPass() {
  return useMutation({
    mutationFn: verifyPass,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  });
}
