import mongoose, { Document, Schema } from 'mongoose';

export type ClearanceStatus = 'pending' | 'in_progress' | 'approved' | 'rejected';

export interface ClearanceApproval {
  status: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  date?: Date;
}

export interface IClearance extends Document {
  student: mongoose.Types.ObjectId;
  studentId: string;
  academicYear: string;
  status: ClearanceStatus;
  libraryApproval: ClearanceApproval;
  cafeteriaApproval: ClearanceApproval;
  proctorApproval: ClearanceApproval;
  securityApproval: ClearanceApproval;
  remarks?: string;
}

const ClearanceApprovalSchema = new Schema<ClearanceApproval>(
  {
    status: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date }
  },
  { _id: false }
);

const ClearanceSchema: Schema<IClearance> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true },
    academicYear: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'approved', 'rejected'],
      default: 'pending'
    },
    libraryApproval: { type: ClearanceApprovalSchema, default: () => ({}) },
    cafeteriaApproval: { type: ClearanceApprovalSchema, default: () => ({}) },
    proctorApproval: { type: ClearanceApprovalSchema, default: () => ({}) },
    securityApproval: { type: ClearanceApprovalSchema, default: () => ({}) },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IClearance>('Clearance', ClearanceSchema);
