import mongoose, { Schema, Document } from 'mongoose';

export type RoomType =
  | 'Classroom'
  | 'Laboratory'
  | 'Faculty Office'
  | 'Auditorium'
  | 'Library'
  | 'Plant Room'
  | 'Restroom'
  | 'Corridor'
  | 'Parking Bay';

export interface IRoom extends Document {
  buildingId: mongoose.Types.ObjectId;
  buildingCode: string;
  floorId: mongoose.Types.ObjectId;
  floorNumber: number;
  roomNumber: string;
  name: string;
  type: RoomType;
  capacity: number;
  currentOccupancy: boolean;
  occupancyCount: number;
  currentTemperature?: number;
  currentHumidity?: number;
  currentLightLux?: number;
  lightingState?: boolean;
  maintenanceStatus: 'NORMAL' | 'UNDER_MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
    floorNumber: { type: Number, required: true },
    roomNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: [
        'Classroom',
        'Laboratory',
        'Faculty Office',
        'Auditorium',
        'Library',
        'Plant Room',
        'Restroom',
        'Corridor',
        'Parking Bay',
      ],
      default: 'Classroom',
    },
    capacity: { type: Number, default: 40 },
    currentOccupancy: { type: Boolean, default: false },
    occupancyCount: { type: Number, default: 0 },
    currentTemperature: { type: Number, default: 22.5 },
    currentHumidity: { type: Number, default: 45.0 },
    currentLightLux: { type: Number, default: 400 },
    lightingState: { type: Boolean, default: false },
    maintenanceStatus: {
      type: String,
      enum: ['NORMAL', 'UNDER_MAINTENANCE'],
      default: 'NORMAL',
    },
  },
  { timestamps: true }
);

RoomSchema.index({ buildingId: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
