import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  createComplaint,
  fetchComplaints,
  updateComplaintStatus,
  type CreateComplaintInput,
  type UpdateComplaintStatusInput
} from '@/features/complaints/services/complaints';

const COMPLAINTS_KEY = ['complaints'];

export function useComplaints() {
  return useQuery({ queryKey: COMPLAINTS_KEY, queryFn: fetchComplaints });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateComplaintInput) => createComplaint(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: COMPLAINTS_KEY });
    }
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateComplaintStatusInput }) =>
      updateComplaintStatus(id, payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: COMPLAINTS_KEY });
    }
  });
}
