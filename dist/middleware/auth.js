"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../config/index");
const ApiError_1 = require("../utils/ApiError");
function auth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(ApiError_1.ApiError.unauthorized('Missing or malformed Authorization header'));
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, index_1.config.JWT_ACCESS_SECRET);
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
        next();
    }
    catch (err) {
        next(ApiError_1.ApiError.unauthorized('Invalid or expired access token'));
    }
}
// Optional auth — attaches user if token present, continues without error if not
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return next();
    try {
        const payload = jsonwebtoken_1.default.verify(authHeader.slice(7), index_1.config.JWT_ACCESS_SECRET);
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
    }
    catch { /* ignore */ }
    next();
}
//# sourceMappingURL=auth.js.map