import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateOtp, otpExpiresAt } from '../utils/otp';
import { tokenService } from './token.service';
import { emailService } from './email.service';
import { config } from '../config/index';
import { logger } from '../config/logger';
import { TokenPair } from '../types/index';

export const authService = {
  async register(data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      const field = existing.email === data.email ? 'email' : 'username';
      throw ApiError.conflict(`This ${field} is already registered`);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        passwordHash,
      },
      select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true },
    });

    // Create OTP and send email non-blocking (SMTP failure won't break registration)
    const otp = await this.createOtp(user.id, 'VERIFY_EMAIL');
    emailService.sendOtp(user.email, otp, 'VERIFY_EMAIL').catch((err) =>
      logger.error({ err }, 'Failed to send verification email')
    );

    const tokens = await tokenService.generateTokenPair(user);

    return { user, ...tokens };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, username: true, displayName: true,
        role: true, isVerified: true, isActive: true, isBanned: true,
        banReason: true, banExpiresAt: true, passwordHash: true, avatarUrl: true,
      },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (user.isBanned) {
      const msg = user.banExpiresAt
        ? `Account suspended until ${user.banExpiresAt.toISOString()}`
        : 'Account permanently banned';
      throw ApiError.forbidden(msg);
    }
    if (!user.passwordHash) {
      throw ApiError.badRequest('This account uses social login. Please use Google or Apple sign-in.');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const { passwordHash: _omit, ...safeUser } = user;
    const tokens = await tokenService.generateTokenPair(safeUser);

    return { user: safeUser, ...tokens };
  },

  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeToken(refreshToken);
  },

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const result = await tokenService.rotateRefreshToken(refreshToken);
      return { accessToken: result.accessToken, refreshToken: result.refreshToken };
    } catch (err) {
      if (err instanceof Error && err.message === 'REFRESH_TOKEN_REUSE') {
        throw ApiError.unauthorized('Refresh token reuse detected. Please log in again.');
      }
      if (err instanceof Error && err.message === 'REFRESH_TOKEN_EXPIRED') {
        throw ApiError.unauthorized('Refresh token has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid refresh token');
    }
  },

  async verifyEmail(userId: string, code: string): Promise<void> {
    const otp = await this.validateOtp(userId, code, 'VERIFY_EMAIL');

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
      prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    ]);
  },

  async resendVerification(userId: string): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.isVerified) throw ApiError.badRequest('Email is already verified');
    const code = await this.createOtp(userId, 'VERIFY_EMAIL');
    await emailService.sendOtp(user.email, code, 'VERIFY_EMAIL');
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Prevent email enumeration
    const code = await this.createOtp(user.id, 'RESET_PASSWORD');
    await emailService.sendOtp(email, code, 'RESET_PASSWORD');
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.badRequest('Invalid reset request');

    const otp = await this.validateOtp(user.id, code, 'RESET_PASSWORD');
    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash) {
      throw ApiError.badRequest('This account uses social login and has no password');
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw ApiError.badRequest('Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  // ── OTP / Passwordless Login ─────────────────────────────────────────────────

  async requestOtpLogin(email: string): Promise<void> {
    // Prevent enumeration — always succeed
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return;

    const code = await this.createOtp(user.id, 'OTP_LOGIN');
    await emailService.sendOtp(email, code, 'OTP_LOGIN');
  },

  async verifyOtpLogin(email: string, code: string): Promise<{ user: object; accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true, isActive: true, isBanned: true, avatarUrl: true },
    });
    if (!user || !user.isActive) throw ApiError.unauthorized('Invalid or expired code');
    if (user.isBanned) throw ApiError.forbidden('Account is banned');

    const otp = await this.validateOtp(user.id, code, 'OTP_LOGIN');
    await prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    const tokens = await tokenService.generateTokenPair(user);
    return { user, ...tokens };
  },

  // ── OTP Helpers ─────────────────────────────────────────────────────────────

  async createOtp(userId: string, type: string): Promise<string> {
    // Invalidate previous unused OTPs of same type
    await prisma.otp.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = generateOtp();
    const expiresAt = otpExpiresAt(config.OTP_EXPIRY_MINUTES);

    await prisma.otp.create({ data: { userId, code, type, expiresAt } });
    return code;
  },

  async validateOtp(userId: string, code: string, type: string) {
    const otp = await prisma.otp.findFirst({
      where: { userId, code, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!otp) throw ApiError.badRequest('Invalid or expired OTP code');
    return otp;
  },
};
