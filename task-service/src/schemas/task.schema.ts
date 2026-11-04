import { z } from 'zod';

export const taskIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Task ID format'),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

export const updateTaskDetailsSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

export const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
  creatorName: z.string().optional(),
});

export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type UpdateTaskDetailsInput = z.infer<typeof updateTaskDetailsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
