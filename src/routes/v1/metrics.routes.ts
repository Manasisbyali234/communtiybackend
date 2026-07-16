import { Router, Request, Response } from 'express';
import client from 'prom-client';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

// Create a registry
const register = new client.Registry();

// Default metrics (process CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeSockets = new client.Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const queueDepth = new client.Gauge({
  name: 'bullmq_queue_depth',
  help: 'Number of waiting jobs per queue',
  labelNames: ['queue'],
  registers: [register],
});

const router = Router();

// Prometheus scrape endpoint — protected by ADMIN role in production
router.get('/', auth, rbac('ADMIN'), async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
