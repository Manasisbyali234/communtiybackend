import { ReportReason, ReportStatus } from '@prisma/client';
export declare const moderationService: {
    submitReport(reporterId: string, data: {
        postId?: string;
        reportedUserId?: string;
        reason: ReportReason;
        details?: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.ReportStatus;
        id: string;
        createdAt: Date;
        postId: string | null;
        reason: import(".prisma/client").$Enums.ReportReason;
        details: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        resolution: string | null;
        reporterId: string;
        reportedUserId: string | null;
    }>;
    listReports(params: {
        status?: ReportStatus;
        skip?: number;
        take?: number;
    }): Promise<({
        post: {
            id: string;
            content: string;
        } | null;
        reporter: {
            id: string;
            username: string;
        };
        reportedUser: {
            id: string;
            username: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.ReportStatus;
        id: string;
        createdAt: Date;
        postId: string | null;
        reason: import(".prisma/client").$Enums.ReportReason;
        details: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        resolution: string | null;
        reporterId: string;
        reportedUserId: string | null;
    })[]>;
    updateReport(reportId: string, status: ReportStatus): Promise<{
        status: import(".prisma/client").$Enums.ReportStatus;
        id: string;
        createdAt: Date;
        postId: string | null;
        reason: import(".prisma/client").$Enums.ReportReason;
        details: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        resolution: string | null;
        reporterId: string;
        reportedUserId: string | null;
    }>;
    banUser(userId: string): Promise<void>;
    unbanUser(userId: string): Promise<void>;
    removePost(postId: string): Promise<void>;
};
//# sourceMappingURL=moderation.service.d.ts.map