import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  confirmPayment,
  fetchDues,
  setDueStatus,
  verifyPayment,
  type ConfirmPaymentInput,
  type DueStatus,
  type VerifyPaymentInput
} from '@/features/payments/services/payments';

const DUES_KEY = ['payments', 'dues'];

export function useDues(status?: DueStatus) {
  return useQuery({ queryKey: [...DUES_KEY, status ?? 'all'], queryFn: () => fetchDues(status) });
}

export function useSetDueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'paid' }) =>
      setDueStatus(id, status),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: DUES_KEY });
    }
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmPaymentInput) => confirmPayment(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: DUES_KEY });
    },
    // payments/index.tsx renders its own inline error banner for this action.
    meta: { suppressErrorToast: true }
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VerifyPaymentInput }) =>
      verifyPayment(id, payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: DUES_KEY });
    }
  });
}
