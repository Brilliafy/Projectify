import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAttachment, AttachmentSchema } from './task.model';

export interface IComment extends Document {
  taskId: mongoose.Types.ObjectId;
  text: string;
  creatorId: number;
  creatorName: string;
  creatorRole: string;
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    text: { type: String, required: true },
    creatorId: { type: Number, required: true },
    creatorName: { type: String, required: true },
    creatorRole: { type: String, required: true },
    attachments: [AttachmentSchema],
  },
  { timestamps: true }
);

CommentSchema.index({ taskId: 1, createdAt: 1 });

export const Comment: Model<IComment> = mongoose.model<IComment>('Comment', CommentSchema);
