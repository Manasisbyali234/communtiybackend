import { NotificationPayload } from '../types/index';
export declare const notificationsService: {
    create(payload: NotificationPayload): Promise<void>;
    list(userId: string, params: {
        cursor?: string;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<import("../utils/pagination").CursorPage<{
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        createdAt: Date;
        recipientId: string;
        actorId: string | null;
        entityId: string | null;
        entityType: string | null;
        body: string | null;
        isRead: boolean;
    }>>;
    unreadCount(userId: string): Promise<number>;
    markRead(notificationId: string, userId: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    delete(notificationId: string, userId: string): Promise<void>;
};
//# sourceMappingURL=notifications.service.d.ts.map