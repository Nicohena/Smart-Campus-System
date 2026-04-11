import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    user:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:        { type: String, required: true },
    message:      { type: String, required: true },
    type:         { type: String, enum: ['info','success','warning','error'], default: 'info' },
    isRead:       { type: Boolean, default: false },
    relatedId:    { type: Schema.Types.ObjectId },
    relatedModel: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
