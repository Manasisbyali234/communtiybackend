"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audit = audit;
const database_1 = require("../config/database");
/**
 * Factory that returns an Express middleware logging admin/sensitive actions
 * to the AuditLog table.
 *
 * Usage:
 *   router.put('/users/:id/ban', auth, rbac('ADMIN'), audit('BAN_USER', 'User'), handler)
 */
function audit(action, entityType) {
    return async (req, _res, next) => {
        // Run after the route handler has been registered, but fire non-blocking
        const actorId = req.user?.id;
        if (!actorId)
            return next();
        const entityId = req.params['id'] ??
            req.params['uid'] ??
            undefined;
        // Fire-and-forget
        database_1.prisma.auditLog
            .create({
            data: {
                actorId,
                action,
                entityType: entityType ?? null,
                entityId: entityId ?? null,
                metadata: { body: req.body, query: req.query },
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
//# sourceMappingURL=audit.js.map