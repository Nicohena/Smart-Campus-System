import { Request, Response } from 'express';

// Controller for GET /api/test
export const getTest = (req: Request, res: Response): void => {
  res.json({ message: 'Server is running' });
};
