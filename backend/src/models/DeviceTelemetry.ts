import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceTelemetry extends Document {
  deviceId: string;
  buildingCode: string;
  roomNumber?: string;
  timestamp: Date;
  sequence: number;
  firmware: string;
  isSimulated: boolean;
  metrics: Record<string, any>;
  createdAt: Date;
}

const DeviceTelemetrySchema = new Schema<IDeviceTelemetry>(
  {
    deviceId: { type: String, required: true, uppercase: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    sequence: { type: Number, required: true },
    firmware: { type: String, default: 'v1.4.2' },
    isSimulated: { type: Boolean, default: false },
    metrics: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// High-throughput query indexes
DeviceTelemetrySchema.index({ deviceId: 1, timestamp: -1 });
DeviceTelemetrySchema.index({ buildingCode: 1, timestamp: -1 });

export const DeviceTelemetry = mongoose.model<IDeviceTelemetry>('DeviceTelemetry', DeviceTelemetrySchema);
