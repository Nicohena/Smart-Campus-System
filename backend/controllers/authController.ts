import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { sendSuccess, sendError } from '../utils/response';
import { config } from '../config';
import { signAccessToken, generateRefreshToken } from '../utils/tokenService';
import { STAFF_ROLES, UserRole } from '../utils/roles';

// POST /api/auth/register
// Creates a new user. Only staff/admin should be allowed to call this route
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, studentId, password, department } = req.body;
    const requesterRole = req.user?.role;
    const requestedRole = req.body.role as UserRole | undefined;

    if (!requesterRole) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    if (!name || !studentId || !password) {
      sendError(res, 'Missing required fields', 400);
      return;
    }

    let role: UserRole;
    if (requesterRole === 'department') {
      role = 'student';
    } else if (requesterRole === 'admin') {
      role = requestedRole ?? 'department';
      if (!STAFF_ROLES.includes(role)) {
        sendError(res, 'Admins can only create staff users', 403);
        return;
      }
    } else {
      sendError(res, 'Forbidden', 403);
      return;
    }

    // Prevent creating duplicate users
    const existing = await User.findOne({ studentId });
    if (existing) {
      sendError(res, 'User with that studentId already exists', 409);
      return;
    }

    const user = new User({ name, studentId, password, role, department });
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
    const { studentId, password } = req.body;
    if (!studentId || !password) {
      sendError(res, 'Student ID and password required', 400);
      return;
    }

    const user = await User.findOne({ studentId });
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

    // Generate refresh token and persist to RefreshToken collection
    const { token: refreshTok, expires } = generateRefreshToken();
    await RefreshToken.create({ user: user._id, token: refreshTok, expires });

    // Set refresh token as secure httpOnly cookie
    const cookieOptions = {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax' as const,
      expires
    };
    res.cookie('refreshToken', refreshTok, cookieOptions);

    const userObj = user.toObject();
    delete (userObj as any).password;

    sendSuccess(res, 'Login successful', { token, user: userObj });
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
    // Accept refresh token from body or cookie
    const incoming = (req.body && req.body.refreshToken) || req.cookies?.refreshToken;
    if (!incoming) {
      sendError(res, 'Refresh token required', 400);
      return;
    }

    // Find refresh token doc and populate user
    const tokenDoc = await RefreshToken.findOne({ token: incoming }).populate('user');
    if (
      !tokenDoc ||
      tokenDoc.revoked ||
      !tokenDoc.expires ||
      (tokenDoc.expires && tokenDoc.expires < new Date())
    ) {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    const user = (tokenDoc.user as any);
    const payload = { id: user._id.toString(), role: user.role };
    const token = signAccessToken(payload);

    // Rotate refresh token: revoke old and issue a new one
    const { token: newRefreshTok, expires } = generateRefreshToken();
    const newTokenDoc = await RefreshToken.create({ user: user._id, token: newRefreshTok, expires });

    tokenDoc.revoked = true;
    tokenDoc.replacedByToken = newTokenDoc._id;
    await tokenDoc.save();

    const cookieOptions = {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax' as const,
      expires
    };
    res.cookie('refreshToken', newRefreshTok, cookieOptions);

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
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    // Revoke a specific refresh token passed in body or cookie, else revoke all for the user
    const incoming = (req.body && req.body.refreshToken) || req.cookies?.refreshToken;
    if (incoming) {
      const tokenDoc = await RefreshToken.findOne({ token: incoming, user: userId });
      if (tokenDoc) {
        tokenDoc.revoked = true;
        await tokenDoc.save();
      }
    } else {
      await RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { 
      httpOnly: true, 
      secure: config.isProduction, 
      sameSite: 'lax' 
    });

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
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const user = await User.findById(userId).select('-password');
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

// GET /api/auth/users
// Staff/admin can fetch users for assignment and admin tasks
export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const role = _req.user?.role;
    const filter = role === 'department' ? { role: 'student' } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    sendSuccess(res, 'Users fetched', { users });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('List users error:', error);
    sendError(res, 'Could not fetch users');
  }
};
