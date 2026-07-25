import { z } from 'zod';

export const createSocietySchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(1).max(20)
});

export const createTowerSchema = z.object({
  name: z.string().min(1).max(100)
});

const flatTypeSchema = z.enum(['1bhk', '2bhk', '3bhk', '4bhk', '5bhk', 'other']);

export const createFlatSchema = z.object({
  towerId: z.string().uuid(),
  flatNumber: z.string().min(1).max(20),
  floor: z.number().int().optional(),
  flatType: flatTypeSchema,
  monthlyAmount: z.number().nonnegative()
});

export const updateFlatSchema = z.object({
  flatType: flatTypeSchema.optional(),
  monthlyAmount: z.number().nonnegative().optional()
});

export const updateSocietyUpiIdSchema = z.object({
  // Basic VPA shape check (handle@bank) — UPI doesn't validate beyond this
  // without hitting a bank/NPCI API, which is out of scope here.
  upiId: z
    .string()
    .trim()
    .regex(/^[\w.+-]{2,256}@[a-zA-Z][\w.-]{1,64}$/, 'Enter a valid UPI ID, e.g. society@okhdfcbank')
});

export type CreateSocietyInput = z.infer<typeof createSocietySchema>;
export type CreateTowerInput = z.infer<typeof createTowerSchema>;
export type CreateFlatInput = z.infer<typeof createFlatSchema>;
export type UpdateFlatInput = z.infer<typeof updateFlatSchema>;
export type UpdateSocietyUpiIdInput = z.infer<typeof updateSocietyUpiIdSchema>;
