import { RsvpStatus } from '@prisma/client';
export declare const eventsService: {
    list(params: {
        cursor?: string;
        limit?: number;
        communityId?: string;
        upcoming?: boolean;
        search?: string;
    }): Promise<import("../utils/pagination").CursorPage<{
        community: {
            name: string;
            id: string;
            slug: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string | null;
        description: string | null;
        title: string;
        creatorId: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
    }>>;
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string | null;
        description: string | null;
        title: string;
        creatorId: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
    }>;
    getById(eventId: string, userId: string): Promise<{
        myRsvp: import(".prisma/client").$Enums.RsvpStatus | null;
        community: {
            name: string;
            id: string;
            slug: string;
        } | null;
        rsvps: {
            status: import(".prisma/client").$Enums.RsvpStatus;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string | null;
        description: string | null;
        title: string;
        creatorId: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
    }>;
    update(eventId: string, creatorId: string, data: Partial<{
        title: string;
        description: string;
        location: string;
        startsAt: Date;
        endsAt: Date;
        coverUrl: string;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string | null;
        description: string | null;
        title: string;
        creatorId: string;
        location: string | null;
        startsAt: Date;
        endsAt: Date | null;
        coverUrl: string | null;
        rsvpCount: number;
    }>;
    delete(eventId: string, creatorId: string): Promise<void>;
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
        avatarUrl: string | null;
    }>>;
};
//# sourceMappingURL=events.service.d.ts.map