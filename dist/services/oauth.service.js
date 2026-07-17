"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const apple_signin_auth_1 = __importDefault(require("apple-signin-auth"));
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const token_service_1 = require("./token.service");
const index_1 = require("../config/index");
const client_1 = require("@prisma/client");
const googleClient = new google_auth_library_1.OAuth2Client(index_1.config.GOOGLE_CLIENT_ID);
exports.oauthService = {
    async googleSignIn(idToken) {
        if (!index_1.config.GOOGLE_CLIENT_ID) {
            throw ApiError_1.ApiError.badRequest('Google OAuth is not configured on this server');
        }
        // Verify Google ID token
        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken,
                audience: index_1.config.GOOGLE_CLIENT_ID,
            });
        }
        catch {
            throw ApiError_1.ApiError.unauthorized('Invalid Google token');
        }
        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email) {
            throw ApiError_1.ApiError.unauthorized('Invalid Google token payload');
        }
        const { sub: providerId, email, name, picture } = payload;
        return this._findOrCreateOAuthUser({
            provider: client_1.OAuthProvider.GOOGLE,
            providerId,
            email,
            displayName: name ?? email.split('@')[0],
            avatarUrl: picture,
        });
    },
    async appleSignIn(identityToken) {
        if (!index_1.config.APPLE_CLIENT_ID) {
            throw ApiError_1.ApiError.badRequest('Apple Sign-In is not configured on this server');
        }
        let appleUser;
        try {
            appleUser = await apple_signin_auth_1.default.verifyIdToken(identityToken, {
                audience: index_1.config.APPLE_CLIENT_ID,
                ignoreExpiration: false,
            });
        }
        catch {
            throw ApiError_1.ApiError.unauthorized('Invalid Apple identity token');
        }
        const { sub: providerId, email } = appleUser;
        if (!providerId)
            throw ApiError_1.ApiError.unauthorized('Invalid Apple token payload');
        // Apple only provides email on first sign-in
        const displayName = email ? email.split('@')[0] : `user_${providerId.slice(-6)}`;
        return this._findOrCreateOAuthUser({
            provider: client_1.OAuthProvider.APPLE,
            providerId,
            email: email ?? null,
            displayName,
            avatarUrl: undefined,
        });
    },
    async _findOrCreateOAuthUser(data) {
        // 1. Check if OAuth account already exists
        const oauthAccount = await database_1.prisma.oAuthAccount.findUnique({
            where: { provider_providerId: { provider: data.provider, providerId: data.providerId } },
            include: { user: { select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true, isActive: true, isBanned: true } } },
        });
        if (oauthAccount) {
            const user = oauthAccount.user;
            if (!user.isActive || user.isBanned)
                throw ApiError_1.ApiError.forbidden('Account is suspended');
            const tokens = await token_service_1.tokenService.generateTokenPair(user);
            return { user, ...tokens, isNewUser: false };
        }
        // 2. If email provided, check if regular account exists → link
        let userId = null;
        if (data.email) {
            const existingUser = await database_1.prisma.user.findUnique({ where: { email: data.email } });
            if (existingUser) {
                userId = existingUser.id;
                // Link OAuth account to existing user
                await database_1.prisma.oAuthAccount.create({
                    data: { userId, provider: data.provider, providerId: data.providerId, email: data.email },
                });
                const user = await database_1.prisma.user.findUniqueOrThrow({
                    where: { id: userId },
                    select: { id: true, email: true, username: true, displayName: true, role: true, isVerified: true },
                });
                const tokens = await token_service_1.tokenService.generateTokenPair(user);
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
        while (await database_1.prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}_${Math.floor(Math.random() * 9999)}`;
            if (++attempt > 10)
                username = `user_${Date.now().toString(36)}`;
        }
        const newUser = await database_1.prisma.user.create({
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
        const tokens = await token_service_1.tokenService.generateTokenPair(newUser);
        return { user: newUser, ...tokens, isNewUser: true };
    },
};
//# sourceMappingURL=oauth.service.js.map