import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Load JWT secret from environment (provide a fallback for development)
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// POST /api/auth/register
// Creates a new user. Only staff/admin should be allowed to call this route
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, studentId, email, password, role = 'student', department } = req.body;
    if (!name || !studentId || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Prevent creating duplicate users
    const existing = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existing) {
      res.status(409).json({ message: 'User with that email or studentId already exists' });
      return;
    }

    const user = new User({ name, studentId, email, password, role, department });
    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;

    res.status(201).json({ user: userObj });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
};

// POST /api/auth/login
// Students (and other roles) use this to obtain a JWT
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await (user as IUser).comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    const userObj = user.toObject();
    delete (userObj as any).password;

    res.json({ token, user: userObj });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};

// GET /api/auth/profile
// Returns the current logged-in user's profile
export const profile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch profile', error });
  }
};
