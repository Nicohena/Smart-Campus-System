import mongoose, { Document, Schema } from 'mongoose';

// Simple User model as an example
export interface IUser extends Document {
  name: string;
  email: string;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
