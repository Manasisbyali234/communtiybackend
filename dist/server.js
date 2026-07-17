"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const index_1 = require("./config/index");
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const index_2 = require("./sockets/index");
const index_3 = require("./jobs/index");
const app_1 = require("./app");
async function bootstrap() {
    try {
        // 1. Verify DB connection
        await database_1.prisma.$connect();
        logger_1.logger.info('Connected to PostgreSQL');
        // 2. Verify Redis connection
        await redis_1.redis.ping();
        logger_1.logger.info('Connected to Redis');
        // 3. Start BullMQ workers
        (0, index_3.initWorkers)();
        // 4. Build Express app & HTTP server
        const app = (0, app_1.buildApp)();
        const server = http_1.default.createServer(app);
        // 5. Attach Socket.io
        (0, index_2.initSocketServer)(server);
        // 6. Start listening
        server.listen(index_1.config.PORT, () => {
            logger_1.logger.info(`Server is running on http://localhost:${index_1.config.PORT}`);
        });
        // ── Graceful shutdown ──────────────────────────────────────────────────────
        const shutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                await database_1.prisma.$disconnect();
                await redis_1.redis.quit();
                process.exit(0);
            });
            // Force close if it takes too long
            setTimeout(() => {
                logger_1.logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to bootstrap server');
        process.exit(1);
    }
}
void bootstrap();
//# sourceMappingURL=server.js.map