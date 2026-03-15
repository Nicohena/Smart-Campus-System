import mongoose, { Document, Schema } from 'mongoose';

export type NoticeCategory =
  | 'general'
  | 'department'
  | 'club'
  | 'security'
  | 'academic'
  | 'event';

export type NoticeAudience = 'all_students' | 'department_students' | 'dorm_students';

export type NoticePriority = 'low' | 'normal' | 'high' | 'urgent';

export type NoticeStatus = 'active' | 'expired';

export interface INotice extends Document {
  title: string;
  description: string;
  category: NoticeCategory;
  createdBy: mongoose.Types.ObjectId;
  targetAudience: NoticeAudience;
  department?: string;
  dormBlock?: string;
  priority: NoticePriority;
  attachments: string[];
  status: NoticeStatus;
  expiryDate?: Date;
}

const NoticeSchema: Schema<INotice> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'department', 'club', 'security', 'academic', 'event'],
      required: true
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetAudience: {
      type: String,
      enum: ['all_students', 'department_students', 'dorm_students'],
      required: true
    },
    department: { type: String },
    dormBlock: { type: String },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    attachments: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    expiryDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<INotice>('Notice', NoticeSchema);
