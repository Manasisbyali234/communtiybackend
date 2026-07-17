"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueDepth = exports.activeSockets = exports.httpRequestTotal = exports.httpRequestDuration = void 0;
const express_1 = require("express");
const prom_client_1 = __importDefault(require("prom-client"));
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
// Create a registry
const register = new prom_client_1.default.Registry();
// Default metrics (process CPU, memory, etc.)
prom_client_1.default.collectDefaultMetrics({ register });
// Custom metrics
exports.httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
});
exports.httpRequestTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});
exports.activeSockets = new prom_client_1.default.Gauge({
    name: 'active_websocket_connections',
    help: 'Number of active WebSocket connections',
    registers: [register],
});
exports.queueDepth = new prom_client_1.default.Gauge({
    name: 'bullmq_queue_depth',
    help: 'Number of waiting jobs per queue',
    labelNames: ['queue'],
    registers: [register],
});
const router = (0, express_1.Router)();
// Prometheus scrape endpoint — protected by ADMIN role in production
router.get('/', auth_1.auth, (0, rbac_1.rbac)('ADMIN'), async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
exports.default = router;
//# sourceMappingURL=metrics.routes.js.map