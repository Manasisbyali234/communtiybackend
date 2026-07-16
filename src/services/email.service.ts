import nodemailer from 'nodemailer';
import { config } from '../config/index';
import { logger } from '../config/logger';
import { EmailJobData } from '../types/index';

function createTransport() {
  if (!config.SMTP_HOST || !config.SMTP_PORT) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  });
}

const transporter = createTransport();

export const emailService = {
  async send(job: EmailJobData): Promise<void> {
    if (!transporter) {
      // Dev stub — log to console instead
      logger.info({ to: job.to, subject: job.subject }, '📧 [DEV EMAIL STUB]');
      logger.debug(job.html);
      return;
    }
    await transporter.sendMail({
      from: config.EMAIL_FROM,
      to: job.to,
      subject: job.subject,
      html: job.html,
    });
  },

  async sendAdminAlert(to: string, subject: string, body: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="color: #16A34A;">Admin Panel — Action Required</h2>
        <p>${body}</p>
        <p style="color: #666; font-size: 13px;">Log in to the admin panel to review and take action.</p>
      </div>
    `;
    await this.send({ to, subject, html });
  },

  async sendOtp(to: string, code: string, type: 'VERIFY_EMAIL' | 'RESET_PASSWORD'): Promise<void> {
    const subject = type === 'VERIFY_EMAIL' ? 'Verify your email' : 'Reset your password';
    const action = type === 'VERIFY_EMAIL' ? 'verify your email address' : 'reset your password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="color: #2D6A2D;">Community App</h2>
        <p>Use the code below to ${action}. It expires in ${config.OTP_EXPIRY_MINUTES} minutes.</p>
        <div style="background: #f4f9f0; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2D6A2D;">${code}</span>
        </div>
        <p style="color: #666; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;
    await this.send({ to, subject, html });
  },
};
