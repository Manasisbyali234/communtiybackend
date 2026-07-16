import { OAuthProvider } from '@prisma/client';
export declare const oauthService: {
    googleSignIn(idToken: string): Promise<{
        isNewUser: boolean;
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            id: string;
            username: string;
            displayName: string;
            role: import(".prisma/client").$Enums.Role;
            isVerified: boolean;
        };
    }>;
    appleSignIn(identityToken: string): Promise<{
        isNewUser: boolean;
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            id: string;
            username: string;
            displayName: string;
            role: import(".prisma/client").$Enums.Role;
            isVerified: boolean;
        };
    }>;
    _findOrCreateOAuthUser(data: {
        provider: OAuthProvider;
        providerId: string;
        email: string | null | undefined;
        displayName: string;
        avatarUrl?: string | null;
    }): Promise<{
        isNewUser: boolean;
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            id: string;
            username: string;
            displayName: string;
            role: import(".prisma/client").$Enums.Role;
            isVerified: boolean;
        };
    }>;
};
//# sourceMappingURL=oauth.service.d.ts.map