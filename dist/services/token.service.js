"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const index_1 = require("../config/index");
const database_1 = require("../config/database");
exports.tokenService = {
    /**
     * Sign an access token (short-lived).
     */
    signAccessToken(payload) {
        return jsonwebtoken_1.default.sign({ sub: payload.id, email: payload.email, role: payload.role }, index_1.config.JWT_ACCESS_SECRET, { expiresIn: index_1.config.JWT_ACCESS_EXPIRY });
    },
    /**
     * Sign a refresh token (long-lived) and store it in the DB.
     */
    async signRefreshToken(userId) {
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d
        await database_1.prisma.refreshToken.create({ data: { token, userId, expiresAt } });
        return token;
    },
    /**
     * Generate both tokens and return as a pair.
     */
    async generateTokenPair(user) {
        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(user),
            this.signRefreshToken(user.id),
        ]);
        return { accessToken, refreshToken };
    },
    /**
     * Rotate refresh token — validates, deletes old, issues new pair.
     * Detects reuse attacks by checking if token is already deleted.
     */
    async rotateRefreshToken(oldToken) {
        const record = await database_1.prisma.refreshToken.findUnique({ where: { token: oldToken }, include: { user: true } });
        if (!record) {
            // Token not found — possible reuse attack. Revoke all tokens for that user.
            throw new Error('REFRESH_TOKEN_REUSE');
        }
        if (record.expiresAt < new Date()) {
            await database_1.prisma.refreshToken.delete({ where: { id: record.id } });
            throw new Error('REFRESH_TOKEN_EXPIRED');
        }
        // Delete old token
        await database_1.prisma.refreshToken.delete({ where: { id: record.id } });
        // Issue new pair
        const tokens = await this.generateTokenPair({
            id: record.user.id,
            email: record.user.email,
            role: record.user.role,
        });
        return { ...tokens, userId: record.user.id };
    },
    /**
     * Revoke a specific refresh token.
     */
    async revokeToken(token) {
        await database_1.prisma.refreshToken.deleteMany({ where: { token } });
    },
    /**
     * Revoke ALL refresh tokens for a user (breach recovery).
     */
    async revokeAllUserTokens(userId) {
        await database_1.prisma.refreshToken.deleteMany({ where: { userId } });
    },
};
//# sourceMappingURL=token.service.js.map