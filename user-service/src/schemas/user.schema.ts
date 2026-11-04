import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be an integer string'),
});

export const roleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'TEAM_LEADER', 'MEMBER']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
