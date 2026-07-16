"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../config/logger");
const index_1 = require("../config/index");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    // ── Known typed ApiError ───────────────────────────────────────────────────
    if (err instanceof ApiError_1.ApiError) {
        res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors,
        });
        return;
    }
    // ── Zod validation errors ──────────────────────────────────────────────────
    if (err instanceof zod_1.ZodError) {
        const errors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Validation failed',
            errors,
        });
        return;
    }
    // ── Prisma known errors ────────────────────────────────────────────────────
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const field = Array.isArray(err.meta?.['target'])
                ? (err.meta?.['target']).join(', ')
                : 'field';
            res.status(409).json({
                success: false,
                statusCode: 409,
                message: `Duplicate value for unique ${field}`,
                errors: [],
            });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: 'Record not found',
                errors: [],
            });
            return;
        }
    }
    // ── Unknown / unexpected error ─────────────────────────────────────────────
    logger_1.logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
    res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
        errors: index_1.config.NODE_ENV !== 'production' && err instanceof Error ? [err.message] : [],
    });
}
//# sourceMappingURL=errorHandler.js.map