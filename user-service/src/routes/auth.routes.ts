import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../schemas/user.schema';

export async function authRoutes(server: FastifyInstance) {
  server.post('/api/users/register', async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues[0]?.message || 'Invalid input' });
    }

    const { email, password, fullName } = parseResult.data;
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

      return reply.status(201).send({
        message: 'Account created. Awaiting admin approval.',
        id: user.id,
      });
    } catch {
      return reply.status(400).send({ error: 'Email already exists' });
    }
  });

  server.post('/api/users/login', async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const { email, password } = parseResult.data;
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
}
