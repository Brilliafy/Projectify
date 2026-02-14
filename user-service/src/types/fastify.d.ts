import 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: number;
            role: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';
        }
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { id: number; role: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER' }
        user: { id: number; role: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER' }
    }
}
