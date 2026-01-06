import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import util from 'util';
import Redis from 'ioredis';
import mongoose, { Schema } from 'mongoose';



const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    leaderId: { type: Number, required: true },
    members: [{ type: Number }],
  },
  { timestamps: true }
);

const Team = mongoose.model('Team', TeamSchema);



const server = Fastify();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});
server.register(cors, {
  origin: true, // Allow all origins (or specify your frontend URL like 'http://localhost:5173')
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
server.register(jwt, { secret: process.env.JWT_SECRET || 'dev_secret' });



async function requireAuth(req: any) {
  await req.jwtVerify();
  return req.user as { id: number; role: string };
}

function requireLeader(user: any, team: any, reply: any) {
  if (team.leaderId !== user.id) {
    reply.status(403).send({ error: 'Only Team Leader can perform this action' });
    return false;
  }
  return true;
}




server.get('/api/teams/mine', async (req) => {
  const user = await requireAuth(req);
  return Team.find({ members: user.id }).sort({ createdAt: -1 });
});


server.get('/api/teams/owned', async (req) => {
  const user = await requireAuth(req);
  return Team.find({ leaderId: user.id }).sort({ createdAt: -1 });
});


server.get('/api/teams', async (req, reply) => {
  const user = await requireAuth(req);
  if (user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
  return Team.find({}).sort({ createdAt: -1 });
});







server.post('/api/teams', async (req, reply) => {
  const user = await requireAuth(req);
  if (!['TEAM_LEADER', 'ADMIN'].includes(user.role)) {
    return reply.status(403).send({ error: 'Only team leaders can create teams' });
  }



  const { name, description } = req.body as any;
  if (!name) return reply.status(400).send({ error: 'Team name is required' });

  
  const duplicate = await Team.findOne({ name });
  if (duplicate) {
    return reply.status(400).send({ error: 'This team already exists' });
  }

  const team = await Team.create({
    name,
    description,
    leaderId: user.id,
    members: [user.id],
  });

  return team;
});


server.get('/api/teams/:id', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return reply.status(400).send({ error: 'Invalid team id' });
  }

  const team = await Team.findById(id);
  if (!team) return reply.status(404).send({ error: 'Team not found' });

  if (!team.members.includes(user.id) && user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Access denied' });
  }

  return team;
});


server.post('/api/teams/:id/members', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;
  const { userIdToAdd } = req.body as any;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return reply.status(400).send({ error: 'Invalid team id' });
  }

  const team = await Team.findById(id);
  if (!team) return reply.status(404).send({ error: 'Team not found' });
  if (!requireLeader(user, team, reply)) return;

  if (!userIdToAdd || typeof userIdToAdd !== 'number') {
    return reply.status(400).send({ error: 'Invalid userIdToAdd' });
  }

  await Team.findByIdAndUpdate(id, { $addToSet: { members: userIdToAdd } });

  
  redis.publish('notifications', JSON.stringify({
    userIds: [userIdToAdd],
    type: 'TEAM_ADDED',
    message: `You have been added to team "${team.name}"`,
    relatedId: team._id,
    metadata: { teamName: team.name, leaderName: (user as any).fullName || 'Team Leader' }
  }));

  return { message: 'Member added successfully' };
});


server.delete('/api/teams/:id/members/:userId', async (req, reply) => {
  const user = await requireAuth(req);
  const { id, userId } = req.params as any;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return reply.status(400).send({ error: 'Invalid team id' });
  }

  const team = await Team.findById(id);
  if (!team) return reply.status(404).send({ error: 'Team not found' });
  if (!requireLeader(user, team, reply)) return;

  if (Number(userId) === team.leaderId) {
    return reply.status(400).send({ error: 'Cannot remove leader' });
  }

  await Team.findByIdAndUpdate(id, { $pull: { members: Number(userId) } });
  return { message: 'Member removed successfully' };
});

server.patch('/api/teams/:id', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;
  const { name, description } = req.body as any;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return reply.status(400).send({ error: 'Invalid team id' });
  }

  const team = await Team.findById(id);
  if (!team) {
    return reply.status(404).send({ error: 'Team not found' });
  }

  
  if (!requireLeader(user, team, reply)) return;

  const update: any = {};
  if (typeof name === 'string' && name.trim()) {
    const newName = name.trim();
    
    const duplicate = await Team.findOne({ name: newName, _id: { $ne: id } });
    if (duplicate) {
      return reply.status(400).send({ error: 'Team name must be unique' });
    }
    update.name = newName;
  }
  if (typeof description === 'string') update.description = description;

  const updatedTeam = await Team.findByIdAndUpdate(id, update, { new: true });
  return updatedTeam;
});

server.delete('/api/teams/:id', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return reply.status(400).send({ error: 'Invalid team id' });
  }

  const team = await Team.findById(id);
  if (!team) {
    return reply.status(404).send({ error: 'Team not found' });
  }

  
  if (!requireLeader(user, team, reply)) return;

  await Team.findByIdAndDelete(id);
  return { message: 'Team deleted successfully' };
});




const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    await server.listen({ port: 3002, host: '0.0.0.0' });
    console.log('Team Service running on http://localhost:3002');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

start();
