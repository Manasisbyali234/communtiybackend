import { TokenPair } from '../types/index';
import { Role } from '@prisma/client';
export declare const tokenService: {
    /**
     * Sign an access token (short-lived).
     */
    signAccessToken(payload: {
        id: string;
        email: string;
        role: Role;
    }): string;
    /**
     * Sign a refresh token (long-lived) and store it in the DB.
     */
    signRefreshToken(userId: string): Promise<string>;
    /**
     * Generate both tokens and return as a pair.
     */
    generateTokenPair(user: {
        id: string;
        email: string;
        role: Role;
    }): Promise<TokenPair>;
    /**
     * Rotate refresh token — validates, deletes old, issues new pair.
     * Detects reuse attacks by checking if token is already deleted.
     */
    rotateRefreshToken(oldToken: string): Promise<TokenPair & {
        userId: string;
    }>;
    /**
     * Revoke a specific refresh token.
     */
    revokeToken(token: string): Promise<void>;
    /**
     * Revoke ALL refresh tokens for a user (breach recovery).
     */
    revokeAllUserTokens(userId: string): Promise<void>;
};
//# sourceMappingURL=token.service.d.ts.map