import { Request, Response, NextFunction } from 'express';
/**
 * Factory that returns an Express middleware logging admin/sensitive actions
 * to the AuditLog table.
 *
 * Usage:
 *   router.put('/users/:id/ban', auth, rbac('ADMIN'), audit('BAN_USER', 'User'), handler)
 */
export declare function audit(action: string, entityType?: string): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=audit.d.ts.map