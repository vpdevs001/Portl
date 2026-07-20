// TanStack Query hooks for the invite feature.
// Moved from src/hooks/use-invite.ts — all import paths updated to the
// new feature-folder layout.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { SocietyInvite, UserSearchItem } from '../types/invite.types';

export type { SocietyInvite, UserSearchItem };

export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () =>
      apiRequest<UserSearchItem[]>(`/api/invites/search-users?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; role: 'resident' | 'security_guard'; flatId?: string }) =>
      apiRequest<SocietyInvite>('/api/invites', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', 'sent'] });
    }
  });
}

export function useSentInvites(status?: 'pending' | 'accepted' | 'rejected' | 'cancelled') {
  return useQuery({
    queryKey: ['invites', 'sent', { status }],
    queryFn: () =>
      apiRequest<SocietyInvite[]>(`/api/invites/sent${status ? `?status=${status}` : ''}`)
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      apiRequest<SocietyInvite>(`/api/invites/${inviteId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', 'sent'] });
    }
  });
}

export function useMyInvites() {
  return useQuery({
    queryKey: ['invites', 'mine'],
    queryFn: () => apiRequest<SocietyInvite[]>('/api/invites/mine')
  });
}

export function useRespondInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inviteId, action }: { inviteId: string; action: 'accept' | 'reject' }) =>
      apiRequest<SocietyInvite>(`/api/invites/${inviteId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      }),
    onSuccess: () => {
      // NOTE: does not invalidate/refetch the session here — see the same
      // note in features/society/services/use-society.ts's useCreateSociety.
      // The screen calling this mutation must call
      // authClient.useSession().refetch() itself after an 'accept', so
      // societyId/role propagate into the navigation gate.
      queryClient.invalidateQueries({ queryKey: ['invites', 'mine'] });
    }
  });
}
