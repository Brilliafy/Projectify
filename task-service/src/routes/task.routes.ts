import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { Task, IAttachment } from '../models/task.model';
import { Comment } from '../models/comment.model';
import { requireAuth } from '../middleware/auth';
import { storageService } from '../services/storage.service';
import { publishTaskNotification } from '../services/notification.publisher';
import {
  taskIdParamSchema,
  updateTaskStatusSchema,
  updateTaskDetailsSchema,
  TaskIdParam,
  UpdateTaskStatusInput,
  UpdateTaskDetailsInput,
} from '../schemas/task.schema';

const ALLOWED_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.zip', '.rar', '.7z', '.pdf', '.txt', '.png'];

export async function taskRoutes(server: FastifyInstance) {
  // Local attachment download endpoint
  server.get<{ Params: { filename: string } }>(
    '/api/tasks/attachments/:filename',
    async (req: FastifyRequest<{ Params: { filename: string } }>, reply: FastifyReply) => {
      const filename = path.basename(req.params.filename);
      const filePath = path.resolve(process.cwd(), 'uploads', filename);

      if (!fs.existsSync(filePath)) {
        return reply.status(404).send({ error: 'File not found' });
      }

      const stream = fs.createReadStream(filePath);
      return reply.send(stream);
    }
  );

  // POST /api/tasks - create task with attachments
  server.post('/api/tasks', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    if (!['TEAM_LEADER', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'Only Team Leaders can create tasks' });
    }

    const parts = req.parts();
    const fields: Record<string, string> = {};
    const attachments: IAttachment[] = [];
    let fileCount = 0;

    try {
      for await (const part of parts) {
        if (part.type === 'file') {
          fileCount++;
          if (fileCount > 5) {
            throw new Error('MAX_FILES_EXCEEDED');
          }

          const ext = path.extname(part.filename).toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error('INVALID_FILE_TYPE');
          }

          const uploaded = await storageService.uploadFile(part);
          attachments.push(uploaded);
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }
    } catch (err: any) {
      if (err.message === 'MAX_FILES_EXCEEDED') {
        return reply.status(400).send({ error: 'Max 5 attachments allowed per task' });
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        return reply.status(400).send({ error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(' ')}` });
      }
      if (err.code === 'FST_LIMITS_FILE_SIZE' || err.code === 'FST_YIELD_ERROR') {
        return reply.status(413).send({ error: 'File too large. Max 2MB.' });
      }
      console.error('Task file upload error:', err);
      return reply.status(500).send({ error: 'Upload failed' });
    }

    if (!fields.title || !fields.title.trim()) {
      return reply.status(400).send({ error: 'Task title is required' });
    }

    if (!fields.teamId) {
      return reply.status(400).send({ error: 'Team ID is required' });
    }

    let assigneeIds: number[] = [];
    if (fields.assigneeIds) {
      try {
        assigneeIds = JSON.parse(fields.assigneeIds);
      } catch {
        assigneeIds = [];
      }
    }

    let deadline: Date | undefined;
    if (fields.deadline) {
      const deadlineDate = new Date(fields.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        return reply.status(400).send({ error: 'Deadline cannot be in the past' });
      }
      deadline = deadlineDate;
    }

    const priority = ['LOW', 'MEDIUM', 'HIGH'].includes(fields.priority || '')
      ? (fields.priority as 'LOW' | 'MEDIUM' | 'HIGH')
      : 'MEDIUM';

    const task = await Task.create({
      title: fields.title.trim(),
      description: fields.description?.trim(),
      status: 'TODO',
      priority,
      deadline,
      teamId: fields.teamId,
      creatorId: req.user.id,
      assigneeIds,
      attachments,
    });

    await publishTaskNotification({
      userIds: assigneeIds,
      type: 'TASK_ASSIGNED',
      message: `You have been assigned to task "${task.title}"`,
      relatedId: task._id.toString(),
      metadata: { creatorName: req.user.fullName || 'Team Leader' },
    });

    return reply.status(201).send(task);
  });

  // GET /api/tasks - list tasks
  server.get('/api/tasks', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    const { teamId } = req.query as { teamId?: string };
    const query: any = {};

    if (teamId) {
      query.teamId = teamId;
    }

    if (req.user.role === 'ADMIN') {
      // Admin sees all
    } else if (req.user.role === 'TEAM_LEADER') {
      query.$or = [{ creatorId: req.user.id }, { assigneeIds: req.user.id }];
    } else {
      query.assigneeIds = req.user.id;
    }

    return Task.find(query).sort({ createdAt: -1 });
  });

  // GET /api/tasks/:id - get single task
  server.get<{ Params: TaskIdParam }>('/api/tasks/:id', async (req: FastifyRequest<{ Params: TaskIdParam }>, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    const parseParams = taskIdParamSchema.safeParse(req.params);
    if (!parseParams.success) return reply.status(400).send({ error: 'Invalid task ID' });

    const task = await Task.findById(parseParams.data.id);
    if (!task) return reply.status(404).send({ error: 'Task not found' });

    const canView =
      req.user.role === 'ADMIN' ||
      task.creatorId === req.user.id ||
      task.assigneeIds.includes(req.user.id);

    if (!canView) return reply.status(403).send({ error: 'Access denied' });

    const taskObj = task.toObject();
    const attachmentsWithUrls = await Promise.all(
      task.attachments.map(async (att) => {
        const url = await storageService.getDownloadUrl(att.gcsFileName);
        const plainAtt = typeof (att as any).toObject === 'function' ? (att as any).toObject() : att;
        return {
          ...plainAtt,
          url,
        };
      })
    );

    return { ...taskObj, attachments: attachmentsWithUrls };
  });

  // PATCH /api/tasks/:id/status - update status
  server.patch<{ Params: TaskIdParam; Body: UpdateTaskStatusInput }>(
    '/api/tasks/:id/status',
    async (req: FastifyRequest<{ Params: TaskIdParam; Body: UpdateTaskStatusInput }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const parseParams = taskIdParamSchema.safeParse(req.params);
      const parseBody = updateTaskStatusSchema.safeParse(req.body);

      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid task ID' });
      if (!parseBody.success) return reply.status(400).send({ error: 'Invalid status' });

      const task = await Task.findById(parseParams.data.id);
      if (!task) return reply.status(404).send({ error: 'Task not found' });

      const canEdit =
        req.user.role === 'ADMIN' ||
        task.creatorId === req.user.id ||
        task.assigneeIds.includes(req.user.id);

      if (!canEdit) return reply.status(403).send({ error: 'Access denied' });

      task.status = parseBody.data.status;
      await task.save();

      const recipients = [...task.assigneeIds];
      if (task.creatorId !== req.user.id) recipients.push(task.creatorId);

      await publishTaskNotification({
        userIds: recipients.filter((id) => id !== req.user.id),
        type: 'TASK_UPDATED',
        message: `Task "${task.title}" status changed to ${task.status}`,
        relatedId: task._id.toString(),
        metadata: {
          updaterName: req.user.fullName || 'User',
          newStatus: task.status,
        },
      });

      return task;
    }
  );

  // PATCH /api/tasks/:id - update task details
  server.patch<{ Params: TaskIdParam; Body: UpdateTaskDetailsInput }>(
    '/api/tasks/:id',
    async (req: FastifyRequest<{ Params: TaskIdParam; Body: UpdateTaskDetailsInput }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const parseParams = taskIdParamSchema.safeParse(req.params);
      const parseBody = updateTaskDetailsSchema.safeParse(req.body);

      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid task ID' });
      if (!parseBody.success) return reply.status(400).send({ error: 'Invalid details input' });

      const task = await Task.findById(parseParams.data.id);
      if (!task) return reply.status(404).send({ error: 'Task not found' });

      const isAdmin = req.user.role === 'ADMIN';
      const isCreator = task.creatorId === req.user.id;

      if (!isAdmin && !isCreator) {
        return reply.status(403).send({ error: 'Only the creator can edit task details' });
      }

      const { title, description, priority } = parseBody.data;

      if (title && title !== task.title) {
        const existing = await Task.findOne({ teamId: task.teamId, title, _id: { $ne: task._id } });
        if (existing) {
          return reply.status(400).send({ error: 'Task with this title already exists in this team' });
        }
        task.title = title;
      }

      if (description !== undefined) {
        task.description = description;
      }

      if (priority) {
        task.priority = priority;
      }

      await task.save();
      return task;
    }
  );

  // DELETE /api/tasks/:id - delete task
  server.delete<{ Params: TaskIdParam }>(
    '/api/tasks/:id',
    async (req: FastifyRequest<{ Params: TaskIdParam }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const parseParams = taskIdParamSchema.safeParse(req.params);
      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid task ID' });

      const task = await Task.findById(parseParams.data.id);
      if (!task) return reply.status(404).send({ error: 'Task not found' });

      const isAdmin = req.user.role === 'ADMIN';
      const isCreator = task.creatorId === req.user.id;

      if (!isAdmin && !isCreator) {
        return reply.status(403).send({ error: 'Only the creator or admin can delete this task' });
      }

      for (const att of task.attachments) {
        if (att.gcsFileName) {
          await storageService.deleteFile(att.gcsFileName);
        }
      }

      await Comment.deleteMany({ taskId: parseParams.data.id });
      await Task.findByIdAndDelete(parseParams.data.id);

      return { message: 'Deleted' };
    }
  );
}
