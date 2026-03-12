import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET exists at runtime - fail early if not provided
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('JWT_SECRET is not defined in environment. Exiting.');
  process.exit(1);
}

// Type augmentation for request `user` (simple shape)
export interface JwtPayload {
  id: string;
  role: 'student' | 'staff' | 'admin';
  iat?: number;
  exp?: number;
}

// Middleware to verify JWT token and attach user payload to request
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Middleware factory for role-based authorization
export const requireRole = (allowedRoles: Array<'student' | 'staff' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    next();
  };
};
