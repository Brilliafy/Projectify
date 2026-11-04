import { z } from 'zod';

export const teamIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Team ID format'),
});

export const memberParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Team ID format'),
  userId: z.string().regex(/^\d+$/, 'User ID must be numeric'),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').trim(),
  description: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().optional(),
});

export const addMemberSchema = z.object({
  userIdToAdd: z.number().int().positive('Valid user ID required'),
});

export type TeamIdParam = z.infer<typeof teamIdParamSchema>;
export type MemberParam = z.infer<typeof memberParamSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
