import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const fixDepts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const result = await User.updateMany(
      { role: 'department', department: { $in: [null, ""] } },
      { $set: { department: 'General Science' } }
    );
    console.log(`Updated ${result.modifiedCount} users with general department.`);

    const admin = await User.findOne({ role: 'admin' });
    if (admin && (!admin.department || admin.department === '')) {
      admin.department = 'Administration';
      await admin.save();
      console.log('Updated admin department.');
    }

  } catch (error) {
    console.error('Error fixing departments:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixDepts();
