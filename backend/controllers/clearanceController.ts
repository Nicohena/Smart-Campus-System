import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Clearance, { IClearance } from '../models/Clearance';
import Dorm from '../models/Dorm';
import DormInspection from '../models/DormInspection';
import User from '../models/User';
import { sendSuccess, sendError, isValidId } from '../utils/response';

const areAllApprovalsComplete = (clearance: IClearance): boolean => {
  return (
    clearance.departmentApproval.status &&
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
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Clearance.find()
        .populate('student', 'name studentId email role department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Clearance.countDocuments()
    ]);

    sendSuccess(res, 'Clearance records fetched', { records, total, page, limit });
  } catch (error) {
    console.error('Get all clearance error:', error);
    sendError(res, 'Could not fetch clearance records');
  }
};

// GET /api/clearance/department
export const getDepartmentClearanceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const departmentName = req.user?.department;
    if (!departmentName) {
      sendError(res, 'Department not associated with user', 400);
      return;
    }

    // Find students belonging to this department
    const studentsInDept = await User.find({ department: departmentName, role: 'student' }).select('_id');
    const studentIds = studentsInDept.map(s => s._id);

    const records = await Clearance.find({ student: { $in: studentIds } })
      .populate('student', 'name studentId email role department')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Department clearance records fetched', { records });
  } catch (error) {
    console.error('Get department clearance error:', error);
    sendError(res, 'Could not fetch department clearance records');
  }
};

const markApproval = async (
  req: Request,
  res: Response,
  section:
    | 'departmentApproval'
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

  if (!isValidId(id)) {
    sendError(res, 'Invalid clearance ID', 400);
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

  // Enforce approval order: Library -> Cafeteria -> Proctor -> Security
  if (section === 'cafeteriaApproval' && (!clearance.libraryApproval.status || !clearance.departmentApproval.status)) {
    sendError(res, 'Library and Department approvals are required before cafeteria approval', 400);
    return;
  }
  if (
    section === 'proctorApproval' &&
    (!clearance.departmentApproval.status || !clearance.libraryApproval.status || !clearance.cafeteriaApproval.status)
  ) {
    sendError(res, 'Department, Library and Cafeteria approvals are required before proctor approval', 400);
    return;
  }
  if (section === 'proctorApproval') {
    // Dorm inspection must be approved before proctor approval
    const dorm = await Dorm.findOne({ students: clearance.student }).select('_id');
    if (!dorm) {
      sendError(res, 'Student dorm not found for inspection', 400);
      return;
    }

    const latestInspection = await DormInspection.findOne({ dorm: dorm._id }).sort({
      inspectionDate: -1
    });
    if (!latestInspection) {
      sendError(res, 'Dorm inspection is required before proctor approval', 400);
      return;
    }
    if (!latestInspection.approved) {
      sendError(res, 'Dorm inspection is not approved', 400);
      return;
    }
    if (latestInspection.damages && latestInspection.damages.trim().length > 0) {
      sendError(res, 'Dorm damages must be resolved before proctor approval', 400);
      return;
    }
  }
  if (
    section === 'securityApproval' &&
    (!clearance.libraryApproval.status ||
      !clearance.cafeteriaApproval.status ||
      !clearance.proctorApproval.status)
  ) {
    sendError(res, 'All prior approvals are required before security approval', 400);
    return;
  }

  clearance[section] = {
    status: true,
    approvedBy: new mongoose.Types.ObjectId(approverId),
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
    console.error('Approve security error:', error);
    sendError(res, 'Could not approve security clearance');
  }
};

// PATCH /api/clearance/:id/department
export const approveDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    await markApproval(req, res, 'departmentApproval');
  } catch (error) {
    console.error('Approve department error:', error);
    sendError(res, 'Could not approve department clearance');
  }
};
