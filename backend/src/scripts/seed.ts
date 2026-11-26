import mongoose from 'mongoose';
import { config } from '../config/index.js';
import {
  User,
  Building,
  Floor,
  Room,
  Device,
  EnergyReading,
  WaterReading,
  EnvironmentReading,
  ParkingSlot,
  WasteBin,
  Equipment,
  AutomationRule,
  MaintenanceRequest,
  Alert,
} from '../models/index.js';

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri);

  console.log('[Seed] Purging existing test records...');
  await Promise.all([
    User.deleteMany({}),
    Building.deleteMany({}),
    Floor.deleteMany({}),
    Room.deleteMany({}),
    Device.deleteMany({}),
    EnergyReading.deleteMany({}),
    WaterReading.deleteMany({}),
    EnvironmentReading.deleteMany({}),
    ParkingSlot.deleteMany({}),
    WasteBin.deleteMany({}),
    Equipment.deleteMany({}),
    AutomationRule.deleteMany({}),
    MaintenanceRequest.deleteMany({}),
    Alert.deleteMany({}),
  ]);

  console.log('[Seed] Seeding 9 RBAC Users...');
  const users = [
    {
      name: 'Dr. Evelyn Carter',
      email: 'superadmin@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Super Admin',
      department: 'Central IT Administration',
    },
    {
      name: 'Marcus Vance',
      email: 'campusadmin@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Campus Administrator',
      department: 'Campus Operations',
    },
    {
      name: 'Elena Rostova',
      email: 'facility@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Facility Manager',
      department: 'Physical Facilities',
    },
    {
      name: 'Chief Thomas Reyes',
      email: 'security@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Security Officer',
      department: 'Campus Safety & Protection',
    },
    {
      name: 'Liam Chen',
      email: 'technician@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Maintenance Technician',
      department: 'HVAC & Electrical Support',
    },
    {
      name: 'Amara Okafor',
      email: 'energy@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Energy Manager',
      department: 'Sustainability & Power',
    },
    {
      name: 'Diego Morales',
      email: 'water@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Water Manager',
      department: 'Water Infrastructure',
    },
    {
      name: 'Prof. Sarah Jenkins',
      email: 'department@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Department Administrator',
      department: 'School of Engineering',
    },
    {
      name: 'Campus Visitor / Auditor',
      email: 'viewer@nexasmart.io',
      passwordHash: 'Password123!',
      role: 'Viewer',
      department: 'External Audit',
    },
  ];

  for (const u of users) {
    const userDoc = new User(u);
    await userDoc.save();
  }

  console.log('[Seed] Seeding Campus Buildings & Spatial Hierarchy...');
  const bldEng = await Building.create({
    code: 'BLD-ENG-01',
    name: 'Engineering & Technology Complex',
    campusZone: 'North Sector',
    totalFloors: 4,
    totalRooms: 32,
    managerName: 'Elena Rostova',
    contactEmail: 'eng-facilities@nexasmart.io',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    electricityTariff: 0.15,
    waterTariff: 0.002,
  });

  const bldSci = await Building.create({
    code: 'BLD-SCI-01',
    name: 'Science & Advanced Research Center',
    campusZone: 'East Sector',
    totalFloors: 3,
    totalRooms: 24,
    managerName: 'Elena Rostova',
    contactEmail: 'sci-facilities@nexasmart.io',
    coordinates: { lat: 37.7758, lng: -122.4182 },
    electricityTariff: 0.16,
    waterTariff: 0.002,
  });

  const bldAdm = await Building.create({
    code: 'BLD-ADM-01',
    name: 'Administration & Student Services Tower',
    campusZone: 'Central Quad',
    totalFloors: 2,
    totalRooms: 14,
    managerName: 'Marcus Vance',
    contactEmail: 'admin-facilities@nexasmart.io',
    coordinates: { lat: 37.7742, lng: -122.4205 },
    electricityTariff: 0.14,
    waterTariff: 0.002,
  });

  // Floors
  const f1Eng = await Floor.create({
    buildingId: bldEng._id,
    buildingCode: 'BLD-ENG-01',
    floorNumber: 1,
    name: 'Ground Floor – Robotics & Labs',
    totalRooms: 8,
  });

  const f2Eng = await Floor.create({
    buildingId: bldEng._id,
    buildingCode: 'BLD-ENG-01',
    floorNumber: 2,
    name: 'Second Floor – Classrooms & Faculty',
    totalRooms: 12,
  });

  // Rooms
  const rm204 = await Room.create({
    buildingId: bldEng._id,
    buildingCode: 'BLD-ENG-01',
    floorId: f2Eng._id,
    floorNumber: 2,
    roomNumber: 'RM-204',
    name: 'IoT & Embedded Systems Smart Classroom',
    type: 'Classroom',
    capacity: 45,
    currentOccupancy: true,
    occupancyCount: 28,
    currentTemperature: 23.4,
    currentHumidity: 50.2,
    currentLightLux: 380,
    lightingState: true,
  });

  const lab101 = await Room.create({
    buildingId: bldSci._id,
    buildingCode: 'BLD-SCI-01',
    floorId: f1Eng._id,
    floorNumber: 1,
    roomNumber: 'LAB-101',
    name: 'Chemical & Materials Synthesis Lab',
    type: 'Laboratory',
    capacity: 25,
    currentOccupancy: false,
    occupancyCount: 0,
    currentTemperature: 22.0,
    currentHumidity: 46.0,
    currentLightLux: 210,
    lightingState: false,
  });

  console.log('[Seed] Seeding IoT Devices (Hardware Prototypes & Simulated Nodes)...');
  const devices = [
    {
      deviceId: 'DEV-ESP32-ENV-01',
      name: 'Classroom 204 Environment Node',
      type: 'ENVIRONMENT_MONITOR',
      buildingId: bldEng._id,
      buildingCode: 'BLD-ENG-01',
      floorId: f2Eng._id,
      floorNumber: 2,
      roomId: rm204._id,
      roomNumber: 'RM-204',
      macAddress: '24:6F:28:B1:C2:A4',
      ipAddress: '192.168.1.120',
      firmwareVersion: 'v1.4.2',
      status: 'Online',
      isSimulated: false,
      sensorConfig: { dhtPin: 4, ldrPin: 34, pirPin: 13 },
      latestMetrics: { temperature: 23.4, humidity: 50.2, occupancy: true, ambientLightLux: 380 },
    },
    {
      deviceId: 'DEV-ESP32-LGT-01',
      name: 'Classroom 204 Lighting Controller',
      type: 'LIGHTING_CONTROLLER',
      buildingId: bldEng._id,
      buildingCode: 'BLD-ENG-01',
      floorId: f2Eng._id,
      floorNumber: 2,
      roomId: rm204._id,
      roomNumber: 'RM-204',
      macAddress: '24:6F:28:B1:C2:B5',
      ipAddress: '192.168.1.121',
      firmwareVersion: 'v1.4.2',
      status: 'Online',
      isSimulated: false,
      sensorConfig: { pirPin: 13, ldrPin: 34, relayPin: 32 },
      latestMetrics: { relayState: true, manualOverride: false },
    },
    {
      deviceId: 'DEV-ESP32-PWR-01',
      name: 'Engineering Main Switchgear PZEM',
      type: 'ENERGY_METER',
      buildingId: bldEng._id,
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'PANEL-MAIN',
      macAddress: '24:6F:28:C2:01:88',
      ipAddress: '192.168.1.122',
      firmwareVersion: 'v1.4.2',
      status: 'Online',
      isSimulated: false,
      sensorConfig: { pzemRx: 16, pzemTx: 17 },
      latestMetrics: { voltage: 231.2, current: 18.5, activePowerKw: 4.12, energyKwh: 1420.5 },
    },
    {
      deviceId: 'DEV-ESP32-WTR-01',
      name: 'Rooftop Water Reservoir & Pump Controller',
      type: 'WATER_CONTROLLER',
      buildingId: bldEng._id,
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      macAddress: '24:6F:28:D4:55:10',
      ipAddress: '192.168.1.123',
      firmwareVersion: 'v1.4.2',
      status: 'Online',
      isSimulated: false,
      sensorConfig: { trigPin: 5, echoPin: 18, flowPin: 19, leakPin: 35, pumpRelayPin: 33 },
      latestMetrics: { tankLevelPercent: 78.5, flowRateLpm: 14.2, totalVolumeLiters: 4850.0, leakDetected: false, pumpState: true },
    },
    // Simulated Nodes
    {
      deviceId: 'DEV-SIM-ENV-01',
      name: '[SIM] Classroom 204 Virtual Sensor Node',
      type: 'ENVIRONMENT_MONITOR',
      buildingId: bldEng._id,
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-204',
      macAddress: 'AA:BB:CC:DD:EE:01',
      ipAddress: '10.0.0.101',
      firmwareVersion: 'v1.4.2-sim',
      status: 'Online',
      isSimulated: true,
      sensorConfig: {},
      latestMetrics: { temperature: 22.8, humidity: 48.0, occupancy: true, ambientLightLux: 360 },
    },
    {
      deviceId: 'DEV-SIM-SAFE-01',
      name: '[SIM] Chemistry Lab Safety & Smoke Node',
      type: 'FIRE_SAFETY',
      buildingId: bldSci._id,
      buildingCode: 'BLD-SCI-01',
      roomNumber: 'LAB-101',
      macAddress: 'AA:BB:CC:DD:EE:02',
      ipAddress: '10.0.0.102',
      firmwareVersion: 'v1.4.2-sim',
      status: 'Online',
      isSimulated: true,
      sensorConfig: {},
      latestMetrics: { smokeLevel: 410, smokeDetected: false, flameDetected: false, alarmState: false },
    },
  ];

  for (const d of devices) {
    await Device.create(d);
  }

  console.log('[Seed] Seeding Parking Bays...');
  await ParkingSlot.create([
    { slotNumber: 'A-101', buildingCode: 'BLD-ENG-01', floorNumber: 0, zone: 'Lot A', type: 'Standard', status: 'Occupied' },
    { slotNumber: 'A-102', buildingCode: 'BLD-ENG-01', floorNumber: 0, zone: 'Lot A', type: 'EV Charging', status: 'Available' },
    { slotNumber: 'A-103', buildingCode: 'BLD-ENG-01', floorNumber: 0, zone: 'Lot A', type: 'Accessible', status: 'Available' },
    { slotNumber: 'A-104', buildingCode: 'BLD-ENG-01', floorNumber: 0, zone: 'Lot A', type: 'Faculty', status: 'Reserved', reservedFor: 'Dean of Engineering' },
  ]);

  console.log('[Seed] Seeding Smart Dustbins...');
  await WasteBin.create([
    { binId: 'BIN-201', buildingCode: 'BLD-ENG-01', floorNumber: 2, locationDesc: 'Corridor 2F near Elevators', wasteType: 'Recyclable', fillLevelPercent: 54.0 },
    { binId: 'BIN-101', buildingCode: 'BLD-ENG-01', floorNumber: 1, locationDesc: 'Robotics Workshop Main Door', wasteType: 'General', fillLevelPercent: 78.0 },
  ]);

  console.log('[Seed] Seeding Equipment Monitored Assets...');
  await Equipment.create([
    {
      equipmentId: 'EQP-CHILLER-01',
      name: 'Primary Centrifugal Water Chiller 350-Ton',
      type: 'CHILLER',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-HVAC-PLANT',
      operatingStatus: 'NORMAL',
      temperatureC: 38.4,
      vibrationMmS: 2.1,
      operatingHours: 1240,
    },
    {
      equipmentId: 'EQP-BOOSTER-PUMP-01',
      name: 'Domestic Water Booster Pump #1',
      type: 'PUMP',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      operatingStatus: 'NORMAL',
      temperatureC: 44.2,
      vibrationMmS: 1.8,
      operatingHours: 890,
    },
  ]);

  console.log('[Seed] Seeding Automation Rules...');
  await AutomationRule.create([
    {
      ruleId: 'RLE-AUTO-LIGHT-01',
      name: 'Classroom Lighting Occupancy Control',
      description: 'Automatically energizes lighting when occupancy is detected and ambient light < 300 Lux.',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-204',
      sensorType: 'occupancy',
      metricKey: 'occupancy',
      condition: 'EQ',
      threshold: true,
      action: 'SET_RELAY',
      actionTargetDevice: 'DEV-ESP32-LGT-01',
      actionPayload: { value: 1 },
      durationSeconds: 15,
      isEnabled: true,
      createdBy: 'facility@nexasmart.io',
    },
    {
      ruleId: 'RLE-WATER-SAFETY-01',
      name: 'Automatic Pump Shutoff on Tank Low/Leak',
      description: 'Shuts off water booster pump immediately if reservoir level drops below 15%.',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      sensorType: 'tankLevelPercent',
      metricKey: 'tankLevelPercent',
      condition: 'LT',
      threshold: 15.0,
      action: 'TRIGGER_PUMP',
      actionTargetDevice: 'DEV-ESP32-WTR-01',
      actionPayload: { value: 0 },
      durationSeconds: 30,
      isEnabled: true,
      createdBy: 'water@nexasmart.io',
    },
  ]);

  console.log('[Seed] Seeding Initial Maintenance Requests...');
  await MaintenanceRequest.create([
    {
      requestId: 'MR-1001',
      title: 'PZEM Module Calibration Check',
      description: 'Verify current transformer CT ratio against calibrated bench meter.',
      priority: 'Medium',
      status: 'Assigned',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'PANEL-MAIN',
      deviceId: 'DEV-ESP32-PWR-01',
      reportedBy: 'energy@nexasmart.io',
      assignedToTechnicianName: 'Liam Chen',
      partsReplaced: [],
      estimatedCost: 120,
    },
  ]);

  console.log('[Seed] Seeding complete! Database is primed and ready.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
