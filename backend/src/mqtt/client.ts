import mqtt, { MqttClient } from 'mqtt';
import { config } from '../config/index.js';
import { telemetryService } from '../services/telemetryService.js';
import { commandService } from '../services/commandService.js';
import { simulatorService } from '../services/simulatorService.js';
import { Device, AccessRecord, SafetyIncident } from '../models/index.js';
import { socketManager } from '../sockets/socketManager.js';

class MqttService {
  private client: MqttClient | null = null;
  private isConnected = false;

  public connect(): Promise<void> {
    return new Promise((resolve) => {
      console.log(`[MQTT Service] Connecting to broker at ${config.mqtt.url}...`);

      this.client = mqtt.connect(config.mqtt.url, {
        clientId: `${config.mqtt.clientId}_${Math.random().toString(16).slice(2, 8)}`,
        reconnectPeriod: 3000,
        connectTimeout: 5000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[MQTT Service] Successfully connected to MQTT Broker!');

        // Subscribe to all NexaSmart hierarchical channels
        this.client?.subscribe('nexasmart/#', { qos: 1 }, (err) => {
          if (err) {
            console.error('[MQTT Service] Subscription error:', err);
          } else {
            console.log('[MQTT Service] Subscribed to pattern: nexasmart/#');
          }
        });

        resolve();
      });

      this.client.on('message', async (topic: string, messageBuffer: Buffer) => {
        try {
          const payloadStr = messageBuffer.toString();
          const data = JSON.parse(payloadStr);
          await this.routeIncomingMessage(topic, data);
        } catch (err: any) {
          console.warn(`[MQTT Service] Invalid JSON on topic ${topic}:`, err.message);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[MQTT Service Error]:', err.message);
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        console.log('[MQTT Service] Broker went offline, awaiting reconnect...');
      });
    });
  }

  public publish(topic: string, payload: string): void {
    if (this.client && this.isConnected) {
      this.client.publish(topic, payload, { qos: 1 });
    } else {
      console.warn(`[MQTT Service] Cannot publish to ${topic}: Client not connected to broker`);
    }
  }

  private async routeIncomingMessage(topic: string, payload: any): Promise<void> {
    // Topic format: nexasmart/{buildingId}/{roomId}/{deviceId}/{channel}
    const parts = topic.split('/');
    if (parts.length < 5) return;

    const [root, buildingId, roomId, deviceId, channel] = parts;

    switch (channel) {
      case 'telemetry': {
        await telemetryService.ingestTelemetry({
          ...payload,
          deviceId: payload.deviceId || deviceId,
          buildingCode: payload.buildingCode || buildingId,
          roomNumber: payload.roomNumber || roomId,
        });
        break;
      }

      case 'ack': {
        await commandService.handleAck(payload);
        break;
      }

      case 'status': {
        await Device.findOneAndUpdate(
          { deviceId: deviceId.toUpperCase() },
          {
            $set: {
              status: payload.status === 'ONLINE' ? 'Online' : 'Offline',
              lastSeenAt: new Date(),
              ipAddress: payload.ip,
              macAddress: payload.mac || 'UNKNOWN',
              rssi: payload.rssi,
              firmwareVersion: payload.firmware || 'v1.4.2',
            },
          }
        );
        socketManager.broadcastDeviceStatus({
          deviceId: deviceId.toUpperCase(),
          status: payload.status,
          rssi: payload.rssi,
        });
        break;
      }

      case 'command': {
        // Intercept for simulator if device is simulated
        if (payload.deviceId && payload.deviceId.includes('SIM')) {
          simulatorService.handleSimulatedCommand(
            payload.commandId,
            payload.deviceId,
            payload.action,
            payload.value
          );
        }
        break;
      }

      case 'event': {
        if (payload.eventType === 'RFID_TAP') {
          await AccessRecord.create({
            cardUid: payload.cardUid,
            userName: payload.userName || 'Enrolled Personnel',
            userRole: payload.userRole || 'Staff',
            deviceId: deviceId.toUpperCase(),
            buildingCode: buildingId.toUpperCase(),
            zoneName: roomId,
            accessGranted: true,
            timestamp: new Date(),
          });
        } else if (payload.eventType === 'FLAME_DETECTED' || payload.eventType === 'SMOKE_DETECTED') {
          await SafetyIncident.create({
            incidentId: `INC-${Date.now().toString(36).toUpperCase()}`,
            buildingCode: buildingId.toUpperCase(),
            roomNumber: roomId,
            eventType: payload.eventType === 'FLAME_DETECTED' ? 'FLAME' : 'SMOKE',
            severity: 'CRITICAL',
            status: 'ACTIVE',
            sensorReading: payload.smokeLevel,
            acknowledged: false,
          });
        }
        break;
      }
    }
  }
}

export const mqttService = new MqttService();
