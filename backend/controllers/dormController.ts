import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Dorm, { IDorm } from '../models/Dorm';
import DormKey from '../models/DormKey';
import DormInspection from '../models/DormInspection';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

type YearLevel = 'freshman' | 'remedial' | 'senior';

const findAvailableDorm = async (query: Record<string, any>): Promise<IDorm | null> => {
  const dorms = await Dorm.find({ status: { $ne: 'maintenance' }, ...query }).sort({
    block: 1,
    roomNumber: 1
  });

  // Pick the first dorm with available capacity (alphabetical by block/roomNumber)
  for (const dorm of dorms) {
    if (dorm.students.length < dorm.capacity) {
      return dorm;
    }
  }

  return null;
};

// POST /api/dorm/allocate
// Allocate a dorm to a student based on year level and special needs
export const allocateDormToStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, yearLevel, isSpecialNeeds = false, department } = req.body as {
      studentId?: string;
      yearLevel?: YearLevel;
      isSpecialNeeds?: boolean;
      department?: string;
    };

    if (!studentId || !yearLevel) {
      sendError(res, 'studentId and yearLevel are required', 400);
      return;
    }

    if (!['freshman', 'remedial', 'senior'].includes(yearLevel)) {
      sendError(res, 'Invalid yearLevel', 400);
      return;
    }

    const student = await User.findOne({ studentId }).select('_id name studentId department');
    if (!student) {
      sendError(res, 'Student not found', 404);
      return;
    }

    // If already assigned, return current dorm (special needs dorm is permanent)
    const existingDorm = await Dorm.findOne({ students: student._id });
    if (existingDorm) {
      sendSuccess(res, 'Student already assigned to a dorm', { dorm: existingDorm });
      return;
    }

    let dorm: IDorm | null = null;

    if (isSpecialNeeds) {
      dorm = await findAvailableDorm({ isSpecialNeedsDorm: true });
      if (!dorm) {
        sendError(res, 'No special needs dorm available', 404);
        return;
      }
    } else if (yearLevel === 'senior') {
      const dept = department || student.department;
      if (!dept) {
        sendError(res, 'Department is required for senior allocation', 400);
        return;
      }
      dorm = await findAvailableDorm({ department: dept, isSpecialNeedsDorm: false });
      if (!dorm) {
        sendError(res, 'No department dorm available for senior', 404);
        return;
      }
    } else {
      // Freshman/remedial: allocate by dorm alphabetical order (block/roomNumber)
      dorm = await findAvailableDorm({ isSpecialNeedsDorm: false });
      if (!dorm) {
        sendError(res, 'No dorm available for allocation', 404);
        return;
      }
    }

    dorm.students.push(student._id);
    if (dorm.students.length >= dorm.capacity) {
      dorm.status = 'occupied';
    } else if (dorm.status !== 'maintenance') {
      dorm.status = 'available';
    }
    await dorm.save();

    sendSuccess(res, 'Dorm allocated to student', { dorm }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Dorm allocation error:', error);
    sendError(res, 'Could not allocate dorm');
  }
};

// GET /api/dorm/my-dorm
// Student fetches assigned dorm
export const getStudentDorm = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const dorm = await Dorm.findOne({ students: userId }).populate('students', 'name studentId');
    if (!dorm) {
      sendError(res, 'Dorm assignment not found', 404);
      return;
    }

    sendSuccess(res, 'Dorm fetched', { dorm });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get student dorm error:', error);
    sendError(res, 'Could not fetch dorm');
  }
};

// POST /api/dorm/issue-key
// Staff/admin issues a dorm key to a student
export const issueDormKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dormId, issuedTo, keyNumber } = req.body as {
      dormId?: string;
      issuedTo?: string;
      keyNumber?: string;
    };

    if (!dormId || !issuedTo || !keyNumber) {
      sendError(res, 'dormId, issuedTo, and keyNumber are required', 400);
      return;
    }

    const dorm = await Dorm.findById(dormId);
    if (!dorm) {
      sendError(res, 'Dorm not found', 404);
      return;
    }
    if (dorm.status === 'maintenance') {
      sendError(res, 'Cannot issue key for dorm under maintenance', 400);
      return;
    }

    const student = await User.findById(issuedTo);
    if (!student) {
      sendError(res, 'Student not found', 404);
      return;
    }
    if (!dorm.students.some((studentRef) => studentRef.toString() === issuedTo)) {
      sendError(res, 'Student is not assigned to this dorm', 400);
      return;
    }

    const existingKey = await DormKey.findOne({ dorm: dormId, issuedTo, returned: false });
    if (existingKey) {
      sendError(res, 'Active key already issued for this dorm', 409);
      return;
    }

    const key = await DormKey.create({
      dorm: dormId,
      issuedTo,
      keyNumber
    });

    sendSuccess(res, 'Dorm key issued', { key }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Issue dorm key error:', error);
    sendError(res, 'Could not issue dorm key');
  }
};

// PATCH /api/dorm/return-key
// Staff/admin marks a dorm key as returned
export const returnDormKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyId } = req.body as { keyId?: string };
    if (!keyId) {
      sendError(res, 'keyId is required', 400);
      return;
    }

    const key = await DormKey.findById(keyId);
    if (!key) {
      sendError(res, 'Dorm key not found', 404);
      return;
    }

    if (key.returned) {
      sendError(res, 'Dorm key already returned', 400);
      return;
    }

    key.returned = true;
    await key.save();

    sendSuccess(res, 'Dorm key returned', { key });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Return dorm key error:', error);
    sendError(res, 'Could not return dorm key');
  }
};

// POST /api/dorm/inspect
// Staff/admin inspects dorm condition for clearance
export const inspectDorm = async (req: Request, res: Response): Promise<void> => {
  try {
    const inspectedBy = req.user?.id;
    const { dormId, conditions, cleanliness, damages, approved } = req.body as {
      dormId?: string;
      conditions?: {
        windows?: boolean;
        bed?: boolean;
        locker?: boolean;
        table?: boolean;
        chair?: boolean;
        lightBulb?: boolean;
        doorLock?: boolean;
      };
      cleanliness?: boolean;
      damages?: string;
      approved?: boolean;
    };

    if (!inspectedBy) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    if (!dormId || !conditions || typeof cleanliness !== 'boolean' || typeof approved !== 'boolean') {
      sendError(res, 'dormId, conditions, cleanliness, and approved are required', 400);
      return;
    }

    const dorm = await Dorm.findById(dormId);
    if (!dorm) {
      sendError(res, 'Dorm not found', 404);
      return;
    }

    const inspection = await DormInspection.create({
      dorm: dormId,
      inspectedBy: new mongoose.Types.ObjectId(inspectedBy),
      conditions,
      cleanliness,
      damages,
      approved
    });

    sendSuccess(res, 'Dorm inspection recorded', { inspection }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Dorm inspection error:', error);
    sendError(res, 'Could not record dorm inspection');
  }
};

// GET /api/dorm/inspections
// Staff/admin view inspection history (optionally by dormId or studentId)
export const getDormInspectionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dormId, studentId } = req.query as { dormId?: string; studentId?: string };

    let resolvedDormId = dormId;
    if (!resolvedDormId && studentId) {
      const student = await User.findOne({ studentId }).select('_id');
      if (!student) {
        sendError(res, 'Student not found', 404);
        return;
      }
      const dorm = await Dorm.findOne({ students: student._id }).select('_id');
      if (!dorm) {
        sendError(res, 'Dorm not found for student', 404);
        return;
      }
      resolvedDormId = dorm._id.toString();
    }

    const filter = resolvedDormId ? { dorm: resolvedDormId } : {};
    const inspections = await DormInspection.find(filter)
      .populate('dorm', 'block roomNumber')
      .populate('inspectedBy', 'name email')
      .sort({ inspectionDate: -1 });

    sendSuccess(res, 'Dorm inspections fetched', { inspections });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get dorm inspections error:', error);
    sendError(res, 'Could not fetch dorm inspections');
  }
};
