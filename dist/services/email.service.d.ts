import { EmailJobData } from '../types/index';
export declare const emailService: {
    send(job: EmailJobData): Promise<void>;
    sendOtp(to: string, code: string, type: "VERIFY_EMAIL" | "RESET_PASSWORD"): Promise<void>;
};
//# sourceMappingURL=email.service.d.ts.map