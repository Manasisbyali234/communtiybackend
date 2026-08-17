import { MediaType } from '@prisma/client';
export declare const messagesService: {
    getConversations(userId: string): Promise<{
        participants: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string;
            };
            id: string;
            userId: string;
            conversationId: string;
            lastReadAt: Date | null;
            isAdmin: boolean;
            leftAt: Date | null;
        }[];
        lastReadAt: Date;
        unreadCount: number;
        otherParticipants: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        }[];
        lastMessage: {
            id: string;
            createdAt: Date;
            conversationId: string;
            senderId: string;
            content: string | null;
            mediaUrl: string | null;
            mediaType: import(".prisma/client").$Enums.MediaType | null;
            isDeleted: boolean;
            deletedForAll: boolean;
            readAt: Date | null;
            deliveredAt: Date | null;
        };
        messages: {
            id: string;
            createdAt: Date;
            conversationId: string;
            senderId: string;
            content: string | null;
            mediaUrl: string | null;
            mediaType: import(".prisma/client").$Enums.MediaType | null;
            isDeleted: boolean;
            deletedForAll: boolean;
            readAt: Date | null;
            deliveredAt: Date | null;
        }[];
        id: string;
        createdAt: Date;
        isGroup: boolean;
        groupName: string | null;
        groupAvatarUrl: string | null;
        lastMessageAt: Date | null;
        isMatrimonyChat: boolean;
    }[]>;
    getOrCreateConversation(userId: string, participantId: string): Promise<{
        participants: ({
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            userId: string;
            conversationId: string;
            lastReadAt: Date | null;
            isAdmin: boolean;
            leftAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        isGroup: boolean;
        groupName: string | null;
        groupAvatarUrl: string | null;
        lastMessageAt: Date | null;
        isMatrimonyChat: boolean;
    }>;
    getMessages(conversationId: string, userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
        reactions: {
            id: string;
            createdAt: Date;
            userId: string;
            messageId: string;
            emoji: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        conversationId: string;
        senderId: string;
        content: string | null;
        mediaUrl: string | null;
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        isDeleted: boolean;
        deletedForAll: boolean;
        readAt: Date | null;
        deliveredAt: Date | null;
    }>>;
    sendMessage(conversationId: string, senderId: string, data: {
        content?: string;
        mediaUrl?: string;
        mediaType?: MediaType;
    }): Promise<{
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
        reactions: {
            id: string;
            createdAt: Date;
            userId: string;
            messageId: string;
            emoji: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        conversationId: string;
        senderId: string;
        content: string | null;
        mediaUrl: string | null;
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        isDeleted: boolean;
        deletedForAll: boolean;
        readAt: Date | null;
        deliveredAt: Date | null;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    markRead(conversationId: string, userId: string): Promise<void>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        messageId: string;
        emoji: string;
    }[]>;
    removeReaction(messageId: string, userId: string, emoji: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        messageId: string;
        emoji: string;
    }[]>;
    deleteForEveryone(messageId: string, senderId: string): Promise<{
        id: string;
        createdAt: Date;
        conversationId: string;
        senderId: string;
        content: string | null;
        mediaUrl: string | null;
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        isDeleted: boolean;
        deletedForAll: boolean;
        readAt: Date | null;
        deliveredAt: Date | null;
    }>;
    deleteForMe(messageId: string, userId: string): Promise<void>;
};
//# sourceMappingURL=messages.service.d.ts.map