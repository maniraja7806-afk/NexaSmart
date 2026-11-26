import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientUserId?: mongoose.Types.ObjectId;
  targetRole?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    targetRole: { type: String, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['INFO', 'WARNING', 'ALERT', 'SUCCESS'], default: 'INFO' },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
