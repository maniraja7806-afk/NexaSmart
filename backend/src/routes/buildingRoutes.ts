import { Router } from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getFloors,
  createFloor,
  getRooms,
  createRoom,
  updateRoom,
} from '../controllers/buildingController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Buildings
router.get('/buildings', authenticate, getBuildings);
router.get('/buildings/:id', authenticate, getBuildingById);
router.post('/buildings', authenticate, requireRole('Campus Administrator'), createBuilding);
router.patch('/buildings/:id', authenticate, requireRole('Campus Administrator'), updateBuilding);
router.delete('/buildings/:id', authenticate, requireRole('Super Admin'), deleteBuilding);

// Floors
router.get('/floors', authenticate, getFloors);
router.post('/floors', authenticate, requireRole('Campus Administrator'), createFloor);

// Rooms
router.get('/rooms', authenticate, getRooms);
router.post('/rooms', authenticate, requireRole('Campus Administrator'), createRoom);
router.patch('/rooms/:id', authenticate, requireRole('Facility Manager', 'Campus Administrator'), updateRoom);

export default router;
