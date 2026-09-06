import https from 'https';
import { config } from '../config/index';
import { logger } from '../config/logger';
import { EmailJobData } from '../types/index';

async function zeptoSend(to: string, subject: string, html: string): Promise<void> {
  const body = JSON.stringify({
    from: { address: config.EMAIL_FROM, name: 'GowdaCommunity' },
    to: [{ email_address: { address: to } }],
    subject,
    htmlbody: html,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.zeptomail.in',
        path: '/v1.1/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Zoho-enczapikey ${config.SMTP_PASS}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Zepto API error ${res.statusCode}: ${data}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const baseStyle = `
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const header = (title: string) => `
  <div style="background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); padding: 32px 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">GowdaCommunity</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">${title}</p>
  </div>
`;

const footer = () => `
  <div style="background: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} GowdaCommunity. All rights reserved.<br/>
      If you did not create an account, please ignore this email.
    </p>
  </div>
`;

export const emailService = {
  async send(job: EmailJobData): Promise<void> {
    if (!config.SMTP_PASS) {
      logger.info({ to: job.to, subject: job.subject }, '📧 [DEV EMAIL STUB]');
      return;
    }
    try {
      await zeptoSend(job.to, job.subject, job.html);
      logger.info({ to: job.to }, '📧 Email sent');
    } catch (err) {
      logger.error({ err, to: job.to, subject: job.subject }, '📧 Email send failed');
      throw err;
    }
  },

  // ── Email 1: Welcome Email after Registration ─────────────────────────────
  async sendWelcome(to: string, displayName: string, username: string): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        ${header('Welcome to GowdaCommunity! 🎉')}
        <div style="padding: 32px 24px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 8px;">Hello, ${displayName}! 👋</h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
            Welcome to <strong>GowdaCommunity</strong> — your community platform for connecting, sharing, and growing together.
          </p>
          <div style="background: #f0fdf4; border-left: 4px solid #16A34A; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">Your account details:</p>
            <p style="margin: 6px 0 0; color: #374151; font-size: 14px;">👤 Name: <strong>${displayName}</strong></p>
            <p style="margin: 4px 0 0; color: #374151; font-size: 14px;">🔖 Username: <strong>@${username}</strong></p>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">Here's what you can do next:</p>
          <ul style="color: #374151; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0 0 24px;">
            <li>Complete your profile to get discovered</li>
            <li>Join communities that match your interests</li>
            <li>Connect with other members</li>
            <li>Explore matrimony, jobs, and events</li>
          </ul>
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">
            Your account is currently under review. You will be notified once approved.
          </p>
        </div>
        ${footer()}
      </div>
    `;
    await this.send({ to, subject: `Welcome to GowdaCommunity, ${displayName}! 🎉`, html });
  },

  // ── Email 2: Profile Approved ─────────────────────────────────────────────
  async sendProfileApproved(to: string, displayName: string): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        ${header('Profile Approved ✅')}
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #f0fdf4; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">✅</div>
          </div>
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 12px; text-align: center;">Congratulations, ${displayName}!</h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
            Your profile has been <strong style="color: #16A34A;">approved</strong> by our admin team. You now have full access to GowdaCommunity!
          </p>
          <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #166534; font-size: 14px; font-weight: 700; margin: 0 0 10px;">🎊 You can now:</p>
            <ul style="color: #374151; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0;">
              <li>Post and interact in communities</li>
              <li>Browse and connect with members</li>
              <li>Access matrimony profiles</li>
              <li>Apply for jobs and attend events</li>
            </ul>
          </div>
          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
            Open the app to get started. Welcome aboard! 🙏
          </p>
        </div>
        ${footer()}
      </div>
    `;
    await this.send({ to, subject: `Your GowdaCommunity profile has been approved! ✅`, html });
  },

  // ── Email 3: Matrimony Profile Created ───────────────────────────────────
  async sendMatrimonyProfileCreated(to: string, displayName: string): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        ${header('Matrimony Profile Submitted 💍')}
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #fdf2f8; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">💍</div>
          </div>
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 12px; text-align: center;">Hello, ${displayName}!</h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
            Your matrimony profile has been <strong>successfully submitted</strong> and is currently under review by our team.
          </p>
          <div style="background: #fdf2f8; border-left: 4px solid #ec4899; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="color: #9d174d; font-size: 14px; font-weight: 600; margin: 0 0 6px;">⏳ What happens next?</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              Our admin team will review your profile within 24–48 hours. Once approved, your profile will be visible to other members and you can start connecting.
            </p>
          </div>
          <div style="background: #f9fafb; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 8px;">💡 Tips for a great profile:</p>
            <ul style="color: #6b7280; font-size: 13px; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li>Upload clear, recent photos</li>
              <li>Fill in all details accurately</li>
              <li>Write a genuine "About Me" section</li>
            </ul>
          </div>
          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
            You will receive another email once your profile is approved. 🙏
          </p>
        </div>
        ${footer()}
      </div>
    `;
    await this.send({ to, subject: `Your matrimony profile has been submitted for review 💍`, html });
  },

  // ── Email 4: Event Approved ───────────────────────────────────────────────
  async sendEventApproved(to: string, displayName: string, eventTitle: string, eventDate: Date, eventLocation?: string | null): Promise<void> {
    const dateStr = eventDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const html = `
      <div style="${baseStyle}">
        ${header('Event Approved 🎊')}
        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #fffbeb; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">🎊</div>
          </div>
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 12px; text-align: center;">Great news, ${displayName}!</h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
            Your event has been <strong style="color: #16A34A;">approved</strong> and is now live on GowdaCommunity!
          </p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
            <p style="color: #166534; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px;">📅 Event Details</p>
            <p style="color: #111827; font-size: 18px; font-weight: 800; margin: 0 0 12px;">${eventTitle}</p>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <p style="color: #374151; font-size: 14px; margin: 0;">🗓️ <strong>Date:</strong> ${dateStr}</p>
              <p style="color: #374151; font-size: 14px; margin: 0;">⏰ <strong>Time:</strong> ${timeStr}</p>
              ${eventLocation ? `<p style="color: #374151; font-size: 14px; margin: 0;">📍 <strong>Location:</strong> ${eventLocation}</p>` : ''}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
            Members can now discover and RSVP to your event. Share it with your community to get more attendees!
          </p>
          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 16px 0 0;">
            Open the app to view your event and manage RSVPs. 🙌
          </p>
        </div>
        ${footer()}
      </div>
    `;
    await this.send({ to, subject: `Your event "${eventTitle}" has been approved! 🎊`, html });
  },

  // ── OTP Email ─────────────────────────────────────────────────────────────
  async sendOtp(to: string, code: string, type: 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'OTP_LOGIN'): Promise<void> {
    const subject =
      type === 'VERIFY_EMAIL' ? 'Verify your email' :
      type === 'OTP_LOGIN' ? 'Your login code' :
      'Reset your password';
    const action =
      type === 'VERIFY_EMAIL' ? 'verify your email address' :
      type === 'OTP_LOGIN' ? 'log in to your account' :
      'reset your password';
    const html = `
      <div style="${baseStyle}">
        ${header(type === 'VERIFY_EMAIL' ? 'Email Verification' : 'Password Reset')}
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
            Use the code below to ${action}. It expires in <strong>${config.OTP_EXPIRY_MINUTES} minutes</strong>.
          </p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 28px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #16A34A;">${code}</span>
          </div>
          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
        ${footer()}
      </div>
    `;
    await this.send({ to, subject, html });
  },

  async sendAdminAlert(to: string, subject: string, body: string): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        ${header('Admin Alert')}
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">${body}</p>
          <p style="color: #9ca3af; font-size: 13px;">Log in to the admin panel to review and take action.</p>
        </div>
        ${footer()}
      </div>
    `;
    await this.send({ to, subject, html });
  },
};
