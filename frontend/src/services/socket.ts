import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private isConnected = false;

  public connect(): Socket {
    if (this.socket && this.isConnected) return this.socket;

    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[Socket.IO Frontend] Connected to live streaming cluster');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('[Socket.IO Frontend] Disconnected from stream');
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public onTelemetry(callback: (data: any) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('telemetry:new', callback);
    return () => {
      this.socket?.off('telemetry:new', callback);
    };
  }

  public onAlert(callback: (alert: any) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('alert:new', callback);
    return () => {
      this.socket?.off('alert:new', callback);
    };
  }

  public onDeviceStatus(callback: (status: any) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('device:status', callback);
    return () => {
      this.socket?.off('device:status', callback);
    };
  }

  public onCommandAck(callback: (ack: any) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('command:ack', callback);
    return () => {
      this.socket?.off('command:ack', callback);
    };
  }
}

export const socketClient = new SocketClient();
