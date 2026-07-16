import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { tokenService } from './token.service';
import { config } from '../config/index';
import { OAuthProvider } from '@prisma/client';

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export const oauthService = {
  async googleSignIn(idToken: string) {
    if (!config.GOOGLE_CLIENT_ID) {
      throw ApiError.badRequest('Google OAuth is not configured on this server');
    }

    // Verify Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw ApiError.unauthorized('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw ApiError.unauthorized('Invalid Google token payload');
    }

    const { sub: providerId, email, name, picture } = payload;

    return this._findOrCreateOAuthUser({
      provider: OAuthProvider.GOOGLE,
      providerId,
      email,
      displayName: name ?? email.split('@')[0],
      avatarUrl: picture,
    });
  },

  async appleSignIn(identityToken: string) {
    if (!config.APPLE_CLIENT_ID) {
      throw ApiError.badRequest('Apple Sign-In is not configured on this server');
    }

    let appleUser: { sub: string; email?: string };
    try {
      appleUser = await appleSignin.verifyIdToken(identityToken, {
        audience: config.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });
    } catch {
      throw ApiError.unauthorized('Invalid Apple identity token');
    }

    const { sub: providerId, email } = appleUser;
    if (!providerId) throw ApiError.unauthorized('Invalid Apple token payload');

    // Apple only provides email on first sign-in
    const displayName = email ? email.split('@')[0] : `user_${providerId.slice(-6)}`;

    return this._findOrCreateOAuthUser({
      provider: OAuthProvider.APPLE,
      providerId,
      email: email ?? null,
      displayName,
      avatarUrl: undefined,
    });
  },

  async _findOrCreateOAuthUser(data: {
    provider: OAuthProvider;
    providerId: string;
    email: string | null | undefined;
    displayName: string;
    avatarUrl?: string | null;
  }) {
    // 1. Check if OAuth account already exists
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider: data.provider, providerId: data.providerId } },
      include: { user: { select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true, isActive: true, isBanned: true } } },
    });

    if (oauthAccount) {
      const user = oauthAccount.user;
      if (!user.isActive || user.isBanned) throw ApiError.forbidden('Account is suspended');
      const tokens = await tokenService.generateTokenPair(user);
      return { user, ...tokens, isNewUser: false };
    }

    // 2. If email provided, check if regular account exists → link
    let userId: string | null = null;
    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        userId = existingUser.id;
        // Link OAuth account to existing user
        await prisma.oAuthAccount.create({
          data: { userId, provider: data.provider, providerId: data.providerId, email: data.email },
        });
        const user = await prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true },
        });
        const tokens = await tokenService.generateTokenPair(user);
        return { user, ...tokens, isNewUser: false };
      }
    }

    // 3. Create new user
    const baseUsername = (data.email?.split('@')[0] ?? data.displayName)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 24);

    // Ensure unique username
    let username = baseUsername;
    let attempt = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}_${Math.floor(Math.random() * 9999)}`;
      if (++attempt > 10) username = `user_${Date.now().toString(36)}`;
    }

    const newUser = await prisma.user.create({
      data: {
        email: data.email ?? `${data.provider.toLowerCase()}_${data.providerId}@placeholder.com`,
        username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl ?? null,
        isVerified: true, // OAuth emails are pre-verified
        oauthAccounts: {
          create: { provider: data.provider, providerId: data.providerId, email: data.email },
        },
        settings: { create: {} }, // default settings
      },
      select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true },
    });

    const tokens = await tokenService.generateTokenPair(newUser);
    return { user: newUser, ...tokens, isNewUser: true };
  },
};
