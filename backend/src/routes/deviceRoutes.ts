import { Router } from 'express';
import {
  getDevices,
  getDeviceById,
  registerDevice,
  updateDevice,
  deleteDevice,
  sendDeviceCommand,
  rotateDeviceKey,
} from '../controllers/deviceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, preventViewerControl } from '../middleware/rbac.js';

const router = Router();

router.get('/', authenticate, getDevices);
router.get('/:id', authenticate, getDeviceById);
router.post('/', authenticate, requireRole('Facility Manager', 'Campus Administrator'), registerDevice);
router.patch('/:id', authenticate, requireRole('Facility Manager', 'Maintenance Technician', 'Campus Administrator'), updateDevice);
router.delete('/:id', authenticate, requireRole('Super Admin', 'Campus Administrator'), deleteDevice);

// Control endpoints - Viewers strictly blocked!
router.post('/:id/command', authenticate, preventViewerControl, sendDeviceCommand);
router.post('/:id/rotate-key', authenticate, requireRole('Campus Administrator'), rotateDeviceKey);

export default router;
