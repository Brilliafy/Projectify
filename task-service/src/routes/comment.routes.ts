import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import { Task, IAttachment } from '../models/task.model';
import { Comment } from '../models/comment.model';
import { requireAuth } from '../middleware/auth';
import { storageService } from '../services/storage.service';
import { publishTaskNotification } from '../services/notification.publisher';
import { taskIdParamSchema, TaskIdParam } from '../schemas/task.schema';

const ALLOWED_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.zip', '.rar', '.7z', '.pdf', '.txt', '.png'];

export async function commentRoutes(server: FastifyInstance) {
  // GET /api/tasks/:id/comments
  server.get<{ Params: TaskIdParam }>(
    '/api/tasks/:id/comments',
    async (req: FastifyRequest<{ Params: TaskIdParam }>, reply: FastifyReply) => {
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

      const comments = await Comment.find({ taskId: parseParams.data.id }).sort({ createdAt: 1 });

      const enrichedComments = await Promise.all(
        comments.map(async (c) => {
          const cObj = c.toObject();
          const atts = await Promise.all(
            c.attachments.map(async (a) => {
              const plainA = typeof (a as any).toObject === 'function' ? (a as any).toObject() : a;
              return {
                ...plainA,
                url: await storageService.getDownloadUrl(a.gcsFileName),
              };
            })
          );
          return { ...cObj, attachments: atts };
        })
      );

      return enrichedComments;
    }
  );

  // POST /api/tasks/:id/comments
  server.post<{ Params: TaskIdParam }>(
    '/api/tasks/:id/comments',
    async (req: FastifyRequest<{ Params: TaskIdParam }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      if (req.user.role === 'ADMIN') {
        return reply.status(403).send({ error: 'Admins cannot comment' });
      }

      const parseParams = taskIdParamSchema.safeParse(req.params);
      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid task ID' });

      const task = await Task.findById(parseParams.data.id);
      if (!task) return reply.status(404).send({ error: 'Task not found' });

      const canComment = task.creatorId === req.user.id || task.assigneeIds.includes(req.user.id);
      if (!canComment) return reply.status(403).send({ error: 'Access denied' });

      const parts = req.parts();
      const fields: Record<string, string> = {};
      const attachments: IAttachment[] = [];
      let fileCount = 0;

      try {
        for await (const part of parts) {
          if (part.type === 'file') {
            fileCount++;
            if (fileCount > 5) throw new Error('MAX_FILES_EXCEEDED');

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
        if (err.message === 'MAX_FILES_EXCEEDED') return reply.status(400).send({ error: 'Max 5 attachments allowed' });
        if (err.message === 'INVALID_FILE_TYPE') {
          return reply.status(400).send({ error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(' ')}` });
        }
        if (err.code === 'FST_LIMITS_FILE_SIZE' || err.code === 'FST_YIELD_ERROR') {
          return reply.status(413).send({ error: 'File too large. Max 2MB.' });
        }
        return reply.status(500).send({ error: 'Upload failed' });
      }

      if (!fields.text || !fields.text.trim()) {
        return reply.status(400).send({ error: 'Comment text is required' });
      }

      const comment = await Comment.create({
        taskId: task._id,
        text: fields.text.trim(),
        creatorId: req.user.id,
        creatorName: fields.creatorName || req.user.fullName || 'User',
        creatorRole: req.user.role,
        attachments,
      });

      const recipients = [task.creatorId, ...task.assigneeIds].filter((uid) => uid !== req.user.id);

      await publishTaskNotification({
        userIds: recipients,
        type: 'COMMENT_ADDED',
        message: `New comment on task "${task.title}"`,
        relatedId: task._id.toString(),
        metadata: { commenterName: req.user.fullName || fields.creatorName || 'User' },
      });

      return reply.status(201).send(comment);
    }
  );
}
