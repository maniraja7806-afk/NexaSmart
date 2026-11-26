import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`[Database] MongoDB Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (err: any) {
    console.warn(`[Database Warning] Unable to connect to MongoDB at ${config.mongoUri}: ${err.message}`);
    console.warn(`[Database Note] Ensure MongoDB is running locally or set MONGODB_URI to MongoDB Atlas in .env`);
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
