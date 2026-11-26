import mongoose, { Schema, Document } from 'mongoose';

export type DeviceType =
  | 'ENERGY_METER'
  | 'LIGHTING_CONTROLLER'
  | 'ENVIRONMENT_MONITOR'
  | 'WATER_CONTROLLER'
  | 'FIRE_SAFETY'
  | 'PARKING_DETECTOR'
  | 'ACCESS_CONTROL'
  | 'WASTE_MONITOR'
  | 'EQUIPMENT_SENSOR';

export type DeviceStatus = 'Online' | 'Offline' | 'Warning' | 'Error' | 'Maintenance';

export interface IDevice extends Document {
  deviceId: string;
  name: string;
  type: DeviceType;
  buildingId: mongoose.Types.ObjectId;
  buildingCode: string;
  floorId?: mongoose.Types.ObjectId;
  floorNumber?: number;
  roomId?: mongoose.Types.ObjectId;
  roomNumber?: string;
  macAddress: string;
  ipAddress?: string;
  firmwareVersion: string;
  status: DeviceStatus;
  isSimulated: boolean;
  lastSeenAt?: Date;
  installationDate: Date;
  maintenanceStatus: 'OPERATIONAL' | 'NEEDS_INSPECTION' | 'MAINTENANCE_IN_PROGRESS';
  sensorConfig: Record<string, any>;
  latestMetrics: Record<string, any>;
  rssi?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: [
        'ENERGY_METER',
        'LIGHTING_CONTROLLER',
        'ENVIRONMENT_MONITOR',
        'WATER_CONTROLLER',
        'FIRE_SAFETY',
        'PARKING_DETECTOR',
        'ACCESS_CONTROL',
        'WASTE_MONITOR',
        'EQUIPMENT_SENSOR',
      ],
      index: true,
    },
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor' },
    floorNumber: { type: Number },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    roomNumber: { type: String },
    macAddress: { type: String, required: true, trim: true },
    ipAddress: { type: String, trim: true },
    firmwareVersion: { type: String, default: 'v1.4.2' },
    status: {
      type: String,
      required: true,
      enum: ['Online', 'Offline', 'Warning', 'Error', 'Maintenance'],
      default: 'Online',
      index: true,
    },
    isSimulated: { type: Boolean, default: false, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    installationDate: { type: Date, default: Date.now },
    maintenanceStatus: {
      type: String,
      enum: ['OPERATIONAL', 'NEEDS_INSPECTION', 'MAINTENANCE_IN_PROGRESS'],
      default: 'OPERATIONAL',
    },
    sensorConfig: { type: Schema.Types.Mixed, default: {} },
    latestMetrics: { type: Schema.Types.Mixed, default: {} },
    rssi: { type: Number },
  },
  { timestamps: true }
);

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
