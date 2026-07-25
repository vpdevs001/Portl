import { apiRequest } from '@/lib/api';

export type DueStatus = 'pending' | 'paid' | 'overdue';
export type ConfirmationStatus = 'pending' | 'approved' | 'rejected';

export type MaintenanceDue = {
  id: string;
  societyId: string;
  flatId: string;
  period: string;
  amount: string;
  dueDate: string;
  status: DueStatus;
  createdAt: string;
  updatedAt: string;
  flat?: { id: string; flatNumber: string } | null;
  // Only present on the resident's own list (GET /api/payments/dues), most
  // recent confirmation first — lets the UI show "verification pending"
  // even while status is still technically 'pending'.
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
  due?: MaintenanceDue | null;
  flat?: { id: string; flatNumber: string } | null;
  raisedByUser?: { id: string; name: string } | null;
};

export type GenerateDuesInput = {
  period: string;
  amount: number;
  dueDate: string;
  flatIds?: string[];
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

export async function generateDues(payload: GenerateDuesInput) {
  return apiRequest<MaintenanceDue[]>('/api/payments/dues', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function confirmPayment(payload: ConfirmPaymentInput) {
  return apiRequest<PaymentConfirmation>('/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchPaymentConfirmations() {
  return apiRequest<PaymentConfirmation[]>('/api/payments/confirmations');
}

export async function verifyPayment(id: string, payload: VerifyPaymentInput) {
  return apiRequest<PaymentConfirmation>(`/api/payments/confirm/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
