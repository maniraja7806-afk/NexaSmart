import mongoose, { Schema, Document } from 'mongoose';

// -------------------------------------------------------------
// Energy Reading (PZEM-004T)
// -------------------------------------------------------------
export interface IEnergyReading extends Document {
  deviceId: string;
  buildingCode: string;
  roomNumber?: string;
  voltage: number;
  current: number;
  activePowerKw: number;
  energyKwh: number;
  frequency: number;
  powerFactor: number;
  estimatedCost: number;
  timestamp: Date;
}

const EnergyReadingSchema = new Schema<IEnergyReading>(
  {
    deviceId: { type: String, required: true, uppercase: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String },
    voltage: { type: Number, required: true },
    current: { type: Number, required: true },
    activePowerKw: { type: Number, required: true },
    energyKwh: { type: Number, required: true },
    frequency: { type: Number, default: 50.0 },
    powerFactor: { type: Number, default: 0.95 },
    estimatedCost: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);
EnergyReadingSchema.index({ buildingCode: 1, timestamp: -1 });
export const EnergyReading = mongoose.model<IEnergyReading>('EnergyReading', EnergyReadingSchema);

// -------------------------------------------------------------
// Water Reading
// -------------------------------------------------------------
export interface IWaterReading extends Document {
  deviceId: string;
  buildingCode: string;
  tankLevelPercent: number;
  flowRateLpm: number;
  totalVolumeLiters: number;
  leakDetected: boolean;
  pumpState: boolean;
  timestamp: Date;
}

const WaterReadingSchema = new Schema<IWaterReading>(
  {
    deviceId: { type: String, required: true, uppercase: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    tankLevelPercent: { type: Number, required: true },
    flowRateLpm: { type: Number, required: true },
    totalVolumeLiters: { type: Number, required: true },
    leakDetected: { type: Boolean, default: false, index: true },
    pumpState: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);
export const WaterReading = mongoose.model<IWaterReading>('WaterReading', WaterReadingSchema);

// -------------------------------------------------------------
// Environment Reading (DHT22, LDR, MQ-135)
// -------------------------------------------------------------
export interface IEnvironmentReading extends Document {
  deviceId: string;
  buildingCode: string;
  roomNumber?: string;
  temperature: number;
  humidity: number;
  rawAirQualityPpm: number;
  lightLux: number;
  occupancy: boolean;
  timestamp: Date;
}

const EnvironmentReadingSchema = new Schema<IEnvironmentReading>(
  {
    deviceId: { type: String, required: true, uppercase: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    rawAirQualityPpm: { type: Number, default: 80 },
    lightLux: { type: Number, default: 350 },
    occupancy: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);
export const EnvironmentReading = mongoose.model<IEnvironmentReading>('EnvironmentReading', EnvironmentReadingSchema);

// -------------------------------------------------------------
// Parking Slot Model
// -------------------------------------------------------------
export interface IParkingSlot extends Document {
  slotNumber: string;
  buildingCode: string;
  floorNumber: number;
  zone: string;
  type: 'Standard' | 'EV Charging' | 'Accessible' | 'Faculty';
  status: 'Available' | 'Occupied' | 'Reserved' | 'OutOfService';
  occupiedSince?: Date;
  reservedFor?: string;
  lastChangedAt: Date;
}

const ParkingSlotSchema = new Schema<IParkingSlot>(
  {
    slotNumber: { type: String, required: true, unique: true, uppercase: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    floorNumber: { type: Number, default: 0 },
    zone: { type: String, default: 'Zone A' },
    type: {
      type: String,
      enum: ['Standard', 'EV Charging', 'Accessible', 'Faculty'],
      default: 'Standard',
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'OutOfService'],
      default: 'Available',
      index: true,
    },
    occupiedSince: { type: Date },
    reservedFor: { type: String },
    lastChangedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
export const ParkingSlot = mongoose.model<IParkingSlot>('ParkingSlot', ParkingSlotSchema);

// -------------------------------------------------------------
// Access Record (RFID)
// -------------------------------------------------------------
export interface IAccessRecord extends Document {
  cardUid: string;
  userName?: string;
  userRole?: string;
  deviceId: string;
  buildingCode: string;
  zoneName: string;
  accessGranted: boolean;
  denialReason?: string;
  timestamp: Date;
}

const AccessRecordSchema = new Schema<IAccessRecord>(
  {
    cardUid: { type: String, required: true, uppercase: true, index: true },
    userName: { type: String, default: 'Guest' },
    userRole: { type: String },
    deviceId: { type: String, required: true, uppercase: true },
    buildingCode: { type: String, required: true, uppercase: true },
    zoneName: { type: String, default: 'Main Entrance' },
    accessGranted: { type: Boolean, required: true, index: true },
    denialReason: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);
AccessRecordSchema.index({ timestamp: -1 });
export const AccessRecord = mongoose.model<IAccessRecord>('AccessRecord', AccessRecordSchema);

// -------------------------------------------------------------
// Safety Incident Model
// -------------------------------------------------------------
export interface ISafetyIncident extends Document {
  incidentId: string;
  buildingCode: string;
  roomNumber?: string;
  eventType: 'SMOKE' | 'FLAME' | 'HIGH_TEMPERATURE' | 'GAS_LEAK' | 'EMERGENCY_BUTTON';
  severity: 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  sensorReading?: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  incidentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyIncidentSchema = new Schema<ISafetyIncident>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String },
    eventType: {
      type: String,
      required: true,
      enum: ['SMOKE', 'FLAME', 'HIGH_TEMPERATURE', 'GAS_LEAK', 'EMERGENCY_BUTTON'],
      index: true,
    },
    severity: {
      type: String,
      enum: ['WARNING', 'CRITICAL'],
      default: 'CRITICAL',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'ACTIVE',
      index: true,
    },
    sensorReading: { type: Number },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: String },
    acknowledgedAt: { type: Date },
    incidentNotes: { type: String },
  },
  { timestamps: true }
);
export const SafetyIncident = mongoose.model<ISafetyIncident>('SafetyIncident', SafetyIncidentSchema);

// -------------------------------------------------------------
// Waste Bin Model
// -------------------------------------------------------------
export interface IWasteBin extends Document {
  binId: string;
  buildingCode: string;
  floorNumber: number;
  locationDesc: string;
  wasteType: 'General' | 'Recyclable' | 'Organic' | 'Hazardous';
  fillLevelPercent: number;
  thresholdPercent: number;
  needsCollection: boolean;
  assignedStaff?: string;
  lastEmptiedAt?: Date;
}

const WasteBinSchema = new Schema<IWasteBin>(
  {
    binId: { type: String, required: true, unique: true, uppercase: true },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    floorNumber: { type: Number, default: 1 },
    locationDesc: { type: String, required: true },
    wasteType: {
      type: String,
      enum: ['General', 'Recyclable', 'Organic', 'Hazardous'],
      default: 'General',
    },
    fillLevelPercent: { type: Number, default: 0 },
    thresholdPercent: { type: Number, default: 85 },
    needsCollection: { type: Boolean, default: false, index: true },
    assignedStaff: { type: String },
    lastEmptiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
export const WasteBin = mongoose.model<IWasteBin>('WasteBin', WasteBinSchema);

// -------------------------------------------------------------
// Equipment Model (Pumps, Chillers, Motors, Generators)
// -------------------------------------------------------------
export interface IEquipment extends Document {
  equipmentId: string;
  name: string;
  type: 'PUMP' | 'CHILLER' | 'MOTOR' | 'GENERATOR' | 'AHU' | 'ELEVATOR';
  buildingCode: string;
  roomNumber: string;
  operatingStatus: 'NORMAL' | 'WARNING' | 'FAULT' | 'OFFLINE';
  temperatureC: number;
  vibrationMmS: number;
  operatingHours: number;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    equipmentId: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['PUMP', 'CHILLER', 'MOTOR', 'GENERATOR', 'AHU', 'ELEVATOR'],
    },
    buildingCode: { type: String, required: true, uppercase: true, index: true },
    roomNumber: { type: String, required: true },
    operatingStatus: {
      type: String,
      enum: ['NORMAL', 'WARNING', 'FAULT', 'OFFLINE'],
      default: 'NORMAL',
      index: true,
    },
    temperatureC: { type: Number, default: 35.0 },
    vibrationMmS: { type: Number, default: 1.2 },
    operatingHours: { type: Number, default: 420 },
    lastServiceDate: { type: Date },
    nextServiceDue: { type: Date },
  },
  { timestamps: true }
);
export const Equipment = mongoose.model<IEquipment>('Equipment', EquipmentSchema);
