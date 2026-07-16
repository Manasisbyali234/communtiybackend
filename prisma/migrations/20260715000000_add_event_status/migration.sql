-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable: add status column defaulting to APPROVED so existing events stay visible
ALTER TABLE "Event" ADD COLUMN "status" "EventStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");
