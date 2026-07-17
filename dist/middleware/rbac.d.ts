import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
/**
 * Role guard factory.
 * Usage: router.delete('/:id', auth, rbac('ADMIN'), controller)
 */
export declare function rbac(...roles: Role[]): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map