import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS) || 7;

if (!JWT_SECRET) {
  // Fail fast - JWT secret must be provided for security
  // eslint-disable-next-line no-console
  console.error('JWT_SECRET not set. Set JWT_SECRET in environment.');
  process.exit(1);
}

const signAccessToken = (payload: object) => jwt.sign(payload, JWT_SECRET as string, { expiresIn: '1d' });

// Helper to create a refresh token (random string) and expiry
const generateRefreshToken = () => {
  const token = crypto.randomBytes(48).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return { token, expires };
};

// POST /api/auth/register
// Creates a new user. Only staff/admin should be allowed to call this route
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, studentId, email, password, role = 'student', department } = req.body;
    if (!name || !studentId || !email || !password) {
      sendError(res, 'Missing required fields', 400);
      return;
    }

    // Prevent creating duplicate users
    const existing = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existing) {
      sendError(res, 'User with that email or studentId already exists', 409);
      return;
    }

    const user = new User({ name, studentId, email, password, role, department });
    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;

    sendSuccess(res, 'User registered', { user: userObj }, 201);
  } catch (error) {
    // Log error internally
    // eslint-disable-next-line no-console
    console.error('Registration error:', error);
    sendError(res, 'Registration failed');
  }
};

// POST /api/auth/login
// Students (and other roles) use this to obtain a JWT and refresh token
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      sendError(res, 'Email and password required', 400);
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const isMatch = await (user as IUser).comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const payload = { id: user._id.toString(), role: user.role };
    const token = signAccessToken(payload);

    // Generate refresh token and persist to user
    const { token: refreshTok, expires } = generateRefreshToken();
    user.refreshToken = refreshTok;
    user.refreshTokenExpiry = expires;
    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;

    sendSuccess(res, 'Login successful', { token, refreshToken: refreshTok, user: userObj });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login error:', error);
    sendError(res, 'Login failed');
  }
};

// POST /api/auth/refresh
// Exchange a refresh token for a new access token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendError(res, 'Refresh token required', 400);
      return;
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });
    if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    const payload = { id: user._id.toString(), role: user.role };
    const token = signAccessToken(payload);

    sendSuccess(res, 'Token refreshed', { token });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Refresh token error:', error);
    sendError(res, 'Could not refresh token');
  }
};

// POST /api/auth/logout
// Revoke refresh token
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    await user.save();

    sendSuccess(res, 'Logged out');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Logout error:', error);
    sendError(res, 'Logout failed');
  }
};

// GET /api/auth/profile
// Returns the current logged-in user's profile
export const profile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const user = await User.findById(userId).select('-password -refreshToken -refreshTokenExpiry');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, 'Profile fetched', { user });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Profile error:', error);
    sendError(res, 'Could not fetch profile');
  }
};
