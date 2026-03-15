import mongoose, { Document, Schema } from 'mongoose';

export type ComplaintCategory =
  | 'dorm'
  | 'cafeteria'
  | 'library'
  | 'security'
  | 'academic'
  | 'harassment'
  | 'other';

export type ComplaintStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';

export type ComplaintPriority = 'low' | 'medium' | 'high';

export interface IComplaint extends Document {
  student: mongoose.Types.ObjectId;
  studentId: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  handledBy?: mongoose.Types.ObjectId;
  remarks?: string;
  submittedAt: Date;
  resolvedAt?: Date;
}

const ComplaintSchema: Schema<IComplaint> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true },
    category: {
      type: String,
      enum: ['dorm', 'cafeteria', 'library', 'security', 'academic', 'harassment', 'other'],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'],
      default: 'submitted'
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    submittedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
