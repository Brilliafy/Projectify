import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'COMMENT_ADDED' | 'TEAM_ADDED';

export interface INotification extends Document {
  userId: number;
  type: NotificationType;
  message: string;
  relatedId?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Number, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'COMMENT_ADDED', 'TEAM_ADDED'],
    },
    message: { type: String, required: true },
    relatedId: { type: String },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
