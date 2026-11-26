export type UserRole =
  | 'Super Admin'
  | 'Campus Administrator'
  | 'Facility Manager'
  | 'Security Officer'
  | 'Maintenance Technician'
  | 'Energy Manager'
  | 'Water Manager'
  | 'Department Administrator'
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface Building {
  _id: string;
  code: string;
  name: string;
  campusZone: string;
  totalFloors: number;
  totalRooms: number;
  managerName?: string;
  contactEmail?: string;
  electricityTariff: number;
  waterTariff: number;
}

export interface Floor {
  _id: string;
  buildingId: string;
  buildingCode: string;
  floorNumber: number;
  name: string;
  totalRooms: number;
}

export interface Room {
  _id: string;
  buildingId: string;
  buildingCode: string;
  floorNumber: number;
  roomNumber: string;
  name: string;
  type: string;
  capacity: number;
  currentOccupancy: boolean;
  occupancyCount: number;
  currentTemperature?: number;
  currentHumidity?: number;
  currentLightLux?: number;
  lightingState?: boolean;
  maintenanceStatus: 'NORMAL' | 'UNDER_MAINTENANCE';
}

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

export interface Device {
  _id: string;
  deviceId: string;
  name: string;
  type: DeviceType;
  buildingCode: string;
  roomNumber?: string;
  floorNumber?: number;
  macAddress: string;
  ipAddress?: string;
  firmwareVersion: string;
  status: DeviceStatus;
  isSimulated: boolean;
  lastSeenAt?: string;
  maintenanceStatus: 'OPERATIONAL' | 'NEEDS_INSPECTION' | 'MAINTENANCE_IN_PROGRESS';
  latestMetrics: Record<string, any>;
  rssi?: number;
}

export interface Alert {
  _id: string;
  alertId: string;
  deviceId?: string;
  buildingCode: string;
  roomNumber?: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  status: 'New' | 'Acknowledged' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  acknowledgedBy?: string;
  createdAt: string;
}

export interface AutomationRule {
  _id: string;
  ruleId: string;
  name: string;
  description?: string;
  buildingCode: string;
  roomNumber?: string;
  sensorType: string;
  metricKey: string;
  condition: 'GT' | 'LT' | 'EQ' | 'GTE' | 'LTE' | 'NEQ';
  threshold: any;
  action: string;
  actionTargetDevice: string;
  durationSeconds?: number;
  isEnabled: boolean;
  lastTriggeredAt?: string;
}

export interface MaintenanceRequest {
  _id: string;
  requestId: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Waiting for Parts' | 'Completed' | 'Cancelled';
  buildingCode: string;
  roomNumber?: string;
  deviceId?: string;
  reportedBy: string;
  assignedToTechnicianName?: string;
  estimatedCost: number;
  actualCost: number;
  createdAt: string;
}

export interface ParkingSlot {
  _id: string;
  slotNumber: string;
  buildingCode: string;
  floorNumber: number;
  zone: string;
  type: string;
  status: 'Available' | 'Occupied' | 'Reserved' | 'OutOfService';
  reservedFor?: string;
}

export interface WasteBin {
  _id: string;
  binId: string;
  buildingCode: string;
  floorNumber: number;
  locationDesc: string;
  wasteType: string;
  fillLevelPercent: number;
  thresholdPercent: number;
  needsCollection: boolean;
}

export interface Equipment {
  _id: string;
  equipmentId: string;
  name: string;
  type: string;
  buildingCode: string;
  roomNumber: string;
  operatingStatus: 'NORMAL' | 'WARNING' | 'FAULT' | 'OFFLINE';
  temperatureC: number;
  vibrationMmS: number;
  operatingHours: number;
}
