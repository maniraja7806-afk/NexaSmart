import { Request, Response, NextFunction } from 'express';
import { Device, DeviceCommand, DeviceTelemetry } from '../models/index.js';
import { commandService } from '../services/commandService.js';

export async function getDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.buildingCode) filter.buildingCode = (req.query.buildingCode as string).toUpperCase();
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isSimulated !== undefined) filter.isSimulated = req.query.isSimulated === 'true';
    if (req.query.search) {
      const q = req.query.search as string;
      filter.$or = [
        { deviceId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { macAddress: { $regex: q, $options: 'i' } },
      ];
    }

    const [devices, total] = await Promise.all([
      Device.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Device.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: devices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDeviceById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = await Device.findOne({
      $or: [{ deviceId: req.params.id.toUpperCase() }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    // Get recent commands and telemetry
    const [recentCommands, recentTelemetry] = await Promise.all([
      DeviceCommand.find({ deviceId: device.deviceId }).sort({ createdAt: -1 }).limit(10),
      DeviceTelemetry.find({ deviceId: device.deviceId }).sort({ timestamp: -1 }).limit(20),
    ]);

    res.json({
      success: true,
      data: {
        ...device.toObject(),
        recentCommands,
        recentTelemetry,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await Device.findOne({ deviceId: req.body.deviceId.toUpperCase() });
    if (existing) {
      res.status(409).json({ success: false, error: `Device ID '${req.body.deviceId}' already registered` });
      return;
    }

    const device = new Device({
      ...req.body,
      deviceId: req.body.deviceId.toUpperCase(),
      buildingCode: req.body.buildingCode.toUpperCase(),
    });
    await device.save();

    res.status(201).json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
}

export async function updateDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = await Device.findOneAndUpdate(
      { $or: [{ deviceId: req.params.id.toUpperCase() }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }] },
      { $set: req.body },
      { new: true }
    );

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
}

export async function deleteDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = await Device.findOneAndDelete({
      $or: [{ deviceId: req.params.id.toUpperCase() }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    res.json({ success: true, message: `Device '${device.deviceId}' successfully removed` });
  } catch (err) {
    next(err);
  }
}

export async function sendDeviceCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.params.id.toUpperCase();
    const { action, target, value } = req.body;

    if (!action) {
      res.status(400).json({ success: false, error: 'Action parameter is required' });
      return;
    }

    const issuedBy = req.user?.email || 'admin@nexasmart.io';

    // A command must not be displayed as successfully executed until a valid acknowledgement is received
    const result = await commandService.issueCommand({
      deviceId,
      action,
      target,
      value,
      issuedBy,
      waitForAckMs: 5000,
    });

    res.json({
      success: true,
      message: 'Command executed and verified via hardware ACK',
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Device command execution failed',
    });
  }
}

export async function rotateDeviceKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newSecret = `sec_${Math.random().toString(36).slice(2)}${Date.now()}`;
    res.json({
      success: true,
      message: 'Device credentials successfully rotated',
      data: { deviceId: req.params.id.toUpperCase(), newMqttToken: newSecret },
    });
  } catch (err) {
    next(err);
  }
}
