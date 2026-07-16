-- Add sharesCount to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sharesCount" INTEGER NOT NULL DEFAULT 0;

-- Add EVENT_SHARE notification type
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_SHARE';
