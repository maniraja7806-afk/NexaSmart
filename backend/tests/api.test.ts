import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index';

describe('NexaSmart Core REST API & RBAC Suite', () => {
  let superAdminToken: string;
  let viewerToken: string;

  beforeAll(() => {
    // Generate valid mock JWT tokens for RBAC tests
    superAdminToken = jwt.sign(
      {
        userId: 'usr_super_admin_test',
        email: 'superadmin@nexasmart.io',
        role: 'Super Admin',
        name: 'Super Admin Test',
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      {
        userId: 'usr_viewer_test',
        email: 'viewer@nexasmart.io',
        role: 'Viewer',
        name: 'Viewer Test',
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  it('GET /api/v1/health should return system status healthy and uptime', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.system).toBe('NexaSmart IoT Core Engine');
  });

  it('POST /api/v1/devices should reject unauthenticated requests', async () => {
    const res = await request(app).post('/api/v1/devices').send({
      deviceId: 'TEST-DEV-01',
      name: 'Unauth Test',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/devices/:id/command should strictly block Viewer role from issuing commands', async () => {
    const res = await request(app)
      .post('/api/v1/devices/DEV-ESP32-LGT-01/command')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ action: 'SET_RELAY', value: 1 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Viewers are not permitted to issue device control commands');
  });

  it('POST /api/v1/auth/login should reject invalid credentials gracefully', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent_user@nexasmart.io',
      password: 'WrongPassword123!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/simulator/status should return simulator state', async () => {
    const res = await request(app)
      .get('/api/v1/simulator/status')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('isRunning');
    expect(res.body.data).toHaveProperty('deviceCount');
  });
});
