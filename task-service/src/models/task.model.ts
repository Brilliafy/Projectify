import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  gcsFileName: string;
  uploadedAt: Date;
}

export const AttachmentSchema = new Schema<IAttachment>({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  gcsFileName: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: Date;
  teamId: string;
  creatorId: number;
  assigneeIds: number[];
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE'],
      default: 'TODO',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    deadline: { type: Date },
    teamId: { type: String, required: true, index: true },
    creatorId: { type: Number, required: true, index: true },
    assigneeIds: [{ type: Number, index: true }],
    attachments: [AttachmentSchema],
  },
  { timestamps: true }
);

TaskSchema.index({ teamId: 1, createdAt: -1 });

export const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);
