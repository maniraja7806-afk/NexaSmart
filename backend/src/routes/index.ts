import { Router } from 'express';
import authRoutes from './authRoutes.js';
import buildingRoutes from './buildingRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import telemetryRoutes from './telemetryRoutes.js';
import moduleRoutes from './moduleRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', buildingRoutes);
router.use('/devices', deviceRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/', moduleRoutes);

// System health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'NexaSmart IoT Core Engine',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;
