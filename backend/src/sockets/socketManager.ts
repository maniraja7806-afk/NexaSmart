import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

class SocketManager {
  private io: SocketIOServer | null = null;

  public init(server: HttpServer, corsOrigin: string): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      socket.on('join:building', (buildingCode: string) => {
        socket.join(`building:${buildingCode}`);
        console.log(`[Socket.IO] Client ${socket.id} joined building:${buildingCode}`);
      });

      socket.on('leave:building', (buildingCode: string) => {
        socket.leave(`building:${buildingCode}`);
      });

      socket.on('join:device', (deviceId: string) => {
        socket.join(`device:${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO is not initialized yet');
    }
    return this.io;
  }

  public broadcastTelemetry(data: any): void {
    if (!this.io) return;
    this.io.emit('telemetry:new', data);
    if (data.buildingCode) {
      this.io.to(`building:${data.buildingCode}`).emit('building:telemetry', data);
    }
    if (data.deviceId) {
      this.io.to(`device:${data.deviceId}`).emit('device:telemetry', data);
    }
  }

  public broadcastDeviceStatus(data: any): void {
    if (!this.io) return;
    this.io.emit('device:status', data);
  }

  public broadcastAlert(alert: any): void {
    if (!this.io) return;
    this.io.emit('alert:new', alert);
  }

  public broadcastCommandAck(ackData: any): void {
    if (!this.io) return;
    this.io.emit('command:ack', ackData);
  }
}

export const socketManager = new SocketManager();
