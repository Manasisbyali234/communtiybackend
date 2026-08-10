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

  // Trust proxy (required when behind nginx/load balancer)
  app.set('trust proxy', 1);

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

  // Root health check
  app.get('/', (_req, res) => {
    res.json({ success: true, message: 'Community API is running', version: config.API_VERSION, docs: '/api-docs' });
  });

  // APK download landing page
  app.get('/download', (req, res) => {
    const ref = req.query.ref ? `?ref=${req.query.ref}` : '';
    const APK_URL = 'https://community-api.metromindz.com/uploads/app-release.apk';
    const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mmdevteam.communityapp';
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Download GowdaCommunity</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border-radius: 24px; padding: 40px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.10); }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 26px; font-weight: 800; color: #1a2d1a; margin-bottom: 8px; }
    p { color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 24px; border-radius: 50px; text-decoration: none; font-size: 16px; font-weight: 700; margin-bottom: 12px; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.88; }
    .btn-primary { background: #2D6A2D; color: #fff; }
    .btn-secondary { background: #f0f0f0; color: #1a2d1a; }
    .features { text-align: left; margin-top: 24px; border-top: 1px solid #eee; padding-top: 20px; display: flex; flex-direction: column; gap: 10px; }
    .feature { display: flex; align-items: center; gap: 10px; color: #444; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🌿</div>
    <h1>GowdaCommunity</h1>
    <p>Connect with family &amp; community members, stay updated on events, and more.</p>
    <a href="${APK_URL}${ref}" class="btn btn-primary">⬇️ Download APK (Android)</a>
    <a href="${PLAY_STORE_URL}" class="btn btn-secondary">▶ Google Play Store</a>
    <div class="features">
      <div class="feature">👥 Connect with family &amp; community</div>
      <div class="feature">📅 Stay updated on local events</div>
      <div class="feature">💬 Chat and share with your network</div>
      <div class="feature">🌾 Access market rates &amp; farming tools</div>
    </div>
  </div>
</body>
</html>`);
  });

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
