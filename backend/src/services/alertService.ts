import { randomUUID } from 'crypto';
import { Alert, IAlert, MaintenanceRequest, Notification } from '../models/index.js';
import { socketManager } from '../sockets/socketManager.js';

class AlertService {
  public async checkThresholds(
    deviceId: string,
    buildingCode: string,
    roomNumber: string,
    metrics: Record<string, any>
  ): Promise<void> {
    // 1. Water leak
    if (metrics.leakDetected) {
      await this.ensureAlert({
        deviceId,
        buildingCode,
        roomNumber,
        category: 'WATER_LEAKAGE',
        severity: 'CRITICAL',
        title: 'Water Leak Detected',
        description: `Moisture probe on device ${deviceId} detected liquid ingress in ${roomNumber}. Emergency shutoff evaluated.`,
        metricSnapshot: { leakDetected: true },
        autoCreateMaintenance: true,
      });
    }

    // 2. Low water tank level
    if (metrics.tankLevelPercent !== undefined && metrics.tankLevelPercent < 15.0) {
      await this.ensureAlert({
        deviceId,
        buildingCode,
        roomNumber,
        category: 'LOW_TANK_LEVEL',
        severity: 'HIGH',
        title: 'Low Water Tank Level Warning',
        description: `Reservoir level at ${metrics.tankLevelPercent}% (Below 15% safety minimum).`,
        metricSnapshot: { tankLevelPercent: metrics.tankLevelPercent },
      });
    }

    // 3. Smoke / Flame safety events
    if (metrics.smokeDetected || metrics.flameDetected) {
      await this.ensureAlert({
        deviceId,
        buildingCode,
        roomNumber,
        category: 'SMOKE_DETECTED',
        severity: 'CRITICAL',
        title: metrics.flameDetected ? 'CRITICAL: Flame Detected!' : 'CRITICAL: Smoke Threshold Exceeded!',
        description: `Fire detection node ${deviceId} reported emergency event in ${roomNumber}. Educational prototype alert.`,
        metricSnapshot: metrics,
        autoCreateMaintenance: true,
      });
    }

    // 4. Abnormal Temperature
    if (metrics.temperature !== undefined && metrics.temperature > 32.0) {
      await this.ensureAlert({
        deviceId,
        buildingCode,
        roomNumber,
        category: 'TEMPERATURE_THRESHOLD',
        severity: 'MEDIUM',
        title: 'Elevated Room Temperature',
        description: `Zone ${roomNumber} ambient temperature reached ${metrics.temperature}°C (High threshold: 32°C).`,
        metricSnapshot: { temperature: metrics.temperature },
      });
    }

    // 5. Equipment Vibration Fault
    if (metrics.vibrationMmS !== undefined && metrics.vibrationMmS > 8.0) {
      await this.ensureAlert({
        deviceId,
        buildingCode,
        roomNumber,
        category: 'EQUIPMENT_FAULT',
        severity: 'HIGH',
        title: 'Excessive Equipment Vibration Alert',
        description: `Motor/Pump ${deviceId} vibration reached ${metrics.vibrationMmS} mm/s (Exceeds ISO 10816 threshold).`,
        metricSnapshot: { vibrationMmS: metrics.vibrationMmS },
        autoCreateMaintenance: true,
      });
    }

    // 6. Dustbin Collection Needed
    if (metrics.fillLevelPercent !== undefined && metrics.fillLevelPercent >= 85.0) {
      await this.ensureAlert({
        deviceId,
        buildingCode,
        roomNumber,
        category: 'DUSTBIN_OVERFLOW',
        severity: 'MEDIUM',
        title: 'Dustbin Collection Required',
        description: `Waste bin in ${roomNumber} reached ${metrics.fillLevelPercent}% capacity. Dispatching sanitation task.`,
        metricSnapshot: { fillLevelPercent: metrics.fillLevelPercent },
      });
    }
  }

  public async ensureAlert(params: {
    deviceId: string;
    buildingCode: string;
    roomNumber: string;
    category: any;
    severity: any;
    title: string;
    description: string;
    metricSnapshot?: Record<string, any>;
    autoCreateMaintenance?: boolean;
  }): Promise<IAlert | null> {
    // Avoid spamming duplicate open alerts for same device and category
    const existing = await Alert.findOne({
      deviceId: params.deviceId,
      category: params.category,
      status: { $in: ['New', 'Acknowledged', 'In Progress'] },
    });

    if (existing) return null;

    return this.createAlert(params);
  }

  public async createAlert(params: {
    deviceId?: string;
    buildingCode: string;
    roomNumber?: string;
    category: any;
    severity: any;
    title: string;
    description: string;
    metricSnapshot?: Record<string, any>;
    autoCreateMaintenance?: boolean;
  }): Promise<IAlert> {
    const alertId = `ALT-${randomUUID().slice(0, 8).toUpperCase()}`;

    const alert = new Alert({
      alertId,
      deviceId: params.deviceId,
      buildingCode: params.buildingCode,
      roomNumber: params.roomNumber,
      category: params.category,
      severity: params.severity,
      title: params.title,
      description: params.description,
      status: 'New',
      metricSnapshot: params.metricSnapshot || {},
    });
    await alert.save();

    // Broadcast over WebSocket
    socketManager.broadcastAlert(alert);

    // Save in-app notification
    await Notification.create({
      title: alert.title,
      message: alert.description,
      type: alert.severity === 'CRITICAL' ? 'ALERT' : 'WARNING',
      link: '/alerts',
    });

    // Auto-create maintenance request if flagged
    if (params.autoCreateMaintenance) {
      await MaintenanceRequest.create({
        requestId: `MR-${randomUUID().slice(0, 8).toUpperCase()}`,
        title: `Auto-generated: ${alert.title}`,
        description: `Automated maintenance ticket created from alert ${alert.alertId}: ${alert.description}`,
        priority: alert.severity === 'CRITICAL' ? 'Critical' : 'High',
        status: 'Open',
        buildingCode: alert.buildingCode,
        roomNumber: alert.roomNumber,
        deviceId: alert.deviceId,
        reportedBy: 'SYSTEM_AUTOPILOT',
        partsReplaced: [],
      });
    }

    return alert;
  }
}

export const alertService = new AlertService();
