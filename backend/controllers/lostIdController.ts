import { Request, Response } from 'express';
import LostID, { ILostID, LostIdStamps } from '../models/LostID';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

const ALLOWED_STAMPS: Array<keyof LostIdStamps> = [
  'security',
  'cafeteria',
  'library',
  'department',
  'proctor'
];

const areAllStampsComplete = (stamps: LostIdStamps): boolean => {
  return ALLOWED_STAMPS.every((key) => stamps[key] === true);
};

// POST /api/lost-id/request
// Students submit a new lost ID request
export const submitLostIdRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    // Prevent multiple pending requests for the same student
    const existingPending = await LostID.findOne({ student: userId, status: 'pending' });
    if (existingPending) {
      sendError(res, 'You already have a pending lost ID request', 409);
      return;
    }

    const user = await User.findById(userId).select('studentId');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const request = await LostID.create({
      student: userId,
      studentId: user.studentId
    });

    sendSuccess(res, 'Lost ID request submitted', { request }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lost ID submit error:', error);
    sendError(res, 'Could not submit lost ID request');
  }
};

// GET /api/lost-id/my-requests
// Students view their own lost ID requests
export const getMyLostIdRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const requests = await LostID.find({ student: userId }).sort({ createdAt: -1 });
    sendSuccess(res, 'Lost ID requests fetched', { requests });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get my lost ID requests error:', error);
    sendError(res, 'Could not fetch lost ID requests');
  }
};

// GET /api/lost-id
// Staff/admin fetch all requests
export const getAllLostIdRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await LostID.find()
      .populate('student', 'name studentId email role')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'All lost ID requests fetched', { requests });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get all lost ID requests error:', error);
    sendError(res, 'Could not fetch lost ID requests');
  }
};

// PATCH /api/lost-id/:id/stamp
// Staff/admin update stamp status
export const updateStampStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stamp, value, stamps } = req.body as {
      stamp?: string;
      value?: boolean;
      stamps?: Partial<LostIdStamps>;
    };

    const updates: Partial<LostIdStamps> = {};

    if (stamp) {
      if (!ALLOWED_STAMPS.includes(stamp as keyof LostIdStamps)) {
        sendError(res, 'Invalid stamp type', 400);
        return;
      }
      updates[stamp as keyof LostIdStamps] = value ?? true;
    } else if (stamps && typeof stamps === 'object') {
      for (const key of Object.keys(stamps)) {
        if (ALLOWED_STAMPS.includes(key as keyof LostIdStamps)) {
          const incoming = stamps[key as keyof LostIdStamps];
          if (typeof incoming === 'boolean') {
            updates[key as keyof LostIdStamps] = incoming;
          }
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No valid stamp updates provided', 400);
      return;
    }

    const request = await LostID.findById(id);
    if (!request) {
      sendError(res, 'Lost ID request not found', 404);
      return;
    }

    request.stamps = { ...request.stamps, ...updates } as LostIdStamps;
    await request.save();

    sendSuccess(res, 'Stamp status updated', { request });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update stamp status error:', error);
    sendError(res, 'Could not update stamp status');
  }
};

// PATCH /api/lost-id/:id/approve
// Staff/admin approve request after all stamps are completed
export const approveLostIdRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const request = await LostID.findById(id);
    if (!request) {
      sendError(res, 'Lost ID request not found', 404);
      return;
    }

    if (!areAllStampsComplete(request.stamps)) {
      sendError(res, 'All stamps must be completed before approval', 400);
      return;
    }

    request.status = 'approved';
    await request.save();

    sendSuccess(res, 'Lost ID request approved', { request });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Approve lost ID request error:', error);
    sendError(res, 'Could not approve lost ID request');
  }
};

// PATCH /api/lost-id/:id/reject
// Staff/admin reject request with remarks
export const rejectLostIdRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks } = req.body as { remarks?: string };
    if (!remarks || !remarks.trim()) {
      sendError(res, 'Remarks are required to reject a request', 400);
      return;
    }

    const request = await LostID.findById(id);
    if (!request) {
      sendError(res, 'Lost ID request not found', 404);
      return;
    }

    request.status = 'rejected';
    request.remarks = remarks.trim();
    await request.save();

    sendSuccess(res, 'Lost ID request rejected', { request });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Reject lost ID request error:', error);
    sendError(res, 'Could not reject lost ID request');
  }
};

// PATCH /api/lost-id/:id/temporary-id
// Staff/admin issue temporary ID
export const issueTemporaryId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const request = await LostID.findById(id);
    if (!request) {
      sendError(res, 'Lost ID request not found', 404);
      return;
    }

    request.temporaryIdIssued = true;
    await request.save();

    sendSuccess(res, 'Temporary ID issued', { request });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Issue temporary ID error:', error);
    sendError(res, 'Could not issue temporary ID');
  }
};
