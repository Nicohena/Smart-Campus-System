import mongoose, { Document, Schema } from 'mongoose';

export type IssueType =
  | 'power'
  | 'water'
  | 'furniture'
  | 'electrical'
  | 'internet'
  | 'plumbing'
  | 'other';

export type IssueStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface IIssue extends Document {
  student: mongoose.Types.ObjectId;
  studentId: string;
  dorm?: mongoose.Types.ObjectId;
  block?: string;
  roomNumber?: number;
  issueType: IssueType;
  description: string;
  status: IssueStatus;
  assignedTechnician?: mongoose.Types.ObjectId;
  reportedAt: Date;
  resolvedAt?: Date;
  remarks?: string;
}

const IssueSchema: Schema<IIssue> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true },
    dorm: { type: Schema.Types.ObjectId, ref: 'Dorm' },
    block: { type: String },
    roomNumber: { type: Number },
    issueType: {
      type: String,
      enum: ['power', 'water', 'furniture', 'electrical', 'internet', 'plumbing', 'other'],
      required: true
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['reported', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'reported'
    },
    assignedTechnician: { type: Schema.Types.ObjectId, ref: 'User' },
    reportedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IIssue>('Issue', IssueSchema);
