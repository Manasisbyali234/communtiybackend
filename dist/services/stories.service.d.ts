import { MediaType } from '@prisma/client';
export declare const storiesService: {
    getFeed(userId: string): Promise<{
        user: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        stories: ({
            author: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            };
            views: {
                viewerId: string;
            }[];
        } & {
            id: string;
            expiresAt: Date;
            createdAt: Date;
            authorId: string;
            mediaType: import(".prisma/client").$Enums.MediaType;
            likesCount: number;
            mediaUrl: string;
            viewCount: number;
        })[];
        hasUnseen: boolean;
    }[]>;
    create(authorId: string, mediaUrl: string, mediaType: MediaType): Promise<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        authorId: string;
        mediaType: import(".prisma/client").$Enums.MediaType;
        likesCount: number;
        mediaUrl: string;
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
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        storyId: string;
        senderId: string;
    }>;
    getStoryReplies(storyId: string, userId: string): Promise<({
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        storyId: string;
        senderId: string;
    })[]>;
};
//# sourceMappingURL=stories.service.d.ts.map