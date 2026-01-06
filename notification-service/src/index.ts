import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import socketio from 'fastify-socket.io';
import mongoose, { Schema } from 'mongoose';
import Redis from 'ioredis';
import { Socket } from 'socket.io';



const NotificationSchema = new Schema(
  {
    userId: { type: Number, required: true, index: true }, // The user who receives the notification
    type: { type: String, required: true, enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'COMMENT_ADDED', 'TEAM_ADDED'] },
    message: { type: String, required: true },
    relatedId: { type: String }, // ID of the task or team
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }, // Extra info like creator name, etc.
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', NotificationSchema);



const server = Fastify();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
});

server.register(jwt, { secret: process.env.JWT_SECRET || 'dev_secret' });

server.register(socketio, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});



const sub = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

sub.subscribe('notifications', (err, count) => {
  if (err) {
    console.error('Failed to subscribe to notifications channel:', err);
  } else {
    console.log(`Subscribed to ${count} channel(s). Listening for updates...`);
  }
});

sub.on('message', async (channel, message) => {
  if (channel === 'notifications') {
    try {
      const data = JSON.parse(message);
      // data: { userIds: number[], type: string, message: string, relatedId: string, metadata?: any }
      
      console.log('Received Redis message:', data);

      const notificationsToCreate = data.userIds.map((uid: number) => ({
        userId: uid,
        type: data.type,
        message: data.message,
        relatedId: data.relatedId,
        metadata: data.metadata,
        read: false
      }));

      
      const createdNotifications = await Notification.insertMany(notificationsToCreate);

      
      createdNotifications.forEach((notif) => {
         (server as any).io.to(`user:${notif.userId}`).emit('notification', notif);
      });

    } catch (e) {
      console.error('Error processing Redis message:', e);
    }
  }
});



server.ready().then(() => {
  (server as any).io.on('connection', async (socket: Socket) => {
    console.log('New socket connection:', socket.id);
    
    // Authenticate
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('No token provided, disconnecting', socket.id);
      socket.disconnect();
      return;
    }

    try {
      // Manually verify token since socket.io doesn't use fastify-jwt decorator automatically on handshake
      const decoded: any = server.jwt.verify(token);
      const userId = decoded.id;
      
      console.log(`User ${userId} authenticated on socket ${socket.id}`);
      
      // Join a room specific to this user
      socket.join(`user:${userId}`);

    } catch (err) {
      console.error('Socket authentication failed:', err);
      socket.disconnect();
    }
  });
});



// Middleware helper
async function requireAuth(req: any) {
  try {
    await req.jwtVerify();
    return req.user as { id: number; role: string };
  } catch (err) {
    throw { statusCode: 401, message: 'Unauthorized' };
  }
}

// GET /api/notifications - Fetch user's notifications
server.get('/api/notifications', async (req, reply) => {
  const user = await requireAuth(req);
  
  const notifications = await Notification.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 for now
    
  return notifications;
});

// PATCH /api/notifications/:id/read - Mark one as read
server.patch('/api/notifications/:id/read', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return reply.status(400).send({ error: 'Invalid ID' });
  }

  const notif = await Notification.findOneAndUpdate(
    { _id: id, userId: user.id },
    { read: true },
    { new: true }
  );

  if (!notif) return reply.status(404).send({ error: 'Notification not found' });
  return notif;
});

// PATCH /api/notifications/read-all - Mark all as read
server.patch('/api/notifications/read-all', async (req, reply) => {
  const user = await requireAuth(req);

  await Notification.updateMany(
    { userId: user.id, read: false },
    { read: true }
  );

  return { message: 'All notifications marked as read' };
});

// DELETE /api/notifications - Clear all (Optional, maybe for cleanup)
server.delete('/api/notifications', async (req, reply) => {
    const user = await requireAuth(req);
    await Notification.deleteMany({ userId: user.id });
    return { message: 'Notifications cleared' };
});



const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    await server.listen({ port: Number(process.env.PORT) || 3004, host: '0.0.0.0' });
    console.log('Notification Service running on http://localhost:3004');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

start();
