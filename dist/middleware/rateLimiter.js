"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRateLimiter = exports.globalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const index_1 = require("../config/index");
const ApiError_1 = require("../utils/ApiError");
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: index_1.config.RATE_LIMIT_WINDOW_MS,
    max: index_1.config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/api/v1/messages'),
    handler: (_req, _res, next) => {
        next(new ApiError_1.ApiError(429, 'Too many requests, please try again later.'));
    },
});
exports.messagesRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anonymous',
    handler: (_req, _res, next) => {
        next(new ApiError_1.ApiError(429, 'Too many requests, please try again later.'));
    },
});
//# sourceMappingURL=rateLimiter.js.map