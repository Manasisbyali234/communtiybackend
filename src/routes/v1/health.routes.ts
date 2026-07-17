import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

const startTime = Date.now();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const checks = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
    ]);

    const dbOk = checks[0].status === 'fulfilled';
    const redisOk = checks[1].status === 'fulfilled';

    const status = dbOk && redisOk ? 'healthy' : 'degraded';
    const httpStatus = status === 'healthy' ? 200 : 503;

    if (status === 'degraded') {
      logger.warn({ dbOk, redisOk }, 'Health check degraded');
    }

    res.status(httpStatus).json({
      status,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '1.0.0',
      checks: {
        database: dbOk ? 'ok' : 'error',
        redis: redisOk ? 'ok' : 'error',
      },
    });
  }),
);

// Liveness probe — just confirm the process is running
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness probe — confirm it can serve traffic
router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not ready', reason: 'Database unavailable' });
    }
  }),
);

export default router;
