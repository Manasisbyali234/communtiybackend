import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Factory that returns an Express middleware logging admin/sensitive actions
 * to the AuditLog table.
 *
 * Usage:
 *   router.put('/users/:id/ban', auth, rbac('ADMIN'), audit('BAN_USER', 'User'), handler)
 */
export function audit(action: string, entityType?: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run after the route handler has been registered, but fire non-blocking
    const actorId = req.user?.id;
    if (!actorId) return next();

    const entityId =
      (req.params['id'] as string | undefined) ??
      (req.params['uid'] as string | undefined) ??
      undefined;

    // Fire-and-forget
    prisma.auditLog
      .create({
        data: {
          actorId,
          action,
          entityType: entityType ?? null,
          entityId: entityId ?? null,
          metadata: { body: req.body, query: req.query } as object,
          ipAddress: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
      })
      .catch(() => {
        // Non-blocking — don't break the request if audit fails
      });

    next();
  };
}
