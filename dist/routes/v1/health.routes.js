"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const redis_1 = require("../../config/redis");
const logger_1 = require("../../config/logger");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
const startTime = Date.now();
router.get('/', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const checks = await Promise.allSettled([
        database_1.prisma.$queryRaw `SELECT 1`,
        redis_1.redis.ping(),
    ]);
    const dbOk = checks[0].status === 'fulfilled';
    const redisOk = checks[1].status === 'fulfilled';
    const status = dbOk && redisOk ? 'healthy' : 'degraded';
    const httpStatus = status === 'healthy' ? 200 : 503;
    if (status === 'degraded') {
        logger_1.logger.warn({ dbOk, redisOk }, 'Health check degraded');
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
}));
// Liveness probe — just confirm the process is running
router.get('/live', (_req, res) => {
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
});
// Readiness probe — confirm it can serve traffic
router.get('/ready', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ready' });
    }
    catch {
        res.status(503).json({ status: 'not ready', reason: 'Database unavailable' });
    }
}));
exports.default = router;
//# sourceMappingURL=health.routes.js.map