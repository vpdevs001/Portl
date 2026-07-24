import { apiRequest } from '@/lib/api';

export type StaffMember = {
  id: string;
  societyId: string;
  name: string;
  roleTitle: string;
  phone: string;
  photo: string | null;
  createdAt: string;
};

export type CreateStaffInput = {
  name: string;
  roleTitle: string;
  phone: string;
  photo?: string;
};

export async function fetchStaff(params?: { search?: string; roleTitle?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.roleTitle) query.append('roleTitle', params.roleTitle);
  const queryString = query.toString() ? `?${query.toString()}` : '';

  return apiRequest<StaffMember[]>(`/api/staff${queryString}`);
}

export async function createStaff(payload: CreateStaffInput) {
  return apiRequest<StaffMember>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateStaff(id: string, payload: Partial<CreateStaffInput>) {
  return apiRequest<StaffMember>(`/api/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function removeStaff(id: string) {
  return apiRequest<{ message: string }>(`/api/staff/${id}`, {
    method: 'DELETE'
  });
}
