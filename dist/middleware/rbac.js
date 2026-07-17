"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbac = rbac;
const ApiError_1 = require("../utils/ApiError");
/**
 * Role guard factory.
 * Usage: router.delete('/:id', auth, rbac('ADMIN'), controller)
 */
function rbac(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            throw ApiError_1.ApiError.unauthorized();
        }
        if (!roles.includes(req.user.role)) {
            throw ApiError_1.ApiError.forbidden(`Requires role: ${roles.join(' or ')}`);
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map