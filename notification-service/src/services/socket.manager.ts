import { Server as SocketIOServer, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';

export class SocketManager {
  private io: SocketIOServer | null = null;

  public init(server: FastifyInstance): void {
    this.io = new SocketIOServer(server.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      try {
        const decoded = server.jwt.verify<{ id: number; role: string }>(token);
        const userId = decoded.id;

        socket.join(`user:${userId}`);
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      } catch (err) {
        console.warn('Socket token verification failed for socket:', socket.id);
        socket.disconnect();
      }
    });
  }

  public emitToUser(userId: number, event: string, data: unknown): void {
    if (!this.io) {
      console.warn('SocketManager.emitToUser called before initialization');
      return;
    }
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
  }
}

export const socketManager = new SocketManager();
