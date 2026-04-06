import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const adminUser = { 
      name: 'System Admin', 
      studentId: 'admin', 
      password: '123456', 
      role: 'admin', 
      department: 'Administration' 
    };

    const existing = await User.findOne({ studentId: adminUser.studentId });
    if (!existing) {
      await User.create(adminUser);
      console.log(`Successfully created admin user: ${adminUser.studentId}`);
    } else {
      console.log(`User ${adminUser.studentId} already exists`);
    }
  } catch (error) {
    console.error('Error seeding admin data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
