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

export const createFlatSchema = z.object({
  towerId: z.string().uuid(),
  flatNumber: z.string().min(1).max(20),
  floor: z.number().int().optional()
});

export type CreateSocietyInput = z.infer<typeof createSocietySchema>;
export type CreateTowerInput = z.infer<typeof createTowerSchema>;
export type CreateFlatInput = z.infer<typeof createFlatSchema>;
