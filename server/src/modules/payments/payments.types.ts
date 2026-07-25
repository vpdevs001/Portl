export type Caller = {
  id: string;
  societyId: string;
  role: 'resident' | 'security_guard' | 'society_admin';
  flatId?: string | null;
};

export type GenerateDuesInput = {
  period: string;
  amount: number;
  dueDate: string;
  // Omitted → bill every flat in the society. Provided → bill only these
  // flats (e.g. a corrective run for a couple of flats that were missed).
  flatIds?: string[];
};

export type ListDuesQuery = {
  status?: 'pending' | 'paid' | 'overdue';
};

export type ConfirmPaymentInput = {
  dueId: string;
  amount: number;
  screenshot: string;
  upiRef?: string;
};

export type VerifyPaymentInput = {
  status: 'approved' | 'rejected';
  // Required when rejecting (so the resident knows what to fix); ignored
  // on approve.
  rejectionReason?: string;
};
