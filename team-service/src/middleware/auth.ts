import { FastifyRequest, FastifyReply } from 'fastify';
import { ITeam } from '../models/team.model';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireLeader(user: { id: number; role: string }, team: ITeam, reply: FastifyReply): boolean {
  if (team.leaderId !== user.id && user.role !== 'ADMIN') {
    reply.status(403).send({ error: 'Only Team Leader can perform this action' });
    return false;
  }
  return true;
}
