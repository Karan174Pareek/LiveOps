import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';

describe('Production Health & Authentication Endpoints', () => {
  it('GET /health returns status 200 OK and healthy state', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('POST /auth/register rejects missing payload fields with 400', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('POST /auth/login rejects invalid credentials with 400/401', async () => {
    jest.spyOn(User, 'findOne').mockImplementationOnce(() => Promise.resolve(null));
    const res = await request(app).post('/auth/login').send({
      email: 'nonexistent@company.com',
      password: 'wrongpassword'
    });
    expect([400, 401]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
    User.findOne.mockRestore();
  });

  it('POST /auth/refresh rejects request without refresh token cookie with 401', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBeDefined();
  });
});
