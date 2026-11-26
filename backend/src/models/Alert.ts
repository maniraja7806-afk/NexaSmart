import mongoose, { Schema, Document } from 'mongoose';

export type AlertCategory =
  | 'DEVICE_OFFLINE'
  | 'TEMPERATURE_THRESHOLD'
  | 'HIGH_ENERGY_CONSUMPTION'
  | 'WATER_LEAKAGE'
  | 'LOW_TANK_LEVEL'
  | 'SMOKE_DETECTED'
  | 'UNAUTHORIZED_ACCESS'
  | 'EQUIPMENT_FAULT'
  | 'PARKING_FULL'
  | 'DUSTBIN_OVERFLOW';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'New' | 'Acknowledged' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface IAlert extends Document {
  alertId: string;
  deviceId?: string;
  buildingCode: string;
  roomNumber?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  metricSnapshot?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, uppercase: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String },
    category: {
      type: String,
      required: true,
      enum: [
        'DEVICE_OFFLINE',
        'TEMPERATURE_THRESHOLD',
        'HIGH_ENERGY_CONSUMPTION',
        'WATER_LEAKAGE',
        'LOW_TANK_LEVEL',
        'SMOKE_DETECTED',
        'UNAUTHORIZED_ACCESS',
        'EQUIPMENT_FAULT',
        'PARKING_FULL',
        'DUSTBIN_OVERFLOW',
      ],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['New', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'New',
      index: true,
    },
    acknowledgedBy: { type: String },
    acknowledgedAt: { type: Date },
    assignedTo: { type: String },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
    metricSnapshot: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AlertSchema.index({ buildingCode: 1, status: 1, createdAt: -1 });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
