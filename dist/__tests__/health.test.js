"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const database_1 = require("../../config/database");
const redis_1 = require("../../config/redis");
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
    const app = (0, app_1.buildApp)();
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('GET /api/v1/health should return 200 when healthy', async () => {
        database_1.prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
        redis_1.redis.ping.mockResolvedValue('PONG');
        const res = await (0, supertest_1.default)(app).get('/api/v1/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
    });
    it('GET /api/v1/health should return 503 when degraded', async () => {
        database_1.prisma.$queryRaw.mockRejectedValue(new Error('DB Down'));
        redis_1.redis.ping.mockResolvedValue('PONG');
        const res = await (0, supertest_1.default)(app).get('/api/v1/health');
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('degraded');
    });
    it('GET /api/v1/health/live should return 200', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/health/live');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('alive');
    });
});
//# sourceMappingURL=health.test.js.map