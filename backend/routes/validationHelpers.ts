import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Middleware to handle express-validator results
export const validationResultHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: errors.array() });
  }
  next();
};
