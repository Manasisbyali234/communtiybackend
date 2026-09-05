import { RsvpStatus } from '@prisma/client';
export declare const eventsService: {
    list(params: {
        cursor?: string;
        limit?: number;
        communityId?: string;
        upcoming?: boolean;
        search?: string;
        userId?: string;
        creatorId?: string;
        includeUnapproved?: boolean;
    }): Promise<import("../utils/pagination").CursorPage<any>>;
    create(creatorId: string, data: {
        title: string;
        description?: string;
        location?: string;
        startsAt: Date;
        endsAt?: Date;
        coverUrl?: string;
        communityId?: string;
    }): Promise<{
        community: {
            name: string;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.EventStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        creatorId: string;
        title: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
        interestedCount: number;
    }>;
    getById(eventId: string, userId: string): Promise<{
        coverUrl: string;
        myRsvp: import(".prisma/client").$Enums.RsvpStatus;
        isInterested: boolean;
        interests: any;
        community: {
            name: string;
            id: string;
            slug: string;
        };
        rsvps: {
            status: import(".prisma/client").$Enums.RsvpStatus;
        }[];
        status: import(".prisma/client").$Enums.EventStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        creatorId: string;
        title: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        rsvpCount: number;
        interestedCount: number;
    }>;
    update(eventId: string, creatorId: string, data: Partial<{
        title: string;
        description: string;
        location: string;
        startsAt: Date;
        endsAt: Date;
        coverUrl: string;
    }>): Promise<{
        status: import(".prisma/client").$Enums.EventStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        creatorId: string;
        title: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
        interestedCount: number;
    }>;
    delete(eventId: string, creatorId: string): Promise<void>;
    archive(eventId: string, creatorId: string): Promise<{
        status: import(".prisma/client").$Enums.EventStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        communityId: string | null;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        creatorId: string;
        title: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
        interestedCount: number;
    }>;
    rsvp(eventId: string, userId: string, status: RsvpStatus): Promise<{
        status: import(".prisma/client").$Enums.RsvpStatus;
        id: string;
        createdAt: Date;
        userId: string;
        eventId: string;
    }>;
    cancelRsvp(eventId: string, userId: string): Promise<void>;
    getAttendees(eventId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        status: import(".prisma/client").$Enums.RsvpStatus;
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string;
    }>>;
    toggleLike(eventId: string, userId: string): Promise<{
        liked: boolean;
        likesCount: number;
    }>;
    getComments(eventId: string, cursor?: string, limit?: number): Promise<import("../utils/pagination").CursorPage<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        eventId: string;
    }>>;
    addComment(eventId: string, authorId: string, content: string): Promise<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        eventId: string;
    }>;
    updateComment(commentId: string, userId: string, content: string): Promise<{
        author: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        eventId: string;
    }>;
    deleteComment(commentId: string, eventId: string, userId: string, role: string): Promise<void>;
    shareEvent(eventId: string, userId: string): Promise<{
        sharesCount: number;
    }>;
    toggleInterest(eventId: string, userId: string): Promise<{
        interested: boolean;
        interestedCount: number;
    }>;
};
//# sourceMappingURL=events.service.d.ts.map