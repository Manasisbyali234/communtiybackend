"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    errors;
    constructor(statusCode, message, errors = [], stack) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    static badRequest(msg) {
        return new ApiError(400, msg);
    }
    static unauthorized(msg = 'Unauthorized') {
        return new ApiError(401, msg);
    }
    static forbidden(msg = 'Forbidden') {
        return new ApiError(403, msg);
    }
    static notFound(msg) {
        return new ApiError(404, msg);
    }
    static conflict(msg) {
        return new ApiError(409, msg);
    }
    static internal(msg = 'Internal server error') {
        return new ApiError(500, msg);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=ApiError.js.map