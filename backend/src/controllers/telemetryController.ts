import { Request, Response, NextFunction } from 'express';
import { DeviceTelemetry, Device } from '../models/index.js';
import { telemetryService } from '../services/telemetryService.js';

export async function getLatestTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: any = {};
    if (req.query.buildingCode) filter.buildingCode = (req.query.buildingCode as string).toUpperCase();

    const devices = await Device.find(filter).select('deviceId name type buildingCode roomNumber status isSimulated latestMetrics lastSeenAt');
    res.json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    next(err);
  }
}

export async function getHistoricalTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceId, from, to, limit = '100' } = req.query;
    const filter: any = {};

    if (deviceId) filter.deviceId = (deviceId as string).toUpperCase();
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from as string);
      if (to) filter.timestamp.$lte = new Date(to as string);
    }

    const records = await DeviceTelemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit as string, 10), 1000));

    res.json({
      success: true,
      count: records.length,
      data: records.reverse(), // Chronological order
    });
  } catch (err) {
    next(err);
  }
}

export async function ingestTelemetryDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await telemetryService.ingestTelemetry(req.body);
    res.status(202).json({ success: true, message: 'Telemetry queued for processing' });
  } catch (err) {
    next(err);
  }
}
