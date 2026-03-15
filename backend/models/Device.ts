import mongoose, { Schema } from 'mongoose';

export type DeviceType = 'laptop' | 'tablet' | 'other';
export type DeviceStatus = 'registered' | 'active' | 'blocked';

export interface IDevice {
  student: mongoose.Types.ObjectId;
  studentId: string;
  phoneNumber: string;
  deviceType: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  ssid?: string;
  deviceRegistrationId: string;
  status: DeviceStatus;
  registeredBy: mongoose.Types.ObjectId;
  registeredAt: Date;
  remarks?: string;
}

const DeviceSchema: Schema<IDevice> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    deviceType: { type: String, enum: ['laptop', 'tablet', 'other'], required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    serialNumber: { type: String, required: true },
    macAddress: { type: String, required: true },
    ssid: { type: String },
    deviceRegistrationId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['registered', 'active', 'blocked'], default: 'registered' },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registeredAt: { type: Date, default: Date.now },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IDevice>('Device', DeviceSchema);
