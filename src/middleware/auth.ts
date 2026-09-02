import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { ApiError } from '../utils/ApiError';
import { JwtPayload } from '../types/index';
import { prisma } from '../config/database';

const isApprovalStatusRouteAllowed = (method: string, url: string) => {
  const cleanUrl = url.split('?')[0];
  return (
    cleanUrl.endsWith('/auth/verify-phone') ||
    cleanUrl.endsWith('/auth/resend-phone-otp') ||
    cleanUrl.endsWith('/auth/logout') ||
    (cleanUrl.endsWith('/users/me') && ['GET', 'PUT', 'DELETE'].includes(method))
  );
};

export async function auth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, approvalStatus: true, isActive: true, isBanned: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      return next(ApiError.unauthorized('Account not found'));
    }
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      const isApproved = user.approvalStatus === 'APPROVED' && user.isActive && !user.isBanned;
      if (!isApproved && !isApprovalStatusRouteAllowed(req.method, req.originalUrl)) {
        return next(ApiError.forbidden('Your profile is pending admin approval'));
      }
    } else if (!user.isActive || user.isBanned) {
      return next(ApiError.forbidden('Account is not active'));
    }
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired access token'));
  }
}

// Optional auth — attaches user if token present, continues without error if not
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(authHeader.slice(7), config.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch { /* ignore */ }
  next();
}
