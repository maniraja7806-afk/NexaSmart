import mongoose, { Schema, Document } from 'mongoose';

export interface IBuilding extends Document {
  code: string;
  name: string;
  campusZone: string;
  totalFloors: number;
  totalRooms: number;
  managerName?: string;
  contactEmail?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  electricityTariff: number; // Tariff per kWh
  waterTariff: number;      // Tariff per Liter
  createdAt: Date;
  updatedAt: Date;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    campusZone: { type: String, required: true, default: 'Main Campus' },
    totalFloors: { type: Number, required: true, default: 1 },
    totalRooms: { type: Number, required: true, default: 0 },
    managerName: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    electricityTariff: { type: Number, default: 0.15 },
    waterTariff: { type: Number, default: 0.002 },
  },
  { timestamps: true }
);

export const Building = mongoose.model<IBuilding>('Building', BuildingSchema);
