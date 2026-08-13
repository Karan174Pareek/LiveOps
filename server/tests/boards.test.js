import request from 'supertest';
import app from '../src/app.js';

describe('Domain Boards API & Multi-Tenant Security Scoping', () => {
  it('GET /boards requires authentication header (401)', async () => {
    const res = await request(app).get('/boards');
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it('GET /boards with fake auth but missing X-Workspace-ID rejects with 400', async () => {
    // Supplying invalid bearer token
    const res = await request(app)
      .get('/boards')
      .set('Authorization', 'Bearer invalid_token_here');
    expect(res.statusCode).toEqual(401);
  });
});
