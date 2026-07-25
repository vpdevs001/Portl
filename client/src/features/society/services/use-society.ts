// TanStack Query hooks for the society feature.
// Moved from src/hooks/use-society.ts — all import paths updated to the
// new feature-folder layout.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type {
  Flat,
  FlatType,
  Society,
  SocietyDetails,
  Tower,
  UserMember
} from '../types/society.types';

export type { Flat, FlatType, Society, SocietyDetails, Tower, UserMember };

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

export function useUpdateSocietyUpiId() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { upiId: string }) =>
      apiRequest<Society>('/api/societies/upi', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['society', 'me'] });
    }
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
    mutationFn: (data: {
      towerId: string;
      flatNumber: string;
      floor?: number;
      flatType: FlatType;
      monthlyAmount: number;
    }) =>
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

export function useUpdateFlat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; flatType?: FlatType; monthlyAmount?: number }) =>
      apiRequest<Flat>(`/api/societies/flats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    }
  });
}

export function useFlats(towerId?: string) {
  return useQuery({
    queryKey: ['flats', { towerId }],
    queryFn: () => apiRequest<Flat[]>(`/api/societies/flats${towerId ? `?towerId=${towerId}` : ''}`)
  });
}

export function useSocietyMembers(role?: 'resident' | 'security_guard' | 'society_admin') {
  return useQuery({
    queryKey: ['members', { role }],
    queryFn: () => apiRequest<UserMember[]>(`/api/societies/members${role ? `?role=${role}` : ''}`)
  });
}

// NOTE: like useCreateSociety, this does not refetch the session itself —
// leaving clears societyId/role server-side, but Better Auth's useSession()
// is a nanostores atom outside the TanStack Query cache. The caller must
// call authClient.useSession().refetch() after a successful leave so the
// navigation gate in app/_layout.tsx picks up the change and redirects to
// onboarding.
export function useLeaveSociety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<{ id: string }>('/api/societies/leave', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['society', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    }
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest<{ id: string }>(`/api/societies/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['society', 'me'] });
    }
  });
}
