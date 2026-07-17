import { Role } from '@prisma/client';

// ── JWT payload ────────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ── Auth token pair ────────────────────────────────────────────────────────────
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Socket user ────────────────────────────────────────────────────────────────
export interface SocketUser {
  id: string;
  email: string;
  role: Role;
}

// ── Notification payload ───────────────────────────────────────────────────────
export interface NotificationPayload {
  recipientId: string;
  type: string;
  actorId?: string;
  entityId?: string;
  entityType?: string;
  body: string;
}

// ── Email job data ─────────────────────────────────────────────────────────────
export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

// ── Push job data ──────────────────────────────────────────────────────────────
export interface PushJobData {
  expoPushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ── Media job data ─────────────────────────────────────────────────────────────
export interface MediaJobData {
  key: string;
  purpose: string;
}

// ── Story expiry job data ──────────────────────────────────────────────────────
export interface StoryExpiryJobData {
  storyId: string;
}

// ── Event reminder job data ────────────────────────────────────────────────────
export interface EventReminderJobData {
  eventId: string;
}
