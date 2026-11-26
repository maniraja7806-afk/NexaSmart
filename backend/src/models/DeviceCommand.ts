import mongoose, { Schema, Document } from 'mongoose';

export type CommandStatus = 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface IDeviceCommand extends Document {
  commandId: string;
  deviceId: string;
  buildingCode: string;
  action: string;
  target?: string;
  value?: any;
  status: CommandStatus;
  issuedBy: string;
  issuedAt: Date;
  executedAt?: Date;
  ackPayload?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceCommandSchema = new Schema<IDeviceCommand>(
  {
    commandId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true, uppercase: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true },
    action: { type: String, required: true },
    target: { type: String },
    value: { type: Schema.Types.Mixed },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'SENT', 'ACKNOWLEDGED', 'SUCCESS', 'FAILED', 'TIMEOUT'],
      default: 'PENDING',
      index: true,
    },
    issuedBy: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    executedAt: { type: Date },
    ackPayload: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

DeviceCommandSchema.index({ deviceId: 1, createdAt: -1 });

export const DeviceCommand = mongoose.model<IDeviceCommand>('DeviceCommand', DeviceCommandSchema);
