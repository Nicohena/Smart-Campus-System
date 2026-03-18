import { Response } from 'express';
import { isValidObjectId } from 'mongoose';

// Standardized response helper
export const sendSuccess = (res: Response, message: string, data?: any, status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

export const sendError = (res: Response, message = 'Internal Server Error', status = 500) => {
  return res.status(status).json({ success: false, message });
};

/**
 * Returns true when `id` is a valid MongoDB ObjectId string.
 * Use this before any `Model.findById(id)` call coming from request params
 * to avoid Mongoose CastErrors that would otherwise surface as 500s.
 */
export const isValidId = (id: string): boolean => isValidObjectId(id);

