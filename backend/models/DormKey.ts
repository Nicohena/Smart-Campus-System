import mongoose, { Document, Schema } from 'mongoose';

export interface IDormKey extends Document {
  dorm: mongoose.Types.ObjectId;
  keyNumber: string;
  issuedTo: mongoose.Types.ObjectId;
  issuedDate: Date;
  returned: boolean;
}

const DormKeySchema: Schema<IDormKey> = new Schema(
  {
    dorm: { type: Schema.Types.ObjectId, ref: 'Dorm', required: true },
    keyNumber: { type: String, required: true },
    issuedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedDate: { type: Date, default: Date.now },
    returned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IDormKey>('DormKey', DormKeySchema);
