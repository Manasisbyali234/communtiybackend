export declare const deviceTokensService: {
    register(userId: string, token: string, platform: "ios" | "android" | "web"): Promise<{
        id: string;
        token: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        platform: string;
    }>;
    unregister(userId: string, tokenId: string): Promise<void>;
    getTokensForUser(userId: string): Promise<string[]>;
    listDevices(userId: string): Promise<{
        id: string;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        platform: string;
    }[]>;
};
//# sourceMappingURL=deviceTokens.service.d.ts.map