import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export async function adminAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing admin token'));
  }
  const token = authHeader.slice(7);
  try {
    const session = await prisma.adminSession.findUnique({
      where: { token },
    });
    if (!session) {
      logger.warn({ url: req.originalUrl }, 'Admin session token was not found');
      return next(ApiError.unauthorized('Invalid or expired admin session'));
    }
    if (session.expiresAt < new Date()) {
      logger.warn({ url: req.originalUrl, expiresAt: session.expiresAt }, 'Admin session has expired');
      return next(ApiError.unauthorized('Invalid or expired admin session'));
    }
    // Attach adminId to request for downstream use
    (req as any).adminId = session.adminId;
    next();
  } catch (error) {
    logger.error({ error, url: req.originalUrl }, 'Admin session validation failed');
    next(ApiError.unauthorized('Admin auth failed'));
  }
}
