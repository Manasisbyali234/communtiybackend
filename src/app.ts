import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { config } from './config/index';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import { setupSwagger } from './docs/swagger';
import routes from './routes';

export function buildApp(): Application {
  const app = express();

  // 1. Request ID + Structured logging (first, so all logs have request context)
  app.use(requestLogger);

  // 2. Security & utility middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // needed for Swagger UI
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        },
      },
    }),
  );
  const corsOrigins = config.CORS_ORIGINS.trim();
  app.use(
    cors({
      origin: corsOrigins === '*' ? true : corsOrigins.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(compression());

  // 3. Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. API version header
  app.use((_req, res, next) => {
    res.setHeader('X-API-Version', config.API_VERSION);
    next();
  });

  // 5. Global rate limiting
  app.use(globalRateLimiter);

  // 6. Static uploads
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders(res, filePath) {
      const ext = path.extname(filePath).toLowerCase();
      const mime: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
      };
      if (mime[ext]) res.setHeader('Content-Type', mime[ext]);
    },
  }));

  // 7. Routes
  app.use('/api/v1', routes);

  // 7. Swagger / OpenAPI Docs
  setupSwagger(app);

  // 8. 404 & Error Handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
