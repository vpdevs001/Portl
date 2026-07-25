import { apiRequest } from '@/lib/api';
import type { Flat } from '@/features/society/services/use-society';

export type DueStatus = 'pending' | 'review' | 'paid';
export type ConfirmationStatus = 'pending' | 'approved' | 'rejected';

export type MaintenanceDue = {
  id: string;
  societyId: string;
  flatId: string;
  period: string;
  amount: string;
  status: DueStatus;
  createdAt: string;
  updatedAt: string;
  flat?: Flat | null;
  // Latest submission for this due, most recent first — present once a
  // resident has submitted proof at least once this month (even if it
  // was later rejected and the due went back to 'pending').
  paymentConfirmations?: PaymentConfirmation[];
};

export type PaymentConfirmation = {
  id: string;
  dueId: string;
  flatId: string;
  raisedBy: string;
  amount: string;
  screenshot: string;
  upiRef: string | null;
  status: ConfirmationStatus;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  raisedByUser?: { id: string; name: string } | null;
};

export type ConfirmPaymentInput = {
  dueId: string;
  amount: number;
  screenshot: string;
  upiRef?: string;
};

export type VerifyPaymentInput = {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
};

export async function fetchDues(status?: DueStatus) {
  const query = status ? `?status=${status}` : '';
  return apiRequest<MaintenanceDue[]>(`/api/payments/dues${query}`);
}

export async function setDueStatus(id: string, status: 'pending' | 'paid') {
  return apiRequest<MaintenanceDue>(`/api/payments/dues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function confirmPayment(payload: ConfirmPaymentInput) {
  return apiRequest<PaymentConfirmation>('/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyPayment(id: string, payload: VerifyPaymentInput) {
  return apiRequest<PaymentConfirmation>(`/api/payments/confirm/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
