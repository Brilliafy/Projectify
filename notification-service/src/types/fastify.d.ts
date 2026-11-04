import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: number;
      role: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';
      fullName?: string;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; role: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER'; fullName?: string };
    user: { id: number; role: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER'; fullName?: string };
  }
}
