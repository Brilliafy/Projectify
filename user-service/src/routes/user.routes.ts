import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { idParamSchema, roleUpdateSchema, IdParam, RoleUpdateInput } from '../schemas/user.schema';

export async function userRoutes(server: FastifyInstance) {
  // GET /api/users - active users list
  server.get('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    return prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });
  });

  // GET /api/users/admin - all users for admin
  server.get('/api/users/admin', async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
      orderBy: { id: 'asc' },
    });
  });

  // PATCH /api/users/admin/:id/activate
  server.patch<{ Params: IdParam }>('/api/users/admin/:id/activate', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const parseParams = idParamSchema.safeParse(request.params);
    if (!parseParams.success) {
      return reply.status(400).send({ error: 'Invalid user ID' });
    }

    const id = Number(parseParams.data.id);
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  });

  // PATCH /api/users/admin/:id/role
  server.patch<{ Params: IdParam; Body: RoleUpdateInput }>(
    '/api/users/admin/:id/role',
    async (request: FastifyRequest<{ Params: IdParam; Body: RoleUpdateInput }>, reply: FastifyReply) => {
      await requireAdmin(request, reply);
      if (reply.sent) return;

      const parseParams = idParamSchema.safeParse(request.params);
      const parseBody = roleUpdateSchema.safeParse(request.body);

      if (!parseParams.success) {
        return reply.status(400).send({ error: 'Invalid user ID' });
      }
      if (!parseBody.success) {
        return reply.status(400).send({ error: 'Invalid role value' });
      }

      const id = Number(parseParams.data.id);
      return prisma.user.update({
        where: { id },
        data: { role: parseBody.data.role },
      });
    }
  );

  // DELETE /api/users/admin/:id
  server.delete<{ Params: IdParam }>('/api/users/admin/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;

    const parseParams = idParamSchema.safeParse(request.params);
    if (!parseParams.success) {
      return reply.status(400).send({ error: 'Invalid user ID' });
    }

    const id = Number(parseParams.data.id);
    const adminId = request.user?.id;

    if (id === adminId) {
      return reply.status(400).send({ error: 'You cannot delete yourself' });
    }

    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.role === 'ADMIN' && adminCount <= 1) {
      return reply.status(400).send({ error: 'Cannot delete last admin' });
    }

    await prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  });
}
