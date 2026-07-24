import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  createStaff,
  fetchStaff,
  removeStaff,
  updateStaff,
  type CreateStaffInput
} from '../services/staff';

const STAFF_KEY = ['staff'];

export function useStaff(params?: { search?: string; roleTitle?: string }) {
  return useQuery({
    queryKey: [...STAFF_KEY, params?.search ?? '', params?.roleTitle ?? ''],
    queryFn: () => fetchStaff(params)
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffInput) => createStaff(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    }
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateStaffInput> }) =>
      updateStaff(id, payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    }
  });
}

export function useRemoveStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeStaff(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    }
  });
}
