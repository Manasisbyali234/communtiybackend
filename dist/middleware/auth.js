"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../config/index");
const ApiError_1 = require("../utils/ApiError");
function auth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw ApiError_1.ApiError.unauthorized('Missing or malformed Authorization header');
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, index_1.config.JWT_ACCESS_SECRET);
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
        next();
    }
    catch {
        throw ApiError_1.ApiError.unauthorized('Invalid or expired access token');
    }
}
//# sourceMappingURL=auth.js.map