import { Request, Response } from 'express';
import Clearance, { IClearance } from '../models/Clearance';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

const areAllApprovalsComplete = (clearance: IClearance): boolean => {
  return (
    clearance.libraryApproval.status &&
    clearance.cafeteriaApproval.status &&
    clearance.proctorApproval.status &&
    clearance.securityApproval.status
  );
};

// POST /api/clearance/request
// Student submits a clearance request
export const requestClearance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { academicYear } = req.body as { academicYear?: string };
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    if (!academicYear || !academicYear.trim()) {
      sendError(res, 'Academic year is required', 400);
      return;
    }

    // Prevent multiple clearance requests for the same academic year
    const existing = await Clearance.findOne({ student: userId, academicYear: academicYear.trim() });
    if (existing) {
      sendError(res, 'Clearance request already exists for this academic year', 409);
      return;
    }

    const user = await User.findById(userId).select('studentId');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const clearance = await Clearance.create({
      student: userId,
      studentId: user.studentId,
      academicYear: academicYear.trim()
    });

    sendSuccess(res, 'Clearance request submitted', { clearance }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Clearance request error:', error);
    sendError(res, 'Could not submit clearance request');
  }
};

// GET /api/clearance/my-clearance
// Student views their clearance progress
export const getMyClearance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const records = await Clearance.find({ student: userId }).sort({ createdAt: -1 });
    sendSuccess(res, 'Clearance records fetched', { records });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get my clearance error:', error);
    sendError(res, 'Could not fetch clearance records');
  }
};

// GET /api/clearance
// Staff/admin views all clearance records
export const getAllClearanceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await Clearance.find()
      .populate('student', 'name studentId email role')
      .sort({ createdAt: -1 });
    sendSuccess(res, 'Clearance records fetched', { records });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get all clearance error:', error);
    sendError(res, 'Could not fetch clearance records');
  }
};

const markApproval = async (
  req: Request,
  res: Response,
  section:
    | 'libraryApproval'
    | 'cafeteriaApproval'
    | 'proctorApproval'
    | 'securityApproval'
): Promise<void> => {
  const { id } = req.params;
  const approverId = req.user?.id;
  if (!approverId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  const clearance = await Clearance.findById(id);
  if (!clearance) {
    sendError(res, 'Clearance record not found', 404);
    return;
  }

  if (clearance.status === 'approved' || clearance.status === 'rejected') {
    sendError(res, 'Clearance record is closed', 400);
    return;
  }

  if (clearance[section].status) {
    sendError(res, 'This approval is already completed', 400);
    return;
  }

  clearance[section] = {
    status: true,
    approvedBy: approverId,
    date: new Date()
  };

  if (clearance.status === 'pending') {
    clearance.status = 'in_progress';
  }

  if (areAllApprovalsComplete(clearance)) {
    clearance.status = 'approved';
  }

  await clearance.save();
  sendSuccess(res, 'Approval recorded', { clearance });
};

// PATCH /api/clearance/:id/library
export const approveLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    await markApproval(req, res, 'libraryApproval');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Approve library error:', error);
    sendError(res, 'Could not approve library clearance');
  }
};

// PATCH /api/clearance/:id/cafeteria
export const approveCafeteria = async (req: Request, res: Response): Promise<void> => {
  try {
    await markApproval(req, res, 'cafeteriaApproval');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Approve cafeteria error:', error);
    sendError(res, 'Could not approve cafeteria clearance');
  }
};

// PATCH /api/clearance/:id/proctor
export const approveProctor = async (req: Request, res: Response): Promise<void> => {
  try {
    await markApproval(req, res, 'proctorApproval');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Approve proctor error:', error);
    sendError(res, 'Could not approve proctor clearance');
  }
};

// PATCH /api/clearance/:id/security
export const approveSecurity = async (req: Request, res: Response): Promise<void> => {
  try {
    await markApproval(req, res, 'securityApproval');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Approve security error:', error);
    sendError(res, 'Could not approve security clearance');
  }
};
