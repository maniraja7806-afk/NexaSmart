import mongoose, { Schema, Document } from 'mongoose';

export interface IFloor extends Document {
  buildingId: mongoose.Types.ObjectId;
  buildingCode: string;
  floorNumber: number;
  name: string;
  totalRooms: number;
  floorPlanUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FloorSchema = new Schema<IFloor>(
  {
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true },
    floorNumber: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    totalRooms: { type: Number, default: 0 },
    floorPlanUrl: { type: String },
  },
  { timestamps: true }
);

FloorSchema.index({ buildingId: 1, floorNumber: 1 }, { unique: true });

export const Floor = mongoose.model<IFloor>('Floor', FloorSchema);
