import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notice, { NoticeStatus } from '../models/Notice';
import { sendSuccess, sendError, isValidId } from '../utils/response';

// POST /api/notices
// Staff/admin create a new notice
export const createNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      title,
      description,
      category,
      targetAudience,
      department,
      dormBlock,
      priority,
      attachments,
      expiryDate
    } = req.body as {
      title?: string;
      description?: string;
      category?: string;
      targetAudience?: string;
      department?: string;
      dormBlock?: string;
      priority?: string;
      attachments?: string[];
      expiryDate?: string;
    };

    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    if (!title || !description || !category || !targetAudience) {
      sendError(res, 'title, description, category, and targetAudience are required', 400);
      return;
    }

    const notice = await Notice.create({
      title: title.trim(),
      description: description.trim(),
      category,
      targetAudience,
      department,
      dormBlock,
      priority,
      attachments: attachments || [],
      createdBy: new mongoose.Types.ObjectId(userId),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });

    sendSuccess(res, 'Notice created', { notice }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create notice error:', error);
    sendError(res, 'Could not create notice');
  }
};

// PATCH /api/notices/:id
// Staff/admin update notice details
export const updateNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    if (!isValidId(id)) {
      sendError(res, 'Invalid notice ID', 400);
      return;
    }
    const notice = await Notice.findById(id);
    if (!notice) {
      sendError(res, 'Notice not found', 404);
      return;
    }

    if (updates.title && typeof updates.title === 'string') {
      notice.title = updates.title.trim();
    }
    if (updates.description && typeof updates.description === 'string') {
      notice.description = updates.description.trim();
    }
    if (updates.category) {
      notice.category = updates.category as any;
    }
    if (updates.targetAudience) {
      notice.targetAudience = updates.targetAudience as any;
    }
    if (typeof updates.department === 'string' || updates.department === null) {
      notice.department = (updates.department as string) || undefined;
    }
    if (typeof updates.dormBlock === 'string' || updates.dormBlock === null) {
      notice.dormBlock = (updates.dormBlock as string) || undefined;
    }
    if (updates.priority) {
      notice.priority = updates.priority as any;
    }
    if (Array.isArray(updates.attachments)) {
      notice.attachments = updates.attachments as string[];
    }
    if (updates.expiryDate) {
      notice.expiryDate = new Date(updates.expiryDate as string);
    }

    await notice.save();
    sendSuccess(res, 'Notice updated', { notice });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update notice error:', error);
    sendError(res, 'Could not update notice');
  }
};

// DELETE /api/notices/:id
// Staff/admin delete a notice
export const deleteNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      sendError(res, 'Invalid notice ID', 400);
      return;
    }
    const notice = await Notice.findById(id);
    if (!notice) {
      sendError(res, 'Notice not found', 404);
      return;
    }

    await notice.deleteOne();
    sendSuccess(res, 'Notice deleted');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete notice error:', error);
    sendError(res, 'Could not delete notice');
  }
};

// PATCH /api/notices/:id/status
// Staff/admin activate or expire notice
export const setNoticeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: NoticeStatus };

    if (!status) {
      sendError(res, 'status is required', 400);
      return;
    }

    if (!isValidId(id)) {
      sendError(res, 'Invalid notice ID', 400);
      return;
    }
    const notice = await Notice.findById(id);
    if (!notice) {
      sendError(res, 'Notice not found', 404);
      return;
    }

    notice.status = status;
    await notice.save();
    sendSuccess(res, 'Notice status updated', { notice });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Set notice status error:', error);
    sendError(res, 'Could not update notice status');
  }
};

// GET /api/notices
// Students view active notices
export const getAllNotices = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const notices = await Notice.find({
      status: 'active',
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
      targetAudience: 'all_students'
    }).sort({ createdAt: -1 });
    sendSuccess(res, 'Notices fetched', { notices });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get notices error:', error);
    sendError(res, 'Could not fetch notices');
  }
};

// GET /api/notices/:id
// Students view a single active notice
export const getNoticeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const now = new Date();
    const notice = await Notice.findOne({
      _id: id,
      status: 'active',
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }]
    });
    if (!notice) {
      sendError(res, 'Notice not found', 404);
      return;
    }

    sendSuccess(res, 'Notice fetched', { notice });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get notice by id error:', error);
    sendError(res, 'Could not fetch notice');
  }
};

// GET /api/notices/department/:department
// Students view department notices
export const getDepartmentNotices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.params;
    const now = new Date();
    const notices = await Notice.find({
      status: 'active',
      $and: [
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gt: now } }
          ]
        },
        {
          $or: [
            { targetAudience: 'all_students' },
            { targetAudience: 'department_students', department }
          ]
        }
      ]
    }).sort({ createdAt: -1 });
    sendSuccess(res, 'Department notices fetched', { notices });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get department notices error:', error);
    sendError(res, 'Could not fetch department notices');
  }
};

// GET /api/notices/dorm/:block
// Students view dorm block notices
export const getDormNotices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { block } = req.params;
    const now = new Date();
    const notices = await Notice.find({
      status: 'active',
      $and: [
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gt: now } }
          ]
        },
        {
          $or: [
            { targetAudience: 'all_students' },
            { targetAudience: 'dorm_students', dormBlock: block }
          ]
        }
      ]
    }).sort({ createdAt: -1 });
    sendSuccess(res, 'Dorm notices fetched', { notices });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get dorm notices error:', error);
    sendError(res, 'Could not fetch dorm notices');
  }
};
