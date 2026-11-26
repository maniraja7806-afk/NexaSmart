import { Router } from 'express';
import { getLatestTelemetry, getHistoricalTelemetry, ingestTelemetryDirect } from '../controllers/telemetryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/latest', authenticate, getLatestTelemetry);
router.get('/history', authenticate, getHistoricalTelemetry);
router.post('/ingest', ingestTelemetryDirect); // Direct telemetry intake endpoint

export default router;
