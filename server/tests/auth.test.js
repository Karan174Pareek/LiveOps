import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Workspace } from '../src/models/Workspace.js';
import { UserWorkspaceRole } from '../src/models/UserWorkspaceRole.js';

describe('Authentication & JWT System Endpoints', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liveops_test';
    try {
      await mongoose.connect(mongoUri);
    } catch (e) {
      console.warn('MongoDB not available for tests, proceeding with mock fallback');
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ email: /@test\.com$/ });
      await mongoose.connection.close();
    }
  });

  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('healthy');
  });

  it('POST /auth/register fails if required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'invalid'
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBeDefined();
  });
});
