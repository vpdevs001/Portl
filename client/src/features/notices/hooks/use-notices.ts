import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  createNotice,
  deleteNotice,
  fetchNotices,
  updateNotice,
  type CreateNoticeInput,
  type UpdateNoticeInput
} from '@/features/notices/services/notices';

export function useNotices(includeExpired = false) {
  return useQuery({
    queryKey: ['notices', { includeExpired }],
    queryFn: () => fetchNotices(includeExpired)
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNoticeInput) => createNotice(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    }
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNoticeInput }) =>
      updateNotice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    }
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    }
  });
}
