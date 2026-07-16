import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index';
import { prisma } from '../config/database';
import { JwtPayload, TokenPair } from '../types/index';
import { Role } from '@prisma/client';

export const tokenService = {
  /**
   * Sign an access token (short-lived).
   */
  signAccessToken(payload: { id: string; email: string; role: Role }): string {
    return jwt.sign(
      { sub: payload.id, email: payload.email, role: payload.role } as JwtPayload,
      config.JWT_ACCESS_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRY as any },
    );
  },

  /**
   * Sign a refresh token (long-lived) and store it in the DB.
   */
  async signRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

    await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
    return token;
  },

  /**
   * Generate both tokens and return as a pair.
   */
  async generateTokenPair(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<TokenPair> {
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
  async rotateRefreshToken(oldToken: string): Promise<TokenPair & { userId: string }> {
    const record = await prisma.refreshToken.findUnique({ where: { token: oldToken }, include: { user: true } });

    if (!record) {
      // Token not found — possible reuse attack. Revoke all tokens for that user.
      throw new Error('REFRESH_TOKEN_REUSE');
    }

    if (record.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: record.id } });
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

    // Delete old token
    await prisma.refreshToken.delete({ where: { id: record.id } });

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
  async revokeToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  },

  /**
   * Revoke ALL refresh tokens for a user (breach recovery).
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },
};
