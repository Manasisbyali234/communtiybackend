import { MediaType } from '@prisma/client';
export declare const messagesService: {
    getConversations(userId: string): Promise<{
        lastReadAt: Date | null;
        otherParticipants: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        }[];
        lastMessage: {
            id: string;
            createdAt: Date;
            content: string | null;
            mediaType: import(".prisma/client").$Enums.MediaType | null;
            senderId: string;
            mediaUrl: string | null;
            conversationId: string;
            deletedForAll: boolean;
            isDeleted: boolean;
            readAt: Date | null;
            deliveredAt: Date | null;
        } | null;
        participants: ({
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            conversationId: string;
            lastReadAt: Date | null;
            isAdmin: boolean;
            leftAt: Date | null;
        })[];
        messages: {
            id: string;
            createdAt: Date;
            content: string | null;
            mediaType: import(".prisma/client").$Enums.MediaType | null;
            senderId: string;
            mediaUrl: string | null;
            conversationId: string;
            deletedForAll: boolean;
            isDeleted: boolean;
            readAt: Date | null;
            deliveredAt: Date | null;
        }[];
        id: string;
        createdAt: Date;
        lastMessageAt: Date | null;
        isGroup: boolean;
        groupName: string | null;
        groupAvatarUrl: string | null;
    }[]>;
    getOrCreateConversation(userId: string, participantId: string): Promise<{
        participants: ({
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
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
        lastMessageAt: Date | null;
        isGroup: boolean;
        groupName: string | null;
        groupAvatarUrl: string | null;
    }>;
    getMessages(conversationId: string, userId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
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
        content: string | null;
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        senderId: string;
        mediaUrl: string | null;
        conversationId: string;
        deletedForAll: boolean;
        isDeleted: boolean;
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
            avatarUrl: string | null;
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
        content: string | null;
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        senderId: string;
        mediaUrl: string | null;
        conversationId: string;
        deletedForAll: boolean;
        isDeleted: boolean;
        readAt: Date | null;
        deliveredAt: Date | null;
    }>;
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
        content: string | null;
        mediaType: import(".prisma/client").$Enums.MediaType | null;
        senderId: string;
        mediaUrl: string | null;
        conversationId: string;
        deletedForAll: boolean;
        isDeleted: boolean;
        readAt: Date | null;
        deliveredAt: Date | null;
    }>;
    deleteForMe(messageId: string, userId: string): Promise<void>;
};
//# sourceMappingURL=messages.service.d.ts.map