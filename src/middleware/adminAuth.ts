import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { config } from '../config';
import { JwtPayload } from '../types';

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
    if (session && session.expiresAt >= new Date()) {
      (req as any).adminId = session.adminId;
      return next();
    }
    if (session?.expiresAt < new Date()) {
      logger.warn({ url: req.originalUrl, expiresAt: session.expiresAt }, 'Admin session has expired');
    }

    // Native clients already hold the normal user JWT. Accept it only when it
    // belongs to an active administrator, avoiding a second token race.
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    if (payload.role !== 'ADMIN') return next(ApiError.forbidden('Administrator access required'));
    const admin = await prisma.user.findFirst({
      where: { id: payload.sub, role: 'ADMIN', isActive: true, isBanned: false, deletedAt: null },
      select: { id: true },
    });
    if (!admin) return next(ApiError.forbidden('Administrator access required'));
    (req as any).adminId = admin.id;
    next();
  } catch (error) {
    logger.error({ error, url: req.originalUrl }, 'Admin session validation failed');
    next(ApiError.unauthorized('Admin auth failed'));
  }
}
