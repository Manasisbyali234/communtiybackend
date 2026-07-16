import { Role } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface SocketUser {
    id: string;
    email: string;
    role: Role;
}
export interface NotificationPayload {
    recipientId: string;
    type: string;
    actorId?: string;
    entityId?: string;
    entityType?: string;
    body: string;
}
export interface EmailJobData {
    to: string;
    subject: string;
    html: string;
}
export interface PushJobData {
    expoPushToken: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}
export interface MediaJobData {
    key: string;
    purpose: string;
}
export interface StoryExpiryJobData {
    storyId: string;
}
export interface EventReminderJobData {
    eventId: string;
}
//# sourceMappingURL=index.d.ts.map