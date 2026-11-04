import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import { Notification } from '../models/notification.model';
import { requireAuth } from '../middleware/auth';

export async function notificationRoutes(server: FastifyInstance) {
  // GET /api/notifications - Fetch user's notifications
  server.get('/api/notifications', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    return Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
  });

  // PATCH /api/notifications/:id/read - Mark single as read
  server.patch<{ Params: { id: string } }>(
    '/api/notifications/:id/read',
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return reply.status(400).send({ error: 'Invalid ID' });
      }

      const notif = await Notification.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { read: true },
        { new: true }
      );

      if (!notif) return reply.status(404).send({ error: 'Notification not found' });
      return notif;
    }
  );

  // PATCH /api/notifications/read-all - Mark all as read
  server.patch('/api/notifications/read-all', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });

    return { message: 'All notifications marked as read' };
  });

  // DELETE /api/notifications - Clear all
  server.delete('/api/notifications', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    await Notification.deleteMany({ userId: req.user.id });
    return { message: 'Notifications cleared' };
  });
}
