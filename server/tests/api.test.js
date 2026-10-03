import request from 'supertest';
import app from '../src/app.js';

describe('API error and public auth handling', () => {
  it('serves a health response without a database session', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
  });
  it('rejects unauthenticated access to admin APIs', async () => {
    const response = await request(app).get('/api/admin/dashboard');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
  it('returns a consistent 404 response for unknown routes', async () => {
    const response = await request(app).get('/api/missing');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, message: 'Route not found' });
  });
});
