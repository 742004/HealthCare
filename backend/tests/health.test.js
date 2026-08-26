import request from 'supertest';
import app from '../src/app.js';

describe('Health and Readiness Probes', () => {
  it('GET /healthz should return 200 OK', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('GET /readyz should return 200 with JSON status', async () => {
    const res = await request(app).get('/readyz');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('message', 'Ready to accept traffic');
  });

  it('GET /api/v1/health should return 200 with JSON status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
  });
});
