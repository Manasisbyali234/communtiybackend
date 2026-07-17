import request from 'supertest';
import { buildApp } from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../../config/redis', () => ({
  redis: {
    ping: jest.fn(),
  },
}));

describe('Health Routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/health should return 200 when healthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/api/v1/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/v1/health should return 503 when degraded', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB Down'));
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/api/v1/health');
    
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
  });

  it('GET /api/v1/health/live should return 200', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('alive');
  });
});
