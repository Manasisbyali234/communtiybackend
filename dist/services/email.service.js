"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_1 = require("../config/index");
const logger_1 = require("../config/logger");
function createTransport() {
    if (!index_1.config.SMTP_HOST || !index_1.config.SMTP_PORT) {
        return null;
    }
    return nodemailer_1.default.createTransport({
        host: index_1.config.SMTP_HOST,
        port: index_1.config.SMTP_PORT,
        secure: index_1.config.SMTP_PORT === 465,
        auth: { user: index_1.config.SMTP_USER, pass: index_1.config.SMTP_PASS },
    });
}
const transporter = createTransport();
exports.emailService = {
    async send(job) {
        if (!transporter) {
            // Dev stub — log to console instead
            logger_1.logger.info({ to: job.to, subject: job.subject }, '📧 [DEV EMAIL STUB]');
            logger_1.logger.debug(job.html);
            return;
        }
        await transporter.sendMail({
            from: index_1.config.EMAIL_FROM,
            to: job.to,
            subject: job.subject,
            html: job.html,
        });
    },
    async sendOtp(to, code, type) {
        const subject = type === 'VERIFY_EMAIL' ? 'Verify your email' : 'Reset your password';
        const action = type === 'VERIFY_EMAIL' ? 'verify your email address' : 'reset your password';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="color: #2D6A2D;">Community App</h2>
        <p>Use the code below to ${action}. It expires in ${index_1.config.OTP_EXPIRY_MINUTES} minutes.</p>
        <div style="background: #f4f9f0; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2D6A2D;">${code}</span>
        </div>
        <p style="color: #666; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;
        await this.send({ to, subject, html });
    },
};
//# sourceMappingURL=email.service.js.map