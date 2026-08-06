-- CreateEnum
CREATE TYPE "MatrimonyApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add approvalStatus and rejectionReason to MatrimonyProfile
ALTER TABLE "MatrimonyProfile"
  ADD COLUMN "approvalStatus"  "MatrimonyApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "MatrimonyProfile_approvalStatus_idx" ON "MatrimonyProfile"("approvalStatus");

-- AlterEnum: add new notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_PROFILE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_PROFILE_REJECTED';
