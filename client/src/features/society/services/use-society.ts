// TanStack Query hooks for the society feature.
// Moved from src/hooks/use-society.ts — all import paths updated to the
// new feature-folder layout.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Flat, Society, SocietyDetails, Tower, UserMember } from '../types/society.types';

export type { Flat, Society, SocietyDetails, Tower, UserMember };

export function useCreateSociety() {
  return useMutation({
    mutationFn: (data: {
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    }) =>
      apiRequest<Society>('/api/societies', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    // NOTE: does not invalidate/refetch the session here — Better Auth's
    // useSession() is a nanostores atom, not a TanStack Query cache entry,
    // so queryClient.invalidateQueries has no effect on it. The screen that
    // calls this mutation is responsible for calling the real
    // authClient.useSession().refetch() after a successful create, so the
    // updated societyId/role propagate into the navigation gate.
  });
}

export function useSocietyDetails() {
  return useQuery({
    queryKey: ['society', 'me'],
    queryFn: () => apiRequest<SocietyDetails>('/api/societies/me')
  });
}

export function useCreateTower() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiRequest<Tower>('/api/societies/towers', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['towers'] });
      queryClient.invalidateQueries({ queryKey: ['society', 'me'] });
    }
  });
}

export function useTowers() {
  return useQuery({
    queryKey: ['towers'],
    queryFn: () => apiRequest<Tower[]>('/api/societies/towers')
  });
}

export function useCreateFlat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { towerId: string; flatNumber: string; floor?: number }) =>
      apiRequest<Flat>('/api/societies/flats', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      queryClient.invalidateQueries({ queryKey: ['society', 'me'] });
    }
  });
}

export function useFlats(towerId?: string) {
  return useQuery({
    queryKey: ['flats', { towerId }],
    queryFn: () =>
      apiRequest<Flat[]>(`/api/societies/flats${towerId ? `?towerId=${towerId}` : ''}`)
  });
}

export function useSocietyMembers(role?: 'resident' | 'security_guard' | 'society_admin') {
  return useQuery({
    queryKey: ['members', { role }],
    queryFn: () =>
      apiRequest<UserMember[]>(`/api/societies/members${role ? `?role=${role}` : ''}`)
  });
}
