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
        reason: import(".prisma/client").$Enums.ReportReason;
        postId: string | null;
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
        };
        reporter: {
            id: string;
            username: string;
        };
        reportedUser: {
            id: string;
            username: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ReportStatus;
        id: string;
        createdAt: Date;
        reason: import(".prisma/client").$Enums.ReportReason;
        postId: string | null;
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
        reason: import(".prisma/client").$Enums.ReportReason;
        postId: string | null;
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