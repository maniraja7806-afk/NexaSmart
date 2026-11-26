import { randomUUID } from 'crypto';
import { Device, DeviceCommand } from '../models/index.js';
import { mqttService } from '../mqtt/client.js';
import { socketManager } from '../sockets/socketManager.js';

interface PendingAckPromise {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutHandle: NodeJS.Timeout;
}

class CommandService {
  private pendingAcks = new Map<string, PendingAckPromise>();

  public async issueCommand(params: {
    deviceId: string;
    action: string;
    target?: string;
    value?: any;
    issuedBy: string;
    waitForAckMs?: number;
  }): Promise<any> {
    const { deviceId, action, target, value, issuedBy, waitForAckMs = 5000 } = params;

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      throw new Error(`Device '${deviceId}' not found`);
    }

    if (device.maintenanceStatus === 'MAINTENANCE_IN_PROGRESS') {
      throw new Error(`Device '${deviceId}' is currently undergoing maintenance. Actuation is locked.`);
    }

    const commandId = `cmd_${randomUUID()}`;

    // 1. Persist initial command status
    const cmdRecord = new DeviceCommand({
      commandId,
      deviceId: device.deviceId,
      buildingCode: device.buildingCode,
      action,
      target,
      value,
      status: 'SENT',
      issuedBy,
      issuedAt: new Date(),
    });
    await cmdRecord.save();

    // 2. Publish MQTT command
    const topic = `nexasmart/${device.buildingCode}/${device.roomNumber || 'GEN'}/${device.deviceId}/command`;
    const payload = {
      commandId,
      deviceId: device.deviceId,
      action,
      target,
      value,
      issuedBy,
      issuedAt: new Date().toISOString(),
    };

    mqttService.publish(topic, JSON.stringify(payload));

    // 3. Wait for hardware or simulator ACK
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(async () => {
        this.pendingAcks.delete(commandId);
        await DeviceCommand.findOneAndUpdate(
          { commandId },
          { $set: { status: 'TIMEOUT', errorMessage: 'Device ACK timeout (5000ms exceeded)' } }
        );
        reject(new Error(`Command timed out: Device '${deviceId}' did not acknowledge execution in 5 seconds`));
      }, waitForAckMs);

      this.pendingAcks.set(commandId, { resolve, reject, timeoutHandle });
    });
  }

  public async handleAck(ackPayload: {
    commandId: string;
    deviceId: string;
    status: string;
    state?: any;
    executedAt?: any;
    errorMessage?: string;
  }): Promise<void> {
    const { commandId, status, state, errorMessage } = ackPayload;

    const isSuccess = status === 'SUCCESS';
    const finalStatus = isSuccess ? 'SUCCESS' : 'FAILED';

    const updatedCmd = await DeviceCommand.findOneAndUpdate(
      { commandId },
      {
        $set: {
          status: finalStatus,
          executedAt: new Date(),
          ackPayload: state || {},
          errorMessage: errorMessage || null,
        },
      },
      { new: true }
    );

    // If device state was altered, reflect in device latestMetrics
    if (isSuccess && state && updatedCmd) {
      await Device.findOneAndUpdate(
        { deviceId: updatedCmd.deviceId },
        { $set: { 'latestMetrics.actuatorState': state } }
      );
    }

    socketManager.broadcastCommandAck({
      commandId,
      status: finalStatus,
      state,
      errorMessage,
    });

    const pending = this.pendingAcks.get(commandId);
    if (pending) {
      clearTimeout(pending.timeoutHandle);
      this.pendingAcks.delete(commandId);
      if (isSuccess) {
        pending.resolve(updatedCmd);
      } else {
        pending.reject(new Error(errorMessage || 'Device rejected command'));
      }
    }
  }
}

export const commandService = new CommandService();
