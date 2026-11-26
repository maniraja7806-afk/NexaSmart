import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { socketManager } from './sockets/socketManager.js';
import { embeddedBroker } from './mqtt/broker.js';
import { mqttService } from './mqtt/client.js';
import { simulatorService } from './services/simulatorService.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('   NexaSmart – IoT Smart Campus & Building System   ');
  console.log('----------------------------------------------------');

  try {
    // 1. Database Connection
    await connectDatabase();
  } catch (err: any) {
    console.warn(`[Bootstrap Notice] Database connection deferred. Operating in standby mode.`);
  }

  // 2. HTTP Server & WebSocket Setup
  const server = http.createServer(app);
  socketManager.init(server, config.corsOrigin);

  // 3. Embedded MQTT Broker (if enabled)
  if (config.mqtt.embedded) {
    await embeddedBroker.start();
  }

  // 4. MQTT Client Ingestion Pipeline
  await mqttService.connect();

  // 5. Start Simulator (if enabled)
  if (config.simulator.enabled) {
    simulatorService.start(config.simulator.intervalMs);
  }

  // 6. Listen on configured port
  server.listen(config.port, config.host, () => {
    console.log(`[HTTP Server] NexaSmart API ready on http://${config.host}:${config.port}/api/v1`);
    console.log(`[Socket.IO] Real-time engine listening on port ${config.port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[NexaSmart] Shutting down gracefully...');
    simulatorService.pause();
    embeddedBroker.stop();
    server.close(() => {
      console.log('[NexaSmart] Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
