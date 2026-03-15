import mongoose, { Document, Schema } from 'mongoose';

export interface DormInspectionConditions {
  windows: boolean;
  bed: boolean;
  locker: boolean;
  table: boolean;
  chair: boolean;
  lightBulb: boolean;
  doorLock: boolean;
}

export interface IDormInspection extends Document {
  dorm: mongoose.Types.ObjectId;
  inspectedBy: mongoose.Types.ObjectId;
  inspectionDate: Date;
  conditions: DormInspectionConditions;
  cleanliness: boolean;
  damages?: string;
  approved: boolean;
}

const DormInspectionSchema: Schema<IDormInspection> = new Schema(
  {
    dorm: { type: Schema.Types.ObjectId, ref: 'Dorm', required: true },
    inspectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inspectionDate: { type: Date, default: Date.now },
    conditions: {
      windows: { type: Boolean, required: true },
      bed: { type: Boolean, required: true },
      locker: { type: Boolean, required: true },
      table: { type: Boolean, required: true },
      chair: { type: Boolean, required: true },
      lightBulb: { type: Boolean, required: true },
      doorLock: { type: Boolean, required: true }
    },
    cleanliness: { type: Boolean, required: true },
    damages: { type: String },
    approved: { type: Boolean, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IDormInspection>('DormInspection', DormInspectionSchema);
