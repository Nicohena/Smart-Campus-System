import { Response } from 'express';

// Standardized response helper
export const sendSuccess = (res: Response, message: string, data?: any, status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

export const sendError = (res: Response, message = 'Internal Server Error', status = 500) => {
  return res.status(status).json({ success: false, message });
};
