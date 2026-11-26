import { telemetryService } from './telemetryService.js';
import { commandService } from './commandService.js';
import { AccessRecord, SafetyIncident } from '../models/index.js';

interface VirtualDeviceState {
  deviceId: string;
  buildingCode: string;
  roomNumber: string;
  type: string;
  firmware: string;
  sequence: number;
  state: Record<string, any>;
}

class SimulatorService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private tickCount = 0;

  private virtualDevices: VirtualDeviceState[] = [
    {
      deviceId: 'DEV-SIM-ENV-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-204',
      type: 'ENVIRONMENT_MONITOR',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        baseTemp: 22.8,
        baseHumid: 48.0,
        occupancy: true,
        ambientLightLux: 360,
        rawAirQualityPpm: 85,
      },
    },
    {
      deviceId: 'DEV-SIM-ENV-02',
      buildingCode: 'BLD-SCI-01',
      roomNumber: 'LAB-101',
      type: 'ENVIRONMENT_MONITOR',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        baseTemp: 23.5,
        baseHumid: 52.0,
        occupancy: false,
        ambientLightLux: 120,
        rawAirQualityPpm: 95,
      },
    },
    {
      deviceId: 'DEV-SIM-PWR-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'PANEL-MAIN',
      type: 'ENERGY_METER',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        voltage: 230.5,
        current: 18.4,
        energyKwh: 1420.5,
        frequency: 50.0,
        powerFactor: 0.96,
      },
    },
    {
      deviceId: 'DEV-SIM-PWR-02',
      buildingCode: 'BLD-SCI-01',
      roomNumber: 'PANEL-HVAC',
      type: 'ENERGY_METER',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        voltage: 229.8,
        current: 12.2,
        energyKwh: 890.2,
        frequency: 49.9,
        powerFactor: 0.94,
      },
    },
    {
      deviceId: 'DEV-SIM-LGT-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-204',
      type: 'LIGHTING_CONTROLLER',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        relayState: true,
        occupancy: true,
        ambientLightLux: 350,
        manualOverride: false,
      },
    },
    {
      deviceId: 'DEV-SIM-WTR-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-PUMP-ROOM',
      type: 'WATER_CONTROLLER',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        tankLevelPercent: 78.5,
        flowRateLpm: 12.4,
        totalVolumeLiters: 4520.0,
        leakDetected: false,
        pumpState: true,
      },
    },
    {
      deviceId: 'DEV-SIM-PRK-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'LOT-A',
      type: 'PARKING_DETECTOR',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        slotNumber: 'A-101',
        status: 'Occupied',
        distanceCm: 85.0,
      },
    },
    {
      deviceId: 'DEV-SIM-PRK-02',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'LOT-A',
      type: 'PARKING_DETECTOR',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        slotNumber: 'A-102',
        status: 'Available',
        distanceCm: 250.0,
      },
    },
    {
      deviceId: 'DEV-SIM-WST-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'CORRIDOR-2F',
      type: 'WASTE_MONITOR',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        binId: 'BIN-201',
        fillLevelPercent: 42.0,
        needsCollection: false,
      },
    },
    {
      deviceId: 'DEV-SIM-EQP-01',
      buildingCode: 'BLD-ENG-01',
      roomNumber: 'RM-HVAC-PLANT',
      type: 'EQUIPMENT_SENSOR',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        equipmentId: 'EQP-CHILLER-01',
        vibrationMmS: 2.1,
        surfaceTempC: 38.4,
        operatingStatus: 'NORMAL',
      },
    },
    {
      deviceId: 'DEV-SIM-SAFE-01',
      buildingCode: 'BLD-SCI-01',
      roomNumber: 'LAB-101',
      type: 'FIRE_SAFETY',
      firmware: 'v1.4.2-sim',
      sequence: 1,
      state: {
        smokeLevel: 410,
        smokeDetected: false,
        flameDetected: false,
        alarmState: false,
      },
    },
  ];

  public start(intervalMs = 3000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[IoT Hardware Simulator] Started with interval: ${intervalMs}ms`);

    this.timer = setInterval(async () => {
      await this.simulateTick();
    }, intervalMs);
  }

  public pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[IoT Hardware Simulator] Paused');
  }

  public reset(): void {
    this.pause();
    this.tickCount = 0;
    // Reset virtual states to baseline
    for (const d of this.virtualDevices) {
      d.sequence = 1;
      if (d.type === 'WATER_CONTROLLER') {
        d.state.tankLevelPercent = 80.0;
        d.state.leakDetected = false;
        d.state.pumpState = false;
      }
      if (d.type === 'FIRE_SAFETY') {
        d.state.smokeDetected = false;
        d.state.flameDetected = false;
        d.state.smokeLevel = 400;
      }
      if (d.type === 'EQUIPMENT_SENSOR') {
        d.state.vibrationMmS = 2.0;
        d.state.operatingStatus = 'NORMAL';
      }
      if (d.type === 'WASTE_MONITOR') {
        d.state.fillLevelPercent = 35.0;
        d.state.needsCollection = false;
      }
    }
    this.start();
    console.log('[IoT Hardware Simulator] Reset to default operational baseline');
  }

  public getStatus(): { isRunning: boolean; tickCount: number; deviceCount: number } {
    return {
      isRunning: this.isRunning,
      tickCount: this.tickCount,
      deviceCount: this.virtualDevices.length,
    };
  }

  public injectFault(faultType: string): { success: boolean; message: string } {
    switch (faultType) {
      case 'WATER_LEAK': {
        const wtr = this.virtualDevices.find((d) => d.type === 'WATER_CONTROLLER');
        if (wtr) {
          wtr.state.leakDetected = true;
          return { success: true, message: 'Simulated water leak injected into DEV-SIM-WTR-01' };
        }
        break;
      }
      case 'FIRE_ALARM': {
        const safe = this.virtualDevices.find((d) => d.type === 'FIRE_SAFETY');
        if (safe) {
          safe.state.smokeDetected = true;
          safe.state.smokeLevel = 2200;
          return { success: true, message: 'Simulated smoke event injected into DEV-SIM-SAFE-01' };
        }
        break;
      }
      case 'MOTOR_VIBRATION': {
        const eqp = this.virtualDevices.find((d) => d.type === 'EQUIPMENT_SENSOR');
        if (eqp) {
          eqp.state.vibrationMmS = 9.8;
          eqp.state.operatingStatus = 'WARNING';
          return { success: true, message: 'High vibration anomaly injected into DEV-SIM-EQP-01' };
        }
        break;
      }
      case 'DUSTBIN_FULL': {
        const wst = this.virtualDevices.find((d) => d.type === 'WASTE_MONITOR');
        if (wst) {
          wst.state.fillLevelPercent = 92.0;
          wst.state.needsCollection = true;
          return { success: true, message: 'Dustbin full threshold injected into DEV-SIM-WST-01' };
        }
        break;
      }
      case 'CLEAR_FAULTS': {
        this.reset();
        return { success: true, message: 'All simulated faults cleared' };
      }
    }
    return { success: false, message: `Unknown fault type: ${faultType}` };
  }

  // Handle actuator commands sent to simulated devices
  public handleSimulatedCommand(commandId: string, deviceId: string, action: string, value: any): void {
    const dev = this.virtualDevices.find((d) => d.deviceId === deviceId);
    if (!dev) return;

    if (action === 'SET_RELAY' || action === 'SET_LIGHT') {
      dev.state.relayState = value === 1 || value === true;
      dev.state.manualOverride = true;
    } else if (action === 'SET_PUMP') {
      if (value === 1 && dev.state.leakDetected) {
        commandService.handleAck({
          commandId,
          deviceId,
          status: 'FAILED',
          errorMessage: 'Cannot start pump while simulated leak is detected',
        });
        return;
      }
      dev.state.pumpState = value === 1 || value === true;
    }

    // Return instant simulated ACK
    commandService.handleAck({
      commandId,
      deviceId,
      status: 'SUCCESS',
      state: dev.state,
      executedAt: new Date().toISOString(),
    });
  }

  private async simulateTick(): Promise<void> {
    this.tickCount++;
    const now = new Date();

    for (const dev of this.virtualDevices) {
      dev.sequence++;
      const metrics: Record<string, any> = {};

      if (dev.type === 'ENVIRONMENT_MONITOR') {
        // Natural gentle oscillations
        const tempVariation = Math.sin(this.tickCount / 10.0) * 0.8;
        const humidVariation = Math.cos(this.tickCount / 8.0) * 1.5;
        metrics.temperature = Math.round((dev.state.baseTemp + tempVariation) * 10) / 10;
        metrics.humidity = Math.round((dev.state.baseHumid + humidVariation) * 10) / 10;
        metrics.occupancy = dev.state.occupancy;
        metrics.ambientLightLux = dev.state.ambientLightLux;
        metrics.rawAirQualityPpm = dev.state.rawAirQualityPpm;
      } else if (dev.type === 'ENERGY_METER') {
        const loadFluctuation = (Math.random() - 0.5) * 1.5;
        const curCurrent = Math.max(2.0, dev.state.current + loadFluctuation);
        const curPowerKw = (dev.state.voltage * curCurrent * dev.state.powerFactor) / 1000.0;
        dev.state.energyKwh += (curPowerKw * (3.0 / 3600.0)); // Ingest increment

        metrics.voltage = Math.round((dev.state.voltage + (Math.random() - 0.5) * 2.0) * 10) / 10;
        metrics.current = Math.round(curCurrent * 100) / 100;
        metrics.activePowerKw = Math.round(curPowerKw * 1000) / 1000;
        metrics.energyKwh = Math.round(dev.state.energyKwh * 100) / 100;
        metrics.frequency = 50.0;
        metrics.powerFactor = dev.state.powerFactor;
      } else if (dev.type === 'LIGHTING_CONTROLLER') {
        metrics.relayState = dev.state.relayState;
        metrics.occupancy = dev.state.occupancy;
        metrics.ambientLightLux = dev.state.ambientLightLux;
        metrics.manualOverride = dev.state.manualOverride;
      } else if (dev.type === 'WATER_CONTROLLER') {
        if (dev.state.pumpState && dev.state.tankLevelPercent < 95.0) {
          dev.state.tankLevelPercent += 0.4;
          dev.state.flowRateLpm = 24.5;
          dev.state.totalVolumeLiters += 1.2;
        } else if (!dev.state.pumpState && dev.state.tankLevelPercent > 20.0) {
          dev.state.tankLevelPercent -= 0.1;
          dev.state.flowRateLpm = 4.2;
        }
        metrics.tankLevelPercent = Math.round(dev.state.tankLevelPercent * 10) / 10;
        metrics.flowRateLpm = Math.round(dev.state.flowRateLpm * 10) / 10;
        metrics.totalVolumeLiters = Math.round(dev.state.totalVolumeLiters * 10) / 10;
        metrics.leakDetected = dev.state.leakDetected;
        metrics.pumpState = dev.state.pumpState;
      } else if (dev.type === 'PARKING_DETECTOR') {
        metrics.slotNumber = dev.state.slotNumber;
        metrics.status = dev.state.status;
        metrics.distanceCm = dev.state.distanceCm;
      } else if (dev.type === 'WASTE_MONITOR') {
        dev.state.fillLevelPercent = Math.min(100, dev.state.fillLevelPercent + 0.1);
        metrics.binId = dev.state.binId;
        metrics.fillLevelPercent = Math.round(dev.state.fillLevelPercent * 10) / 10;
        metrics.needsCollection = dev.state.fillLevelPercent >= 85.0;
      } else if (dev.type === 'EQUIPMENT_SENSOR') {
        metrics.equipmentId = dev.state.equipmentId;
        metrics.vibrationMmS = Math.round(dev.state.vibrationMmS * 10) / 10;
        metrics.surfaceTempC = Math.round(dev.state.surfaceTempC * 10) / 10;
        metrics.operatingStatus = dev.state.operatingStatus;
      } else if (dev.type === 'FIRE_SAFETY') {
        metrics.smokeLevel = dev.state.smokeLevel;
        metrics.smokeDetected = dev.state.smokeDetected;
        metrics.flameDetected = dev.state.flameDetected;
        metrics.alarmState = dev.state.smokeDetected || dev.state.flameDetected;
      }

      await telemetryService.ingestTelemetry({
        deviceId: dev.deviceId,
        buildingCode: dev.buildingCode,
        roomNumber: dev.roomNumber,
        sequence: dev.sequence,
        firmware: dev.firmware,
        isSimulated: true, // Marked as simulated
        metrics,
        timestamp: now,
      });
    }
  }
}

export const simulatorService = new SimulatorService();
