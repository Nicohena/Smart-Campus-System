import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Complaint, { ComplaintPriority, ComplaintStatus } from '../models/Complaint';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

// POST /api/complaints
// Student submits a complaint to the Student Union Office
export const submitComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { category, title, description } = req.body as {
      category?: string;
      title?: string;
      description?: string;
    };

    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    if (!category || !title || !description) {
      sendError(res, 'category, title, and description are required', 400);
      return;
    }

    const student = await User.findById(userId).select('studentId');
    if (!student) {
      sendError(res, 'Student not found', 404);
      return;
    }

    const complaint = await Complaint.create({
      student: student._id,
      studentId: student.studentId,
      category,
      title: title.trim(),
      description: description.trim(),
      status: 'submitted'
    });

    sendSuccess(res, 'Complaint submitted', { complaint }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Submit complaint error:', error);
    sendError(res, 'Could not submit complaint');
  }
};

// GET /api/complaints/my
// Student views own complaints
export const getMyComplaints = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const complaints = await Complaint.find({ student: userId }).sort({ submittedAt: -1 });
    sendSuccess(res, 'Complaints fetched', { complaints });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get my complaints error:', error);
    sendError(res, 'Could not fetch complaints');
  }
};

// GET /api/complaints
// Staff/admin views all complaints
export const getAllComplaints = async (req: Request, res: Response): Promise<void> => {
  try {
    const complaints = await Complaint.find()
      .populate('student', 'name studentId email')
      .populate('handledBy', 'name email')
      .sort({ submittedAt: -1 });

    sendSuccess(res, 'Complaints fetched', { complaints });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get all complaints error:', error);
    sendError(res, 'Could not fetch complaints');
  }
};

// PATCH /api/complaints/:id/status
// Staff/admin updates complaint status
export const updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body as { status?: ComplaintStatus; remarks?: string };

    if (!status) {
      sendError(res, 'status is required', 400);
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      sendError(res, 'Complaint not found', 404);
      return;
    }

    complaint.status = status;
    if (remarks) {
      complaint.remarks = remarks.trim();
    }
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }
    await complaint.save();

    sendSuccess(res, 'Complaint status updated', { complaint });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update complaint status error:', error);
    sendError(res, 'Could not update complaint status');
  }
};

// PATCH /api/complaints/:id/assign
// Staff/admin assigns a handler to a complaint
export const assignComplaintHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { handledBy } = req.body as { handledBy?: string };

    if (!handledBy) {
      sendError(res, 'handledBy is required', 400);
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      sendError(res, 'Complaint not found', 404);
      return;
    }

    complaint.handledBy = new mongoose.Types.ObjectId(handledBy);
    await complaint.save();

    sendSuccess(res, 'Complaint handler assigned', { complaint });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Assign complaint handler error:', error);
    sendError(res, 'Could not assign complaint handler');
  }
};

// PATCH /api/complaints/:id/priority
// Staff/admin sets complaint priority
export const setComplaintPriority = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { priority } = req.body as { priority?: ComplaintPriority };

    if (!priority) {
      sendError(res, 'priority is required', 400);
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      sendError(res, 'Complaint not found', 404);
      return;
    }

    complaint.priority = priority;
    await complaint.save();

    sendSuccess(res, 'Complaint priority updated', { complaint });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Set complaint priority error:', error);
    sendError(res, 'Could not set complaint priority');
  }
};
