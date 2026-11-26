import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexasmart',
  jwtSecret: process.env.JWT_SECRET || 'nexasmart_dev_jwt_secret_super_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'nexasmart_dev_jwt_refresh_secret_key_2026',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  mqtt: {
    embedded: process.env.EMBEDDED_MQTT !== 'false',
    brokerPort: parseInt(process.env.MQTT_BROKER_PORT || '1883', 10),
    wsPort: parseInt(process.env.MQTT_WS_PORT || '8883', 10),
    url: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    clientId: process.env.MQTT_CLIENT_ID || 'nexasmart-core-engine',
    username: process.env.MQTT_USERNAME || 'nexasmart_server',
    password: process.env.MQTT_PASSWORD || 'server_mqtt_secure_pass_2026',
  },
  tariffs: {
    electricityRatePerKwh: parseFloat(process.env.ELECTRICITY_RATE_PER_KWH || '0.15'),
    waterRatePerLiter: parseFloat(process.env.WATER_RATE_PER_LITER || '0.002'),
  },
  simulator: {
    enabled: process.env.SIMULATOR_ENABLED !== 'false',
    intervalMs: parseInt(process.env.SIMULATOR_INTERVAL_MS || '3000', 10),
  },
};
