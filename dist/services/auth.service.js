"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const password_1 = require("../utils/password");
const otp_1 = require("../utils/otp");
const token_service_1 = require("./token.service");
const email_service_1 = require("./email.service");
const index_1 = require("../config/index");
exports.authService = {
    async register(data) {
        const existing = await database_1.prisma.user.findFirst({
            where: { OR: [{ email: data.email }, { username: data.username }] },
        });
        if (existing) {
            const field = existing.email === data.email ? 'email' : 'username';
            throw ApiError_1.ApiError.conflict(`This ${field} is already registered`);
        }
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        const user = await database_1.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                displayName: data.displayName,
                passwordHash,
            },
            select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true },
        });
        // Create + send OTP
        const otp = await this.createOtp(user.id, 'VERIFY_EMAIL');
        await email_service_1.emailService.sendOtp(user.email, otp, 'VERIFY_EMAIL');
        const tokens = await token_service_1.tokenService.generateTokenPair(user);
        return { user, ...tokens };
    },
    async login(email, password) {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            select: {
                id: true, email: true, username: true, displayName: true,
                role: true, isVerified: true, isActive: true, isBanned: true,
                banReason: true, banExpiresAt: true, passwordHash: true, avatarUrl: true,
            },
        });
        if (!user || !user.isActive) {
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
        }
        if (user.isBanned) {
            const msg = user.banExpiresAt
                ? `Account suspended until ${user.banExpiresAt.toISOString()}`
                : 'Account permanently banned';
            throw ApiError_1.ApiError.forbidden(msg);
        }
        if (!user.passwordHash) {
            throw ApiError_1.ApiError.badRequest('This account uses social login. Please use Google or Apple sign-in.');
        }
        const valid = await (0, password_1.verifyPassword)(password, user.passwordHash);
        if (!valid) {
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
        }
        const { passwordHash: _omit, ...safeUser } = user;
        const tokens = await token_service_1.tokenService.generateTokenPair(safeUser);
        return { user: safeUser, ...tokens };
    },
    async logout(refreshToken) {
        await token_service_1.tokenService.revokeToken(refreshToken);
    },
    async refreshTokens(refreshToken) {
        try {
            const result = await token_service_1.tokenService.rotateRefreshToken(refreshToken);
            return { accessToken: result.accessToken, refreshToken: result.refreshToken };
        }
        catch (err) {
            if (err instanceof Error && err.message === 'REFRESH_TOKEN_REUSE') {
                throw ApiError_1.ApiError.unauthorized('Refresh token reuse detected. Please log in again.');
            }
            if (err instanceof Error && err.message === 'REFRESH_TOKEN_EXPIRED') {
                throw ApiError_1.ApiError.unauthorized('Refresh token has expired. Please log in again.');
            }
            throw ApiError_1.ApiError.unauthorized('Invalid refresh token');
        }
    },
    async verifyEmail(userId, code) {
        const otp = await this.validateOtp(userId, code, 'VERIFY_EMAIL');
        await database_1.prisma.$transaction([
            database_1.prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
            database_1.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
        ]);
    },
    async resendVerification(userId) {
        const user = await database_1.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        if (user.isVerified)
            throw ApiError_1.ApiError.badRequest('Email is already verified');
        const code = await this.createOtp(userId, 'VERIFY_EMAIL');
        await email_service_1.emailService.sendOtp(user.email, code, 'VERIFY_EMAIL');
    },
    async forgotPassword(email) {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return; // Prevent email enumeration
        const code = await this.createOtp(user.id, 'RESET_PASSWORD');
        await email_service_1.emailService.sendOtp(email, code, 'RESET_PASSWORD');
    },
    async resetPassword(email, code, newPassword) {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw ApiError_1.ApiError.badRequest('Invalid reset request');
        const otp = await this.validateOtp(user.id, code, 'RESET_PASSWORD');
        const passwordHash = await (0, password_1.hashPassword)(newPassword);
        await database_1.prisma.$transaction([
            database_1.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
            database_1.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
            database_1.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
        ]);
    },
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        if (!user.passwordHash) {
            throw ApiError_1.ApiError.badRequest('This account uses social login and has no password');
        }
        const valid = await (0, password_1.verifyPassword)(currentPassword, user.passwordHash);
        if (!valid)
            throw ApiError_1.ApiError.badRequest('Current password is incorrect');
        const passwordHash = await (0, password_1.hashPassword)(newPassword);
        await database_1.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    },
    // ── OTP / Passwordless Login ─────────────────────────────────────────────────
    async requestOtpLogin(email) {
        // Prevent enumeration — always succeed
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive)
            return;
        const code = await this.createOtp(user.id, 'OTP_LOGIN');
        await email_service_1.emailService.sendOtp(email, code, 'OTP_LOGIN');
    },
    async verifyOtpLogin(email, code) {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true, isActive: true, isBanned: true, avatarUrl: true },
        });
        if (!user || !user.isActive)
            throw ApiError_1.ApiError.unauthorized('Invalid or expired code');
        if (user.isBanned)
            throw ApiError_1.ApiError.forbidden('Account is banned');
        const otp = await this.validateOtp(user.id, code, 'OTP_LOGIN');
        await database_1.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
        const tokens = await token_service_1.tokenService.generateTokenPair(user);
        return { user, ...tokens };
    },
    // ── OTP Helpers ─────────────────────────────────────────────────────────────
    async createOtp(userId, type) {
        // Invalidate previous unused OTPs of same type
        await database_1.prisma.otp.updateMany({
            where: { userId, type, usedAt: null },
            data: { usedAt: new Date() },
        });
        const code = (0, otp_1.generateOtp)();
        const expiresAt = (0, otp_1.otpExpiresAt)(index_1.config.OTP_EXPIRY_MINUTES);
        await database_1.prisma.otp.create({ data: { userId, code, type, expiresAt } });
        return code;
    },
    async validateOtp(userId, code, type) {
        const otp = await database_1.prisma.otp.findFirst({
            where: { userId, code, type, usedAt: null, expiresAt: { gt: new Date() } },
        });
        if (!otp)
            throw ApiError_1.ApiError.badRequest('Invalid or expired OTP code');
        return otp;
    },
};
//# sourceMappingURL=auth.service.js.map