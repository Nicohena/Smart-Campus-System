import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const createDeptStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const staffUser = { 
      name: 'Science Dept Staff', 
      studentId: 'staff_sci', 
      password: '12345678', 
      role: 'department', 
      department: 'Computer Science' 
    };

    const existing = await User.findOne({ studentId: staffUser.studentId });
    if (!existing) {
      await User.create(staffUser);
      console.log(`Successfully created dept staff: ${staffUser.studentId}`);
    } else {
      existing.department = staffUser.department; // Update legacy user if needed
      await existing.save();
      console.log(`Updated legacy user: ${staffUser.studentId}`);
    }
  } catch (error) {
    console.error('Error creating dept staff:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createDeptStaff();
