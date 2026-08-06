-- AlterEnum: Add matrimony notification types to NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_INTEREST_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_INTEREST_ACCEPTED';
