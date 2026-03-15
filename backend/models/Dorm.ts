import mongoose, { Document, Schema } from 'mongoose';

export type DormStatus = 'available' | 'occupied' | 'maintenance';

export interface IDorm extends Document {
  block: string;
  roomNumber: number;
  capacity: number;
  students: mongoose.Types.ObjectId[];
  department?: string;
  isSpecialNeedsDorm: boolean;
  status: DormStatus;
}

const DormSchema: Schema<IDorm> = new Schema(
  {
    block: { type: String, required: true },
    roomNumber: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    department: { type: String },
    isSpecialNeedsDorm: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available'
    }
  },
  { timestamps: true }
);

export default mongoose.model<IDorm>('Dorm', DormSchema);
