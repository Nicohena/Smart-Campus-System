import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Issue, { IssueStatus, IssueType } from '../models/Issue';
import Dorm from '../models/Dorm';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

// POST /api/issues/report
// Student reports a dorm or campus issue
export const reportIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { issueType, description, block, roomNumber } = req.body as {
      issueType?: IssueType;
      description?: string;
      block?: string;
      roomNumber?: number;
    };

    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    if (!issueType || !description || !description.trim()) {
      sendError(res, 'issueType and description are required', 400);
      return;
    }

    const student = await User.findById(userId).select('studentId');
    if (!student) {
      sendError(res, 'Student not found', 404);
      return;
    }

    // Attach dorm info if the student is allocated
    const dorm = await Dorm.findOne({ students: student._id }).select('block roomNumber');

    const issue = await Issue.create({
      student: student._id,
      studentId: student.studentId,
      dorm: dorm?._id,
      block: dorm?.block || block,
      roomNumber: dorm?.roomNumber ?? roomNumber,
      issueType,
      description: description.trim(),
      status: 'reported'
    });

    sendSuccess(res, 'Issue reported', { issue }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Report issue error:', error);
    sendError(res, 'Could not report issue');
  }
};

// GET /api/issues/my-issues
// Student views their reported issues
export const getMyIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const issues = await Issue.find({ student: userId }).sort({ reportedAt: -1 });
    sendSuccess(res, 'Issues fetched', { issues });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get my issues error:', error);
    sendError(res, 'Could not fetch issues');
  }
};

// GET /api/issues
// Staff/admin views all issues
export const getAllIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const issues = await Issue.find()
      .populate('student', 'name studentId email')
      .populate('assignedTechnician', 'name email')
      .populate('dorm', 'block roomNumber')
      .sort({ reportedAt: -1 });

    sendSuccess(res, 'Issues fetched', { issues });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get all issues error:', error);
    sendError(res, 'Could not fetch issues');
  }
};

// PATCH /api/issues/:id/assign
// Staff/admin assigns a technician
export const assignTechnician = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedTechnician } = req.body as { assignedTechnician?: string };

    if (!assignedTechnician) {
      sendError(res, 'assignedTechnician is required', 400);
      return;
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      sendError(res, 'Issue not found', 404);
      return;
    }
    if (issue.status !== 'reported') {
      sendError(res, 'Only reported issues can be assigned', 400);
      return;
    }

    const technician = await User.findById(assignedTechnician).select('role');
    if (!technician) {
      sendError(res, 'Technician not found', 404);
      return;
    }

    issue.assignedTechnician = new mongoose.Types.ObjectId(assignedTechnician);
    issue.status = 'assigned';
    await issue.save();

    sendSuccess(res, 'Technician assigned', { issue });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Assign technician error:', error);
    sendError(res, 'Could not assign technician');
  }
};

// PATCH /api/issues/:id/status
// Staff/admin updates issue status
export const updateIssueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body as { status?: IssueStatus; remarks?: string };

    if (!status) {
      sendError(res, 'status is required', 400);
      return;
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      sendError(res, 'Issue not found', 404);
      return;
    }

    issue.status = status;
    if (remarks) {
      issue.remarks = remarks.trim();
    }
    if (status === 'resolved') {
      issue.resolvedAt = new Date();
    }
    await issue.save();

    sendSuccess(res, 'Issue status updated', { issue });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update issue status error:', error);
    sendError(res, 'Could not update issue status');
  }
};

// GET /api/issues/dorm/:dormId
// Staff/admin views issues by dorm or block
export const getDormIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dormId } = req.params;
    const { block } = req.query as { block?: string };

    const filter: Record<string, any> = {};
    if (dormId) {
      filter.dorm = dormId;
    }
    if (block) {
      filter.block = block;
    }

    const issues = await Issue.find(filter)
      .populate('student', 'name studentId')
      .populate('assignedTechnician', 'name email')
      .sort({ reportedAt: -1 });

    sendSuccess(res, 'Dorm issues fetched', { issues });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get dorm issues error:', error);
    sendError(res, 'Could not fetch dorm issues');
  }
};
