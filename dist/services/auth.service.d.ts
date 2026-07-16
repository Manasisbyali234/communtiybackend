import { TokenPair } from '../types/index';
export declare const authService: {
    register(data: {
        email: string;
        username: string;
        displayName: string;
        password: string;
    }): Promise<{
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
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            isVerified: boolean;
            isActive: boolean;
            isBanned: boolean;
            banReason: string | null;
            banExpiresAt: Date | null;
        };
    }>;
    logout(refreshToken: string): Promise<void>;
    refreshTokens(refreshToken: string): Promise<TokenPair>;
    verifyEmail(userId: string, code: string): Promise<void>;
    resendVerification(userId: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(email: string, code: string, newPassword: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    requestOtpLogin(email: string): Promise<void>;
    verifyOtpLogin(email: string, code: string): Promise<{
        user: object;
        accessToken: string;
        refreshToken: string;
    }>;
    createOtp(userId: string, type: string): Promise<string>;
    validateOtp(userId: string, code: string, type: string): Promise<{
        code: string;
        type: string;
        id: string;
        expiresAt: Date;
        createdAt: Date;
        userId: string;
        usedAt: Date | null;
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map