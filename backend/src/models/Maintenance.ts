import mongoose, { Schema, Document } from 'mongoose';

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceStatus =
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for Parts'
  | 'Completed'
  | 'Cancelled';

export interface IMaintenanceRequest extends Document {
  requestId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  buildingCode: string;
  roomNumber?: string;
  deviceId?: string;
  equipmentId?: string;
  reportedBy: string;
  assignedToTechnicianId?: mongoose.Types.ObjectId;
  assignedToTechnicianName?: string;
  scheduledInspectionDate?: Date;
  partsReplaced: string[];
  estimatedCost: number;
  actualCost: number;
  completionNotes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Open', 'Assigned', 'In Progress', 'Waiting for Parts', 'Completed', 'Cancelled'],
      default: 'Open',
      index: true,
    },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String },
    deviceId: { type: String, uppercase: true },
    equipmentId: { type: String, uppercase: true },
    reportedBy: { type: String, required: true },
    assignedToTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedToTechnicianName: { type: String },
    scheduledInspectionDate: { type: Date },
    partsReplaced: [{ type: String }],
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    completionNotes: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

MaintenanceRequestSchema.index({ buildingCode: 1, status: 1 });

export const MaintenanceRequest = mongoose.model<IMaintenanceRequest>(
  'MaintenanceRequest',
  MaintenanceRequestSchema
);
