import { MediaType } from '@prisma/client';
export declare const storiesService: {
    getFeed(userId: string): Promise<{
        user: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
        stories: ({
            author: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string;
            };
            views: {
                viewerId: string;
            }[];
        } & {
            id: string;
            expiresAt: Date;
            createdAt: Date;
            mediaUrl: string;
            mediaType: import(".prisma/client").$Enums.MediaType;
            authorId: string;
            likesCount: number;
            viewCount: number;
        })[];
        hasUnseen: boolean;
    }[]>;
    getById(storyId: string, requesterId?: string): Promise<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        mediaUrl: string;
        mediaType: import(".prisma/client").$Enums.MediaType;
        authorId: string;
        likesCount: number;
        viewCount: number;
    }>;
    create(authorId: string, mediaUrl: string, mediaType: MediaType): Promise<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        mediaUrl: string;
        mediaType: import(".prisma/client").$Enums.MediaType;
        authorId: string;
        likesCount: number;
        viewCount: number;
    }>;
    update(storyId: string, userId: string, data: {
        mediaUrl?: string;
        mediaType?: MediaType;
    }): Promise<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        mediaUrl: string;
        mediaType: import(".prisma/client").$Enums.MediaType;
        authorId: string;
        likesCount: number;
        viewCount: number;
    }>;
    delete(storyId: string, userId: string): Promise<void>;
    recordView(storyId: string, viewerId: string): Promise<void>;
    getViewers(storyId: string, userId: string): Promise<({
        story: {
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        storyId: string;
        viewerId: string;
    })[]>;
    likeStory(storyId: string, userId: string): Promise<void>;
    unlikeStory(storyId: string, userId: string): Promise<void>;
    replyToStory(storyId: string, senderId: string, content: string): Promise<{
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        senderId: string;
        content: string;
        storyId: string;
    }>;
    getStoryReplies(storyId: string, userId: string): Promise<({
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        senderId: string;
        content: string;
        storyId: string;
    })[]>;
};
//# sourceMappingURL=stories.service.d.ts.map