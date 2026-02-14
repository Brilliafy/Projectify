import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { PrismaClient, Role } from '@db/client';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

const server = Fastify();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
server.register(jwt, { secret: process.env.JWT_SECRET || 'dev_secret' });



interface IdParams {
  id: string;
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await request.jwtVerify();
  if (request.user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}



interface RegisterBody {
  email: string;
  password: string;
  fullName: string;
}

server.post<{ Body: RegisterBody }>('/api/users/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
  const { email, password, fullName } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        role: 'MEMBER',
        isActive: false,
      },
    });

    return {
      message: 'Account created. Awaiting admin approval.',
      id: user.id,
    };
  } catch {
    return reply.status(400).send({ error: 'Email already exists' });
  }
});

interface LoginBody {
  email: string;
  password: string;
}

server.post<{ Body: LoginBody }>('/api/users/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
  const { email, password } = request.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return reply.status(403).send({ error: 'Account not activated by admin' });
  }

  const token = server.jwt.sign({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
});



server.get('/api/users/admin', async (request: FastifyRequest, reply: FastifyReply) => {
  await requireAdmin(request, reply);

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

server.patch<{ Params: IdParams }>('/api/users/admin/:id/activate', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
  await requireAdmin(request, reply);

  const { id } = request.params;
  return prisma.user.update({
    where: { id: Number(id) },
    data: { isActive: true },
  });
});

interface RoleBody {
  role: Role;
}

server.patch<{ Params: IdParams; Body: RoleBody }>('/api/users/admin/:id/role', async (request: FastifyRequest<{ Params: IdParams; Body: RoleBody }>, reply: FastifyReply) => {
  await requireAdmin(request, reply);

  const { id } = request.params;
  const { role } = request.body;

  return prisma.user.update({
    where: { id: Number(id) },
    data: { role },
  });
});

server.delete<{ Params: IdParams }>('/api/users/admin/:id', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
  await requireAdmin(request, reply);

  const { id } = request.params;
  const adminId = request.user.id;

  if (Number(id) === adminId) {
    return reply.status(400).send({ error: 'You cannot delete yourself' });
  }

  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' },
  });

  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (user?.role === 'ADMIN' && adminCount <= 1) {
    return reply.status(400).send({ error: 'Cannot delete last admin' });
  }

  await prisma.user.delete({ where: { id: Number(id) } });
  return { message: 'User deleted' };
});


server.get('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
  // Require authentication
  await request.jwtVerify();
  const user = request.user;

  // Return only active users
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
    orderBy: { fullName: 'asc' },
  });

  return users;
});



server.listen({ port: 3001, host: '0.0.0.0' }).then(() => {
  console.log('User Service running on http://localhost:3001');
});
