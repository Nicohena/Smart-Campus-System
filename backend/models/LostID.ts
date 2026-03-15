import mongoose, { Document, Schema } from 'mongoose';

export type LostIdStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface LostIdStamps {
  security: boolean;
  cafeteria: boolean;
  library: boolean;
  department: boolean;
  proctor: boolean;
}

export interface ILostID extends Document {
  student: mongoose.Types.ObjectId;
  studentId: string;
  requestDate: Date;
  status: LostIdStatus;
  stamps: LostIdStamps;
  paymentStatus: boolean;
  temporaryIdIssued: boolean;
  remarks?: string;
}

const LostIdSchema: Schema<ILostID> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true },
    requestDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    stamps: {
      security: { type: Boolean, default: false },
      cafeteria: { type: Boolean, default: false },
      library: { type: Boolean, default: false },
      department: { type: Boolean, default: false },
      proctor: { type: Boolean, default: false }
    },
    paymentStatus: { type: Boolean, default: false },
    temporaryIdIssued: { type: Boolean, default: false },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<ILostID>('LostID', LostIdSchema);
