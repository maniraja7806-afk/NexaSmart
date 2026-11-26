import { Request, Response, NextFunction } from 'express';
import {
  Building,
  Device,
  EnergyReading,
  WaterReading,
  EnvironmentReading,
  ParkingSlot,
  AccessRecord,
  SafetyIncident,
  WasteBin,
  Equipment,
  Alert,
  AutomationRule,
  AutomationExecution,
  MaintenanceRequest,
  Notification,
} from '../models/index.js';
import { simulatorService } from '../services/simulatorService.js';
import { commandService } from '../services/commandService.js';
import { config } from '../config/index.js';

// -------------------------------------------------------------
// Executive Dashboard Overview
// -------------------------------------------------------------
export async function getDashboardOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalBuildings,
      totalDevices,
      onlineDevices,
      offlineDevices,
      activeAlerts,
      recentEnergy,
      recentWater,
      parkingStats,
      recentIncidents,
      recentActivity,
    ] = await Promise.all([
      Building.countDocuments(),
      Device.countDocuments(),
      Device.countDocuments({ status: 'Online' }),
      Device.countDocuments({ status: { $ne: 'Online' } }),
      Alert.countDocuments({ status: { $in: ['New', 'Acknowledged', 'Assigned', 'In Progress'] } }),
      EnergyReading.find().sort({ timestamp: -1 }).limit(10),
      WaterReading.find().sort({ timestamp: -1 }).limit(1),
      ParkingSlot.find(),
      SafetyIncident.find({ status: 'ACTIVE' }),
      Alert.find().sort({ createdAt: -1 }).limit(6),
    ]);

    const totalParking = parkingStats.length;
    const occupiedParking = parkingStats.filter((p) => p.status === 'Occupied').length;
    const availableParking = parkingStats.filter((p) => p.status === 'Available').length;

    // Calculate aggregated metrics
    const avgPower = recentEnergy.length > 0 ? recentEnergy.reduce((acc, r) => acc + r.activePowerKw, 0) / recentEnergy.length : 0;
    const totalEnergy = recentEnergy.length > 0 ? Math.max(...recentEnergy.map((r) => r.energyKwh)) : 0;

    res.json({
      success: true,
      data: {
        totalBuildings,
        totalDevices,
        onlineDevices,
        offlineDevices,
        activeAlerts,
        powerKw: Math.round(avgPower * 10) / 10,
        totalEnergyKwh: Math.round(totalEnergy * 10) / 10,
        waterLevelPercent: recentWater[0]?.tankLevelPercent || 78,
        waterFlowLpm: recentWater[0]?.flowRateLpm || 12.4,
        parking: {
          total: totalParking,
          occupied: occupiedParking,
          available: availableParking,
        },
        activeSafetyIncidents: recentIncidents.length,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 2: Smart Energy Management
// -------------------------------------------------------------
export async function getEnergyLive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { buildingCode } = req.query;
    const filter: any = {};
    if (buildingCode) filter.buildingCode = (buildingCode as string).toUpperCase();

    const latest = await EnergyReading.find(filter).sort({ timestamp: -1 }).limit(30);
    const devices = await Device.find({ type: 'ENERGY_METER', ...filter });

    res.json({
      success: true,
      data: {
        recentReadings: latest.reverse(),
        devices,
        tariffPerKwh: config.tariffs.electricityRatePerKwh,
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 3: Smart Lighting Automation
// -------------------------------------------------------------
export async function getLightingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devices = await Device.find({ type: 'LIGHTING_CONTROLLER' });
    res.json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    next(err);
  }
}

export async function overrideLighting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceId, state } = req.body;
    const result = await commandService.issueCommand({
      deviceId,
      action: 'SET_RELAY',
      value: state ? 1 : 0,
      issuedBy: req.user?.email || 'admin@nexasmart.io',
      waitForAckMs: 5000,
    });
    res.json({ success: true, message: 'Lighting override command acknowledged', data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// -------------------------------------------------------------
// Module 4 & 5: Classroom & Indoor Air Quality Environment
// -------------------------------------------------------------
export async function getEnvironmentOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { buildingCode } = req.query;
    const filter: any = {};
    if (buildingCode) filter.buildingCode = (buildingCode as string).toUpperCase();

    const devices = await Device.find({ type: 'ENVIRONMENT_MONITOR', ...filter });
    const history = await EnvironmentReading.find(filter).sort({ timestamp: -1 }).limit(25);

    res.json({
      success: true,
      data: {
        devices,
        history: history.reverse(),
        disclaimer: 'MQ-135 readings provide qualitative relative gas indicators. Not certified laboratory CO2/pollutant equipment.',
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 6: Water Management
// -------------------------------------------------------------
export async function getWaterOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devices = await Device.find({ type: 'WATER_CONTROLLER' });
    const latestReading = await WaterReading.findOne().sort({ timestamp: -1 });
    const history = await WaterReading.find().sort({ timestamp: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        controllers: devices,
        latestReading,
        history: history.reverse(),
        tariffPerLiter: config.tariffs.waterRatePerLiter,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function setPumpControl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceId, pumpState } = req.body;
    const result = await commandService.issueCommand({
      deviceId: deviceId || 'DEV-ESP32-WTR-01',
      action: 'SET_PUMP',
      value: pumpState ? 1 : 0,
      issuedBy: req.user?.email || 'water_manager@nexasmart.io',
      waitForAckMs: 5000,
    });
    res.json({ success: true, message: 'Pump command confirmed by hardware ACK', data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// -------------------------------------------------------------
// Module 7: Fire and Safety Monitoring
// -------------------------------------------------------------
export async function getSafetyIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incidents = await SafetyIncident.find().sort({ createdAt: -1 });
    const devices = await Device.find({ type: 'FIRE_SAFETY' });
    res.json({
      success: true,
      data: {
        incidents,
        devices,
        disclaimer: 'Educational prototype platform. Does not replace certified fire alarm systems or statutory safety equipment.',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incident = await SafetyIncident.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          acknowledged: true,
          status: 'ACKNOWLEDGED',
          acknowledgedBy: req.user?.email || 'security_officer',
          acknowledgedAt: new Date(),
        },
      },
      { new: true }
    );
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 8: Smart Parking
// -------------------------------------------------------------
export async function getParkingSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slots = await ParkingSlot.find().sort({ slotNumber: 1 });
    res.json({ success: true, count: slots.length, data: slots });
  } catch (err) {
    next(err);
  }
}

export async function updateParkingSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: slot });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 9: Access Control (RFID)
// -------------------------------------------------------------
export async function getAccessRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await AccessRecord.find().sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 10: Smart Waste Management
// -------------------------------------------------------------
export async function getWasteBins(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bins = await WasteBin.find().sort({ binId: 1 });
    res.json({ success: true, count: bins.length, data: bins });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 11: Equipment Condition Monitoring
// -------------------------------------------------------------
export async function getEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const equipment = await Equipment.find().sort({ equipmentId: 1 });
    res.json({ success: true, count: equipment.length, data: equipment });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 12: Alerts & Notifications
// -------------------------------------------------------------
export async function getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.buildingCode) filter.buildingCode = (req.query.buildingCode as string).toUpperCase();

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    next(err);
  }
}

export async function updateAlertStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, resolutionNotes } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          ...(resolutionNotes && { resolutionNotes }),
          ...(status === 'Acknowledged' && { acknowledgedBy: req.user?.email, acknowledgedAt: new Date() }),
          ...(status === 'Resolved' && { resolvedBy: req.user?.email, resolvedAt: new Date() }),
        },
      },
      { new: true }
    );
    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 13: Automation Rules
// -------------------------------------------------------------
export async function getAutomationRules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rules = await AutomationRule.find().sort({ createdAt: -1 });
    const executions = await AutomationExecution.find().sort({ triggeredAt: -1 }).limit(30);
    res.json({ success: true, data: { rules, executions } });
  } catch (err) {
    next(err);
  }
}

export async function createAutomationRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = new AutomationRule({
      ...req.body,
      ruleId: `RLE-${Date.now().toString(36).toUpperCase()}`,
      createdBy: req.user?.email || 'admin@nexasmart.io',
    });
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

export async function toggleAutomationRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    rule.isEnabled = !rule.isEnabled;
    await rule.save();
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 14: Maintenance Management
// -------------------------------------------------------------
export async function getMaintenanceRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const tickets = await MaintenanceRequest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    next(err);
  }
}

export async function createMaintenanceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = new MaintenanceRequest({
      ...req.body,
      requestId: `MR-${Date.now().toString(36).toUpperCase()}`,
      reportedBy: req.user?.email || 'campus_admin',
    });
    await ticket.save();
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function updateMaintenanceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await MaintenanceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Module 15: Reports & Analytics
// -------------------------------------------------------------
export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reportType, format, buildingCode } = req.query;

    const [energyStats, alertsCount, maintenanceStats] = await Promise.all([
      EnergyReading.aggregate([
        { $group: { _id: '$buildingCode', totalEnergyKwh: { $max: '$energyKwh' }, avgPower: { $avg: '$activePowerKw' } } },
      ]),
      Alert.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      MaintenanceRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalCost: { $sum: '$actualCost' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        energySummary: energyStats,
        alertBreakdown: alertsCount,
        maintenanceSummary: maintenanceStats,
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// Simulator Controls
// -------------------------------------------------------------
export async function getSimulatorStatus(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: simulatorService.getStatus() });
}

export async function startSimulator(req: Request, res: Response): Promise<void> {
  simulatorService.start();
  res.json({ success: true, message: 'Simulator started', data: simulatorService.getStatus() });
}

export async function pauseSimulator(req: Request, res: Response): Promise<void> {
  simulatorService.pause();
  res.json({ success: true, message: 'Simulator paused', data: simulatorService.getStatus() });
}

export async function resetSimulator(req: Request, res: Response): Promise<void> {
  simulatorService.reset();
  res.json({ success: true, message: 'Simulator reset to operational baseline', data: simulatorService.getStatus() });
}

export async function injectSimulatorFault(req: Request, res: Response): Promise<void> {
  const { faultType } = req.body;
  const result = simulatorService.injectFault(faultType);
  res.json(result);
}
