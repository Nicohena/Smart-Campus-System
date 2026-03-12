// MongoDB connection helper using Mongoose
// Reads `MONGO_URI` from process.env

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not defined in environment');
    return;
  }

  try {
    await mongoose.connect(uri);
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
