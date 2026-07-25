import { z } from 'zod';

export const generateDuesSchema = z.object({
  period: z.string().trim().min(1).max(20),
  amount: z.number().positive(),
  dueDate: z.string().min(1),
  // Empty/omitted → bill every flat in the society (handled in the service).
  flatIds: z.array(z.string().uuid()).optional()
});

export const listDuesQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue']).optional()
});

export const confirmPaymentSchema = z.object({
  dueId: z.string().uuid(),
  amount: z.number().positive(),
  // Base64 file content — uploaded straight to ImageKit inside the
  // service, same as visitor/complaint photos, just not routed through
  // the shared POST /api/upload since this needs due/flat scoping.
  screenshot: z.string().min(1),
  upiRef: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)
});

export const verifyPaymentSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    rejectionReason: z
      .string()
      .trim()
      .min(1)
      .optional()
      .or(z.literal(''))
      .transform((value) => value || undefined)
  })
  .refine((dto) => dto.status !== 'rejected' || !!dto.rejectionReason, {
    message: 'rejectionReason is required when rejecting a payment confirmation',
    path: ['rejectionReason']
  });

export const paymentConfirmationIdParamsSchema = z.object({
  id: z.string().uuid()
});
