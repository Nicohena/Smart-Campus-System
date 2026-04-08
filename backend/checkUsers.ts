import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    const users = await User.find({}, 'name studentId role department');
    console.log('Users in DB:');
    console.log(JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkUsers();
