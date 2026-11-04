import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  leaderId: number;
  members: number[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    leaderId: { type: Number, required: true },
    members: [{ type: Number }],
  },
  { timestamps: true }
);

TeamSchema.index({ members: 1 });
TeamSchema.index({ leaderId: 1 });

export const Team: Model<ITeam> = mongoose.model<ITeam>('Team', TeamSchema);
