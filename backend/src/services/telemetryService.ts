import { Device, DeviceTelemetry, EnergyReading, WaterReading, EnvironmentReading, ParkingSlot, WasteBin, Equipment } from '../models/index.js';
import { socketManager } from '../sockets/socketManager.js';
import { automationEngine } from './automationEngine.js';
import { alertService } from './alertService.js';
import { config } from '../config/index.js';

class TelemetryService {
  // Track last seen sequence per device to filter duplicate network packets
  private deviceSequences = new Map<string, number>();

  public async ingestTelemetry(payload: {
    deviceId: string;
    buildingId?: string;
    buildingCode?: string;
    roomId?: string;
    roomNumber?: string;
    sequence: number;
    firmware?: string;
    isSimulated?: boolean;
    metrics: Record<string, any>;
    timestamp?: string | Date;
  }): Promise<void> {
    const { deviceId, sequence, metrics } = payload;
    const buildingCode = (payload.buildingCode || payload.buildingId || 'BLD-ENG-01').toUpperCase();
    const roomNumber = payload.roomNumber || payload.roomId || 'RM-GENERAL';

    // 1. Deduplication check
    const lastSeq = this.deviceSequences.get(deviceId);
    if (lastSeq !== undefined && sequence <= lastSeq && sequence !== 1) {
      // Duplicate or out-of-order packet
      return;
    }
    this.deviceSequences.set(deviceId, sequence);

    const utcTimestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

    // 2. Persist in DeviceTelemetry collection
    const telemetryDoc = new DeviceTelemetry({
      deviceId: deviceId.toUpperCase(),
      buildingCode,
      roomNumber,
      timestamp: utcTimestamp,
      sequence,
      firmware: payload.firmware || 'v1.4.2',
      isSimulated: !!payload.isSimulated,
      metrics,
    });
    await telemetryDoc.save();

    // 3. Update device document status & latest metrics
    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId: deviceId.toUpperCase() },
      {
        $set: {
          latestMetrics: metrics,
          lastSeenAt: utcTimestamp,
          status: 'Online',
          ...(payload.isSimulated !== undefined && { isSimulated: payload.isSimulated }),
        },
      },
      { new: true }
    );

    // 4. Ingest into specialized model based on metric payload contents
    await this.routeSpecializedReadings(deviceId, buildingCode, roomNumber, metrics, utcTimestamp);

    // 5. Broadcast to real-time WebSockets
    socketManager.broadcastTelemetry({
      deviceId: deviceId.toUpperCase(),
      buildingCode,
      roomNumber,
      timestamp: utcTimestamp,
      metrics,
      isSimulated: !!payload.isSimulated,
    });

    // 6. Evaluate automation rules and alerts
    await automationEngine.evaluateRules(deviceId, buildingCode, roomNumber, metrics);
    await alertService.checkThresholds(deviceId, buildingCode, roomNumber, metrics);
  }

  private async routeSpecializedReadings(
    deviceId: string,
    buildingCode: string,
    roomNumber: string,
    metrics: Record<string, any>,
    timestamp: Date
  ): Promise<void> {
    try {
      // Energy
      if (metrics.voltage !== undefined && metrics.activePowerKw !== undefined) {
        const estimatedCost = (metrics.energyKwh || 0) * config.tariffs.electricityRatePerKwh;
        await EnergyReading.create({
          deviceId,
          buildingCode,
          roomNumber,
          voltage: metrics.voltage,
          current: metrics.current || 0,
          activePowerKw: metrics.activePowerKw,
          energyKwh: metrics.energyKwh || 0,
          frequency: metrics.frequency || 50.0,
          powerFactor: metrics.powerFactor || 0.95,
          estimatedCost,
          timestamp,
        });
      }

      // Water
      if (metrics.tankLevelPercent !== undefined || metrics.flowRateLpm !== undefined) {
        await WaterReading.create({
          deviceId,
          buildingCode,
          tankLevelPercent: metrics.tankLevelPercent || 0,
          flowRateLpm: metrics.flowRateLpm || 0,
          totalVolumeLiters: metrics.totalVolumeLiters || 0,
          leakDetected: !!metrics.leakDetected,
          pumpState: !!metrics.pumpState,
          timestamp,
        });
      }

      // Environment
      if (metrics.temperature !== undefined || metrics.humidity !== undefined) {
        await EnvironmentReading.create({
          deviceId,
          buildingCode,
          roomNumber,
          temperature: metrics.temperature || 0,
          humidity: metrics.humidity || 0,
          rawAirQualityPpm: metrics.rawAirQualityPpm || 80,
          lightLux: metrics.ambientLightLux || metrics.lightLux || 300,
          occupancy: !!metrics.occupancy,
          timestamp,
        });
      }

      // Parking Slot
      if (metrics.status && (metrics.distanceCm !== undefined || metrics.status === 'Occupied' || metrics.status === 'Available')) {
        await ParkingSlot.findOneAndUpdate(
          { buildingCode, slotNumber: metrics.slotNumber || roomNumber },
          {
            $set: {
              status: metrics.status === 'Occupied' ? 'Occupied' : 'Available',
              lastChangedAt: timestamp,
            },
          },
          { upsert: false }
        );
      }

      // Waste Bin
      if (metrics.fillLevelPercent !== undefined) {
        await WasteBin.findOneAndUpdate(
          { buildingCode, binId: metrics.binId || deviceId },
          {
            $set: {
              fillLevelPercent: metrics.fillLevelPercent,
              needsCollection: !!metrics.needsCollection,
            },
          },
          { upsert: false }
        );
      }

      // Equipment
      if (metrics.vibrationMmS !== undefined || metrics.surfaceTempC !== undefined) {
        await Equipment.findOneAndUpdate(
          { buildingCode, equipmentId: metrics.equipmentId || deviceId },
          {
            $set: {
              vibrationMmS: metrics.vibrationMmS || 0,
              temperatureC: metrics.surfaceTempC || 30,
              operatingStatus: metrics.operatingStatus || 'NORMAL',
            },
          },
          { upsert: false }
        );
      }
    } catch (err: any) {
      console.warn(`[Specialized Readings Ingestion Error]`, err.message);
    }
  }
}

export const telemetryService = new TelemetryService();
