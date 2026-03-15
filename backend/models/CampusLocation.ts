import mongoose, { Schema } from 'mongoose';

export type CampusLocationCategory = 'dorm' | 'office' | 'academic' | 'service' | 'recreation';

export interface ICampusLocation {
  name: string;
  description: string;
  category: CampusLocationCategory;
  building: string;
  floor?: number;
  roomNumber?: string;
  latitude: number;
  longitude: number;
  contactPerson?: string;
  contactPhone?: string;
  openHours?: string;
}

const CampusLocationSchema: Schema<ICampusLocation> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['dorm', 'office', 'academic', 'service', 'recreation'],
      required: true
    },
    building: { type: String, required: true },
    floor: { type: Number },
    roomNumber: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    contactPerson: { type: String },
    contactPhone: { type: String },
    openHours: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<ICampusLocation>('CampusLocation', CampusLocationSchema);
