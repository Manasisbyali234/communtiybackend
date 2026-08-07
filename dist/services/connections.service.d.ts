export declare const connectionsService: {
    sendRequest(senderId: string, receiverId: string): Promise<{
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
    }>;
    acceptRequest(requestId: string, userId: string): Promise<{
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
        receiver: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
    }>;
    rejectRequest(requestId: string, userId: string): Promise<void>;
    getStatus(senderId: string, receiverId: string): Promise<{
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
    }>;
    getConnections(userId: string): Promise<{
        id: string;
        username: string;
        displayName: string;
        bio: string;
        avatarUrl: string;
    }[]>;
    getConnectionCount(userId: string): Promise<number>;
    getPendingReceived(userId: string): Promise<({
        sender: {
            id: string;
            username: string;
            displayName: string;
            bio: string;
            avatarUrl: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ConnectionStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        receiverId: string;
    })[]>;
};
//# sourceMappingURL=connections.service.d.ts.map