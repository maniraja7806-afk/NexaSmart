import { Router } from 'express';
import {
  getDashboardOverview,
  getEnergyLive,
  getLightingStatus,
  overrideLighting,
  getEnvironmentOverview,
  getWaterOverview,
  setPumpControl,
  getSafetyIncidents,
  acknowledgeIncident,
  getParkingSlots,
  updateParkingSlot,
  getAccessRecords,
  getWasteBins,
  getEquipment,
  getAlerts,
  updateAlertStatus,
  getAutomationRules,
  createAutomationRule,
  toggleAutomationRule,
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  getReports,
  getSimulatorStatus,
  startSimulator,
  pauseSimulator,
  resetSimulator,
  injectSimulatorFault,
} from '../controllers/moduleControllers.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, preventViewerControl } from '../middleware/rbac.js';

const router = Router();

// Overview
router.get('/overview', authenticate, getDashboardOverview);

// Energy
router.get('/energy/live', authenticate, getEnergyLive);

// Lighting
router.get('/lighting/status', authenticate, getLightingStatus);
router.patch('/lighting/override', authenticate, preventViewerControl, overrideLighting);

// Environment & IAQ
router.get('/environment/overview', authenticate, getEnvironmentOverview);

// Water
router.get('/water/overview', authenticate, getWaterOverview);
router.post('/water/pump-control', authenticate, requireRole('Water Manager', 'Facility Manager'), setPumpControl);

// Fire & Safety
router.get('/safety/incidents', authenticate, getSafetyIncidents);
router.post('/safety/incidents/:id/acknowledge', authenticate, requireRole('Security Officer', 'Facility Manager'), acknowledgeIncident);

// Parking
router.get('/parking/slots', authenticate, getParkingSlots);
router.patch('/parking/slots/:id', authenticate, preventViewerControl, updateParkingSlot);

// Access Control
router.get('/access-control/records', authenticate, getAccessRecords);

// Waste
router.get('/waste/bins', authenticate, getWasteBins);

// Equipment
router.get('/equipment/overview', authenticate, getEquipment);

// Alerts
router.get('/alerts', authenticate, getAlerts);
router.patch('/alerts/:id/status', authenticate, preventViewerControl, updateAlertStatus);

// Automation
router.get('/automation', authenticate, getAutomationRules);
router.post('/automation', authenticate, requireRole('Facility Manager', 'Campus Administrator'), createAutomationRule);
router.patch('/automation/:id/toggle', authenticate, requireRole('Facility Manager', 'Campus Administrator'), toggleAutomationRule);

// Maintenance
router.get('/maintenance', authenticate, getMaintenanceRequests);
router.post('/maintenance', authenticate, preventViewerControl, createMaintenanceRequest);
router.patch('/maintenance/:id', authenticate, requireRole('Maintenance Technician', 'Facility Manager', 'Campus Administrator'), updateMaintenanceRequest);

// Reports
router.get('/reports', authenticate, getReports);

// Simulator
router.get('/simulator/status', authenticate, getSimulatorStatus);
router.post('/simulator/start', authenticate, requireRole('Facility Manager', 'Campus Administrator'), startSimulator);
router.post('/simulator/pause', authenticate, requireRole('Facility Manager', 'Campus Administrator'), pauseSimulator);
router.post('/simulator/reset', authenticate, requireRole('Facility Manager', 'Campus Administrator'), resetSimulator);
router.post('/simulator/inject-fault', authenticate, requireRole('Facility Manager', 'Campus Administrator'), injectSimulatorFault);

export default router;
