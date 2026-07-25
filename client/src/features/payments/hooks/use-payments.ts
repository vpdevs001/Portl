import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  confirmPayment,
  fetchDues,
  fetchPaymentConfirmations,
  generateDues,
  verifyPayment,
  type ConfirmPaymentInput,
  type DueStatus,
  type GenerateDuesInput,
  type VerifyPaymentInput
} from '@/features/payments/services/payments';

const DUES_KEY = ['payments', 'dues'];
const CONFIRMATIONS_KEY = ['payments', 'confirmations'];

export function useDues(status?: DueStatus) {
  return useQuery({ queryKey: [...DUES_KEY, status ?? 'all'], queryFn: () => fetchDues(status) });
}

export function useGenerateDues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateDuesInput) => generateDues(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      queryClient.invalidateQueries({ queryKey: CONFIRMATIONS_KEY });
    }
  });
}

export function usePaymentConfirmations() {
  return useQuery({ queryKey: CONFIRMATIONS_KEY, queryFn: fetchPaymentConfirmations });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VerifyPaymentInput }) =>
      verifyPayment(id, payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: CONFIRMATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: DUES_KEY });
    }
  });
}
