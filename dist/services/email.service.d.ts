import { EmailJobData } from '../types/index';
export declare const emailService: {
    send(job: EmailJobData): Promise<void>;
    sendWelcome(to: string, displayName: string, username: string): Promise<void>;
    sendProfileApproved(to: string, displayName: string): Promise<void>;
    sendMatrimonyProfileCreated(to: string, displayName: string): Promise<void>;
    sendEventApproved(to: string, displayName: string, eventTitle: string, eventDate: Date, eventLocation?: string | null): Promise<void>;
    sendOtp(to: string, code: string, type: "VERIFY_EMAIL" | "RESET_PASSWORD" | "OTP_LOGIN"): Promise<void>;
    sendAdminAlert(to: string, subject: string, body: string): Promise<void>;
};
//# sourceMappingURL=email.service.d.ts.map