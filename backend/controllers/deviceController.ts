import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Device from '../models/Device';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

const generateRegistrationId = (): string => {
  return `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

// POST /api/devices/register
// Security staff/admin register a student device
export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const staffId = req.user?.id;
    const {
      studentId,
      phoneNumber,
      deviceType,
      brand,
      model,
      serialNumber,
      macAddress,
      ssid
    } = req.body as {
      studentId?: string;
      phoneNumber?: string;
      deviceType?: string;
      brand?: string;
      model?: string;
      serialNumber?: string;
      macAddress?: string;
      ssid?: string;
    };

    if (!staffId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    if (
      !studentId ||
      !phoneNumber ||
      !deviceType ||
      !brand ||
      !model ||
      !serialNumber ||
      !macAddress
    ) {
      sendError(res, 'Missing required device fields', 400);
      return;
    }

    const student = await User.findOne({ studentId }).select('_id studentId');
    if (!student) {
      sendError(res, 'Student not found', 404);
      return;
    }

    let registrationId = generateRegistrationId();
    // Ensure unique registration ID
    while (await Device.findOne({ deviceRegistrationId: registrationId })) {
      registrationId = generateRegistrationId();
    }

    const device = await Device.create({
      student: student._id,
      studentId: student.studentId,
      phoneNumber: phoneNumber.trim(),
      deviceType,
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      macAddress: macAddress.trim(),
      ssid: ssid?.trim(),
      deviceRegistrationId: registrationId,
      status: 'registered',
      registeredBy: new mongoose.Types.ObjectId(staffId)
    });

    sendSuccess(res, 'Device registered', { device }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Register device error:', error);
    sendError(res, 'Could not register device');
  }
};

// GET /api/devices
// Security staff/admin view all devices
export const getAllDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await Device.find()
      .populate('student', 'name studentId email')
      .populate('registeredBy', 'name email')
      .sort({ registeredAt: -1 });

    sendSuccess(res, 'Devices fetched', { devices });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get all devices error:', error);
    sendError(res, 'Could not fetch devices');
  }
};

// PATCH /api/devices/:id/block
// Security staff/admin blocks a device
export const blockDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks } = req.body as { remarks?: string };

    const device = await Device.findById(id);
    if (!device) {
      sendError(res, 'Device not found', 404);
      return;
    }
    if (device.status === 'blocked') {
      sendError(res, 'Device is already blocked', 400);
      return;
    }

    device.status = 'blocked';
    if (remarks) {
      device.remarks = remarks.trim();
    }
    await device.save();

    sendSuccess(res, 'Device blocked', { device });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Block device error:', error);
    sendError(res, 'Could not block device');
  }
};

// GET /api/devices/my
// Student views their registered devices
export const getMyDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const devices = await Device.find({ student: userId }).sort({ registeredAt: -1 });
    sendSuccess(res, 'Devices fetched', { devices });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get my devices error:', error);
    sendError(res, 'Could not fetch devices');
  }
};

// GET /api/devices/:id
// Student views a specific device
export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const device = await Device.findOne({ _id: id, student: userId });
    if (!device) {
      sendError(res, 'Device not found', 404);
      return;
    }

    const warning = device.status === 'blocked' ? 'Warning: this device is blocked' : undefined;
    sendSuccess(res, 'Device fetched', { device, warning });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get device by id error:', error);
    sendError(res, 'Could not fetch device');
  }
};
