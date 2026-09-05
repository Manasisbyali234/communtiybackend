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
const logger_1 = require("../config/logger");
const clean = (value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
};
const parseDob = (value) => {
    if (!value)
        return null;
    const normalized = value.includes('/')
        ? value.split('/').reverse().join('-')
        : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};
const isAtLeastAge = (value, minimumAge = 18) => {
    const dob = parseDob(value);
    if (!dob)
        return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (today < birthdayThisYear)
        age -= 1;
    return age >= minimumAge;
};
const buildRegistrationProfileData = (data) => {
    const nativePlace = clean(data.nativePlace);
    const city = clean(data.city);
    return {
        email: data.email.trim().toLowerCase(),
        username: data.username.trim().toLowerCase(),
        displayName: data.displayName.trim(),
        phone: clean(data.phone),
        familyName: clean(data.familyName),
        dob: clean(data.dob),
        gender: clean(data.gender),
        country: clean(data.country),
        state: clean(data.state),
        district: clean(data.district),
        city,
        nativePlace,
        currentLocation: clean(data.currentLocation) ?? city,
        village: nativePlace ?? city,
        occupation: clean(data.occupation),
        profession: clean(data.profession),
        company: clean(data.company),
        education: clean(data.education),
        skills: clean(data.skills),
        phoneVerified: false,
        approvalStatus: 'PENDING',
        rejectionReason: undefined,
        approvalHistory: [
            {
                status: 'PENDING',
                date: new Date().toISOString(),
            },
        ],
    };
};
const userAuthSelect = {
    id: true,
    email: true,
    username: true,
    displayName: true,
    phone: true,
    familyName: true,
    dob: true,
    gender: true,
    country: true,
    state: true,
    district: true,
    city: true,
    nativePlace: true,
    currentLocation: true,
    village: true,
    occupation: true,
    profession: true,
    company: true,
    education: true,
    skills: true,
    role: true,
    isVerified: true,
    isActive: true,
    isBanned: true,
    phoneVerified: true,
    approvalStatus: true,
    rejectionReason: true,
    approvalHistory: true,
};
exports.authService = {
    async register(data) {
        if (data.dob && !isAtLeastAge(data.dob)) {
            throw ApiError_1.ApiError.badRequest('You must be at least 18 years old to register');
        }
        const profileData = buildRegistrationProfileData(data);
        const existing = await database_1.prisma.user.findFirst({
            where: { OR: [{ email: profileData.email }, { username: profileData.username }] },
        });
        if (existing) {
            if (!existing.isActive) {
                // Reactivate the deactivated account with new credentials
                const passwordHash = await (0, password_1.hashPassword)(data.password);
                const user = await database_1.prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        ...profileData,
                        passwordHash,
                        isActive: true,
                        isVerified: false,
                    },
                    select: userAuthSelect,
                });
                const tokens = await token_service_1.tokenService.generateTokenPair(user);
                return { user, ...tokens };
            }
            const field = existing.email === profileData.email ? 'email' : 'username';
            throw ApiError_1.ApiError.conflict(`This ${field} is already registered`);
        }
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        // Validate referrer exists
        const referredById = data.referredById
            ? (await database_1.prisma.user.findUnique({ where: { id: data.referredById }, select: { id: true } }))?.id
            : undefined;
        const user = await database_1.prisma.user.create({
            data: {
                ...profileData,
                passwordHash,
                ...(referredById ? { referredById } : {}),
            },
            select: userAuthSelect,
        });
        // Create OTP and send email non-blocking (SMTP failure won't break registration)
        const otp = await this.createOtp(user.id, 'VERIFY_EMAIL');
        email_service_1.emailService.sendOtp(user.email, otp, 'VERIFY_EMAIL').catch((err) => logger_1.logger.error({ err }, 'Failed to send verification email'));
        const tokens = await token_service_1.tokenService.generateTokenPair(user);
        return { user, ...tokens };
    },
    async login(email, password) {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            select: {
                id: true, email: true, username: true, displayName: true,
                role: true, isVerified: true, isActive: true, isBanned: true,
                banReason: true, banExpiresAt: true, passwordHash: true, avatarUrl: true, deletedAt: true,
                phone: true, familyName: true, dob: true, gender: true, country: true,
                state: true, district: true, city: true, nativePlace: true,
                currentLocation: true, village: true, occupation: true, profession: true,
                company: true, education: true, skills: true, phoneVerified: true,
                approvalStatus: true, rejectionReason: true, approvalHistory: true,
            },
        });
        if (!user)
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
        if (user.deletedAt) {
            const reactivateAfter = new Date(user.deletedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
            const now = new Date();
            if (now < reactivateAfter) {
                const days = Math.ceil((reactivateAfter.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                throw ApiError_1.ApiError.forbidden(`This account has been deleted. You can create a new account after ${days} more day(s) (on ${reactivateAfter.toDateString()}).`);
            }
        }
        if (!user.isActive)
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
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
    async verifyPhone(userId, phone) {
        return database_1.prisma.user.update({
            where: { id: userId },
            data: { phone, phoneVerified: true },
            select: userAuthSelect,
        });
    },
    async forgotPassword(email) {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw ApiError_1.ApiError.notFound('Email is not registered');
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
            select: {
                ...userAuthSelect,
                isBanned: true,
                avatarUrl: true,
            },
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