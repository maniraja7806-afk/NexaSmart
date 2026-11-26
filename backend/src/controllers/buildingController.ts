import { Request, Response, NextFunction } from 'express';
import { Building, Floor, Room, Device } from '../models/index.js';

// Buildings
export async function getBuildings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const buildings = await Building.find().sort({ code: 1 });
    res.json({ success: true, count: buildings.length, data: buildings });
  } catch (err) {
    next(err);
  }
}

export async function getBuildingById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      res.status(404).json({ success: false, error: 'Building not found' });
      return;
    }
    const floors = await Floor.find({ buildingId: building._id }).sort({ floorNumber: 1 });
    const rooms = await Room.find({ buildingId: building._id }).sort({ roomNumber: 1 });
    const devices = await Device.find({ buildingCode: building.code });

    res.json({
      success: true,
      data: {
        ...building.toObject(),
        floors,
        rooms,
        devicesCount: devices.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const building = new Building(req.body);
    await building.save();
    res.status(201).json({ success: true, data: building });
  } catch (err) {
    next(err);
  }
}

export async function updateBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const building = await Building.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!building) {
      res.status(404).json({ success: false, error: 'Building not found' });
      return;
    }
    res.json({ success: true, data: building });
  } catch (err) {
    next(err);
  }
}

export async function deleteBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const building = await Building.findByIdAndDelete(req.params.id);
    if (!building) {
      res.status(404).json({ success: false, error: 'Building not found' });
      return;
    }
    res.json({ success: true, message: 'Building removed' });
  } catch (err) {
    next(err);
  }
}

// Floors
export async function getFloors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: any = {};
    if (req.query.buildingId) filter.buildingId = req.query.buildingId;
    if (req.query.buildingCode) filter.buildingCode = (req.query.buildingCode as string).toUpperCase();

    const floors = await Floor.find(filter).sort({ floorNumber: 1 });
    res.json({ success: true, count: floors.length, data: floors });
  } catch (err) {
    next(err);
  }
}

export async function createFloor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const floor = new Floor(req.body);
    await floor.save();
    res.status(201).json({ success: true, data: floor });
  } catch (err) {
    next(err);
  }
}

// Rooms
export async function getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: any = {};
    if (req.query.buildingId) filter.buildingId = req.query.buildingId;
    if (req.query.buildingCode) filter.buildingCode = (req.query.buildingCode as string).toUpperCase();
    if (req.query.floorNumber) filter.floorNumber = parseInt(req.query.floorNumber as string, 10);
    if (req.query.type) filter.type = req.query.type;

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) {
      res.status(404).json({ success: false, error: 'Room not found' });
      return;
    }
    res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}
