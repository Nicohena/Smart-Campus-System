import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User interface describing the document
export interface IUser extends Document {
  name: string;
  studentId: string;
  password: string;
  role: 'student' | 'staff' | 'admin';
  department?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mongoose schema for users
const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
    department: { type: String }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
