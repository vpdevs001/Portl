import { apiRequest } from '@/lib/api';

export type GateLog = {
  id: string;
  type: 'resident' | 'staff' | 'guest';
  name: string;
  subtitle: string | null;
  entryTime: string | null;
  exitTime: string | null;
  isInside: boolean;
};

export type GateResident = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  flatId: string | null;
  flatNumber: string | null;
  towerName: string | null;
  isInside: boolean;
};

export type GateStaff = {
  id: string;
  name: string;
  roleTitle: string;
  phone: string;
  photo: string | null;
  isInside: boolean;
};

export async function fetchGateLogs(params?: {
  date?: string;
  search?: string;
  type?: 'resident' | 'staff' | 'guest' | 'all';
}) {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.search) query.set('search', params.search);
  if (params?.type) query.set('type', params.type);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<GateLog[]>(`/api/logs${suffix}`);
}

export async function fetchGateResidents(params?: {
  search?: string;
  towerId?: string;
  flatId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.towerId) query.set('towerId', params.towerId);
  if (params?.flatId) query.set('flatId', params.flatId);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<GateResident[]>(`/api/logs/residents${suffix}`);
}

export async function fetchGateStaff(search?: string) {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<GateStaff[]>(`/api/logs/staff${suffix}`);
}

export async function logResidentEntry(userId: string, action: 'entry' | 'exit') {
  return apiRequest<{ id: string }>('/api/logs/resident', {
    method: 'POST',
    body: JSON.stringify({ userId, action })
  });
}

export async function logStaffEntry(staffId: string, action: 'entry' | 'exit') {
  return apiRequest<{ id: string }>('/api/logs/staff', {
    method: 'POST',
    body: JSON.stringify({ staffId, action })
  });
}
