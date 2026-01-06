import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit'; // Security: Rate Limiting
import mongoose, { Schema } from 'mongoose';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import util from 'util';
import Redis from 'ioredis';

const pump = util.promisify(pipeline);


const KEY_FILE_PATH = path.join(__dirname, '../projectify-483418-6362647cff27.json');
const BUCKET_NAME = 'projectify-attachments-storage'; // ✅ Updated Bucket Name

const storage = new Storage({
  keyFilename: KEY_FILE_PATH,
  projectId: 'projectify-483418',
});
const bucket = storage.bucket(BUCKET_NAME);
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});



const AttachmentSchema = new Schema({
  fileName: String,
  originalName: String,
  mimeType: String,
  size: Number,
  gcsFileName: String,
  uploadedAt: { type: Date, default: Date.now }
});

const CommentSchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  text: { type: String, required: true },
  creatorId: { type: Number, required: true },
  creatorName: { type: String, required: true },
  creatorRole: { type: String, required: true },
  attachments: [AttachmentSchema],
}, { timestamps: true });

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  status: { 
    type: String, 
    enum: ['TODO', 'IN_PROGRESS', 'DONE'], 
    default: 'TODO' 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH'], 
    default: 'MEDIUM' 
  },
  deadline: Date,
  teamId: { type: String, required: true },
  creatorId: { type: Number, required: true },
  assigneeIds: [{ type: Number }],
  attachments: [AttachmentSchema],
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);
const Comment = mongoose.model('Comment', CommentSchema);



const server = Fastify({
  logger: true
});

server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

server.register(jwt, { secret: process.env.JWT_SECRET || 'supersecretkey123' });

// Limit upload size to 2MB per file
server.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  }
});

// ✅ Rate Limiting: 100 requests per 15 minutes to prevent abuse
// Prompt: "Make sure that the user can't make too many requests to upload files... static hosting"
server.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
  errorResponseBuilder: (req, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'You have exceeded the request limit. Please try again later.'
  })
});

//  HELPERS 

async function generateSignedUrl(gcsFileName: string) {
  try {
    const file = bucket.file(gcsFileName);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return url;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return null;
  }
}

async function uploadToGCS(part: any): Promise<any> {
  const uniqueName = `${Date.now()}-${part.filename}`;
  const file = bucket.file(uniqueName);
  
  const stream = file.createWriteStream({
    resumable: false,
    contentType: part.mimetype,
  });

  await pump(part.file, stream);
  
  return {
    fileName: uniqueName,
    originalName: part.filename,
    mimeType: part.mimetype,
    gcsFileName: uniqueName,
    size: (await file.getMetadata())[0].size 
  };
}

//  MIDDLEWARE 
async function requireAuth(req: any) {
  await req.jwtVerify();
  return req.user as { id: number; role: string; fullName: string };
}

//  ROUTES 


server.post('/api/tasks', async (req, reply) => {
  const user = await requireAuth(req);
  
  const parts = req.parts();
  let fields: any = {};
  let attachments: any[] = [];
  let fileCount = 0;


  const ALLOWED_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.zip', '.rar', '.7z', '.pdf', '.txt'];

  try {
    for await (const part of parts) {
      if (part.type === 'file') {
        fileCount++;
        if (fileCount > 5) {
           throw new Error('MAX_FILES_EXCEEDED');
        }

        const ext = path.extname(part.filename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error('INVALID_FILE_TYPE');
        }

        const uploaded = await uploadToGCS(part);
        attachments.push(uploaded);
      } else {
        fields[part.fieldname] = part.value;
      }
    }
  } catch (err: any) {
    if (err.message === 'MAX_FILES_EXCEEDED') {
      return reply.code(400).send({ error: 'Max 5 attachments allowed per task' });
    }
    if (err.message === 'INVALID_FILE_TYPE') {
        return reply.code(400).send({ error: 'Invalid file type. Allowed: .webp .jpg .jpeg .zip .rar .7z .pdf .txt' });
    }
    if (err.code === 'FST_LIMITS_FILE_SIZE') { // Correct fastify-multipart error code for size limit
      return reply.code(413).send({ error: 'File too large. Max 2MB.' });
    }
    // Fallback for generic yield errors
    if (err.code === 'FST_YIELD_ERROR') {
       return reply.code(413).send({ error: 'File too large. Max 2MB.' });
    }
    console.error(err);
    return reply.code(500).send({ error: 'Upload failed' });
  }


  if (user.role !== 'TEAM_LEADER') {
    return reply.code(403).send({ error: 'Only Team Leaders can create tasks' });
  }

  const assigneeIds = fields.assigneeIds ? JSON.parse(fields.assigneeIds) : [];
  const teamId = fields.teamId;

  // Validate Deadline
  if (fields.deadline) {
    const deadlineDate = new Date(fields.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      return reply.code(400).send({ error: 'Deadline cannot be in the past' });
    }
  }

  const task = await Task.create({
    title: fields.title,
    description: fields.description,
    status: 'TODO',
    priority: fields.priority || 'MEDIUM',
    deadline: fields.deadline ? new Date(fields.deadline) : undefined,
    teamId,
    creatorId: user.id,
    assigneeIds,
    attachments
  });

  // PUBLISH NOTIFICATION
  redis.publish('notifications', JSON.stringify({
    userIds: assigneeIds,
    type: 'TASK_ASSIGNED',
    message: `You have been assigned to task "${task.title}"`,
    relatedId: task._id,
    metadata: { creatorName: user.fullName }
  }));

  return task;
});


server.get('/api/tasks', async (req, reply) => {
  const user = await requireAuth(req);
  const { teamId } = req.query as any;

  let query: any = {};
  
  if (teamId) {
    query.teamId = teamId;
  }

  if (user.role === 'ADMIN') {
    // Admin sees all
  } else if (user.role === 'TEAM_LEADER') {
    query.$or = [{ creatorId: user.id }, { assigneeIds: user.id }];
  } else {
    query.assigneeIds = user.id;
  }

  const tasks = await Task.find(query).sort({ createdAt: -1 });
  return tasks;
});


server.get('/api/tasks/:id', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;

  const task = await Task.findById(id);
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  const canView = user.role === 'ADMIN' || 
                  task.creatorId === user.id || 
                  task.assigneeIds.includes(user.id);
  
  if (!canView) return reply.code(403).send({ error: 'Access denied' });

  // Generate URLs (15 mins)
  const attachmentsWithUrls = await Promise.all(task.attachments.map(async (att: any) => {
    const url = await generateSignedUrl(att.gcsFileName);
    return { ...att.toObject(), url };
  }));

  return { ...task.toObject(), attachments: attachmentsWithUrls };
});


server.delete('/api/tasks/:id', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;

  const task = await Task.findById(id);
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  if (task.creatorId !== user.id) {
    return reply.code(403).send({ error: 'Only the creator (Team Leader) can delete this task' });
  }

  for (const att of task.attachments) {
    try {
      if (att.gcsFileName) {
        await bucket.file(att.gcsFileName).delete();
      }
    } catch (e) {
      console.warn(`Failed to delete file ${att.gcsFileName}`, e);
    }
  }

  await Comment.deleteMany({ taskId: id });
  await Task.findByIdAndDelete(id);
  return { message: 'Deleted' };
});


server.patch('/api/tasks/:id/status', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;
  const { status } = req.body as any;

  const task = await Task.findById(id);
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  const canEdit = user.role === 'ADMIN' || 
                  task.creatorId === user.id || 
                  task.assigneeIds.includes(user.id);
  
  if (!canEdit) return reply.code(403).send({ error: 'Access denied' });

  task.status = status;
  await task.save();

  // PUBLISH NOTIFICATION
  const recipients = [...task.assigneeIds];
  if (task.creatorId !== user.id) recipients.push(task.creatorId);

  redis.publish('notifications', JSON.stringify({
    userIds: recipients.filter(id => id !== user.id), // Don't notify self
    type: 'TASK_UPDATED',
    message: `Task "${task.title}" status changed to ${status}`,
    relatedId: task._id,
    metadata: { updaterName: user.fullName, newStatus: status }
  }));

  return task;
});


server.patch('/api/tasks/:id', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;
  const { title, description, priority } = req.body as any;

  const task = await Task.findById(id);
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  // Only creator or admin can update core fields
  const isAdmin = user.role === 'ADMIN';
  const isCreator = task.creatorId === user.id;

  if (!isAdmin && !isCreator) {
    return reply.code(403).send({ error: 'Only the creator can edit task details' });
  }

  if (title && title !== task.title) {
     const existing = await Task.findOne({ teamId: task.teamId, title });
     if (existing) {
       return reply.code(400).send({ error: 'Task with this title already exists in this team' });
     }
     task.title = title;
  }

  if (description !== undefined) {
    task.description = description;
  }

  if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
    task.priority = priority;
  }

  await task.save();
  return task;
});

//  COMMENTS 

server.get('/api/tasks/:id/comments', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;
  
  const task = await Task.findById(id);
  if (!task) return reply.code(404).send({ error: 'Task not found' });
  
  const canView = user.role === 'ADMIN' || 
                  task.creatorId === user.id || 
                  task.assigneeIds.includes(user.id);
                  
  if (!canView) return reply.code(403).send({ error: 'Access denied' });

  const comments = await Comment.find({ taskId: id }).sort({ createdAt: 1 });

  const enrichedComments = await Promise.all(comments.map(async (c: any) => {
    const atts = await Promise.all(c.attachments.map(async (a: any) => {
      return { ...a.toObject(), url: await generateSignedUrl(a.gcsFileName) };
    }));
    return { ...c.toObject(), attachments: atts };
  }));

  return enrichedComments;
});

server.post('/api/tasks/:id/comments', async (req, reply) => {
  const user = await requireAuth(req);
  const { id } = req.params as any;

  if (user.role === 'ADMIN') {
    return reply.code(403).send({ error: 'Admins cannot comment' });
  }

  const parts = req.parts();
  let fields: any = {};
  let attachments: any[] = [];
  let fileCount = 0;


  const ALLOWED_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.zip', '.rar', '.7z', '.pdf', '.txt'];

  try {
    for await (const part of parts) {
      if (part.type === 'file') {
        fileCount++;
        if (fileCount > 5) throw new Error('MAX_FILES_EXCEEDED');
        
        const ext = path.extname(part.filename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error('INVALID_FILE_TYPE');
        }

        const uploaded = await uploadToGCS(part);
        attachments.push(uploaded);
      } else {
        fields[part.fieldname] = part.value;
      }
    }
  } catch (err: any) {
    if (err.message === 'MAX_FILES_EXCEEDED') return reply.code(400).send({ error: 'Max 5 attachments allowed' });
    if (err.message === 'INVALID_FILE_TYPE') {
        return reply.code(400).send({ error: 'Invalid file type. Allowed: .webp .jpg .jpeg .zip .rar .7z .pdf .txt' });
    }
    if (err.code === 'FST_LIMITS_FILE_SIZE') return reply.code(413).send({ error: 'File too large. Max 2MB.' });
    if (err.code === 'FST_YIELD_ERROR') return reply.code(413).send({ error: 'File too large' });
    return reply.code(500).send({ error: 'Upload failed' });
  }

  const task = await Task.findById(id);
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  const canComment = task.creatorId === user.id || task.assigneeIds.includes(user.id);
  if (!canComment) return reply.code(403).send({ error: 'Access denied' });

  const comment = await Comment.create({
    taskId: id,
    text: fields.text,
    creatorId: user.id,
    creatorName: fields.creatorName || 'Unknown',
    creatorRole: user.role,
    attachments
  });

  // PUBLISH NOTIFICATION
  redis.publish('notifications', JSON.stringify({
    userIds: [task.creatorId, ...task.assigneeIds].filter(uid => uid !== user.id),
    type: 'COMMENT_ADDED',
    message: `New comment on task "${task.title}"`,
    relatedId: task._id,
    metadata: { commenterName: user.fullName }
  }));

  return comment;
});

//  INIT 

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb');
    await server.listen({ port: 3003, host: '0.0.0.0' });
    console.log('Task Service running on 3003');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();