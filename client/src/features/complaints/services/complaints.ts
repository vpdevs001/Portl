import { apiRequest } from '@/lib/api';

export type ComplaintCategory = 'plumbing' | 'electrical' | 'security' | 'cleanliness' | 'general';

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type Complaint = {
  id: string;
  societyId: string;
  flatId: string;
  raisedBy: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  photoUrl: string | null;
  adminComments: string | null;
  createdAt: string;
  updatedAt: string;
  flat?: { id: string; flatNumber: string } | null;
  raisedByUser?: { id: string; name: string } | null;
};

export type CreateComplaintInput = {
  title: string;
  description: string;
  category?: ComplaintCategory;
  photoUrl?: string;
};

export type UpdateComplaintStatusInput = {
  status: ComplaintStatus;
  adminComments?: string;
};

export async function fetchComplaints() {
  return apiRequest<Complaint[]>('/api/complaints');
}

export async function createComplaint(payload: CreateComplaintInput) {
  return apiRequest<Complaint>('/api/complaints', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateComplaintStatus(id: string, payload: UpdateComplaintStatusInput) {
  return apiRequest<Complaint>(`/api/complaints/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
