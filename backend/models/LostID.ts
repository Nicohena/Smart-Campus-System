import mongoose, { Document, Schema } from 'mongoose';

/**
 * Status pipeline:
 *  blocked → replacement_requested → payment_pending →
 *  payment_submitted → payment_verified → temporary_issued → completed
 *
 * Terminal states: completed | expired | rejected
 */
export type LostIdStatus =
  | 'blocked'
  | 'replacement_requested'
  | 'payment_pending'
  | 'payment_submitted'
  | 'payment_verified'
  | 'temporary_issued'
  | 'completed'
  | 'expired'
  | 'rejected';

export type LostIdReason = 'lost' | 'damaged' | 'stolen' | 'other';

export interface HistoryEntry {
  action: string;
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  timestamp: Date;
  remarks?: string;
}

export interface TemporaryIdInfo {
  idNumber: string;
  issuedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface ILostID extends Document {
  student: mongoose.Types.ObjectId;
  studentId: string;
  reason: LostIdReason;
  status: LostIdStatus;

  // Payment
  paymentAmount: number;
  penaltyAmount: number;
  repeatCount: number;
  paymentReference?: string;
  paymentDeadline?: Date;
  paymentRequestedAt?: Date;
  paymentSubmittedAt?: Date;
  paymentVerifiedAt?: Date;

  // Fraud
  isFraudSuspected: boolean;

  // Temporary ID
  temporaryId?: TemporaryIdInfo;

  // Permanent ID
  permanentIdNumber?: string;
  completedAt?: Date;

  // Rejection
  rejectedFromStatus?: LostIdStatus;
  rejectionReason?: string;
  rejectedAt?: Date;

  // Audit trail
  history: HistoryEntry[];
}

const HistoryEntrySchema = new Schema<HistoryEntry>(
  {
    action:    { type: String, required: true },
    actorId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    remarks:   { type: String },
  },
  { _id: false }
);

const TemporaryIdSchema = new Schema<TemporaryIdInfo>(
  {
    idNumber:  { type: String, required: true },
    issuedAt:  { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    isActive:  { type: Boolean, default: true },
  },
  { _id: false }
);

const LostIdSchema: Schema<ILostID> = new Schema(
  {
    student:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true },
    reason:    { type: String, enum: ['lost','damaged','stolen','other'], required: true },
    status: {
      type: String,
      enum: ['blocked','replacement_requested','payment_pending','payment_submitted',
             'payment_verified','temporary_issued','completed','expired','rejected'],
      default: 'blocked',
    },

    paymentAmount:    { type: Number, default: 0 },
    penaltyAmount:    { type: Number, default: 0 },
    repeatCount:      { type: Number, default: 1 },
    paymentReference: { type: String },
    paymentDeadline:  { type: Date },
    paymentRequestedAt: { type: Date },
    paymentSubmittedAt: { type: Date },
    paymentVerifiedAt:  { type: Date },

    isFraudSuspected: { type: Boolean, default: false },

    temporaryId:       { type: TemporaryIdSchema },
    permanentIdNumber: { type: String },
    completedAt:       { type: Date },

    rejectedFromStatus: { type: String },
    rejectionReason:    { type: String },
    rejectedAt:         { type: Date },

    history: [HistoryEntrySchema],
  },
  { timestamps: true }
);

export default mongoose.model<ILostID>('LostID', LostIdSchema);
