import http from 'http';
import { config } from './config/index';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { verifyS3Access } from './config/storage';
import { initSocketServer } from './sockets/index';
import { initWorkers } from './jobs/index';
import { buildApp } from './app';

async function bootstrap() {
  try {
    // 1. Verify DB connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    // 2. Verify Redis connection
    await redis.ping();
    logger.info('Connected to Redis');

    // 3. Verify S3 credentials & bucket access
    await verifyS3Access();

    // 4. Start BullMQ workers
    initWorkers();

    // 5. Build Express app & HTTP server
    const app = buildApp();
    const server = http.createServer(app);

    // 6. Attach Socket.io
    initSocketServer(server);

    // 7. Start listening
    server.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`Server is running on http://0.0.0.0:${config.PORT}`);
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        await redis.quit();
        process.exit(0);
      });

      // Force close if it takes too long
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, 'Failed to bootstrap server');
    process.exit(1);
  }
}

void bootstrap();
