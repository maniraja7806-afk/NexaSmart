import net from 'net';
import Aedes from 'aedes';
import { config } from '../config/index.js';

class EmbeddedMqttBroker {
  private aedesInstance: any = null;
  private server: net.Server | null = null;
  private isRunning = false;

  public async start(): Promise<void> {
    if (this.isRunning) return;

    return new Promise((resolve) => {
      try {
        this.aedesInstance = new Aedes();
        this.server = net.createServer(this.aedesInstance.handle);

        this.aedesInstance.on('client', (client: any) => {
          console.log(`[Embedded MQTT Broker] Client connected: ${client ? client.id : 'unknown'}`);
        });

        this.aedesInstance.on('clientDisconnect', (client: any) => {
          console.log(`[Embedded MQTT Broker] Client disconnected: ${client ? client.id : 'unknown'}`);
        });

        this.server.listen(config.mqtt.brokerPort, () => {
          this.isRunning = true;
          console.log(`[Embedded MQTT Broker] Broker listening on TCP port ${config.mqtt.brokerPort}`);
          resolve();
        });

        this.server.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`[Embedded MQTT Broker] Port ${config.mqtt.brokerPort} is already in use (External Mosquitto is active). Will connect as client.`);
          } else {
            console.warn(`[Embedded MQTT Broker Error]`, err.message);
          }
          resolve();
        });
      } catch (err: any) {
        console.warn(`[Embedded MQTT Broker] Could not start embedded broker: ${err.message}`);
        resolve();
      }
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.isRunning = false;
    }
  }
}

export const embeddedBroker = new EmbeddedMqttBroker();
