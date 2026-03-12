import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
  createdAt: Date;
  revoked: boolean;
  replacedByToken?: mongoose.Types.ObjectId | null;
}

const RefreshTokenSchema: Schema<IRefreshToken> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    replacedByToken: { type: Schema.Types.ObjectId, ref: 'RefreshToken', default: null }
  },
  { timestamps: true }
);

// TTL index to automatically remove expired tokens
RefreshTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
