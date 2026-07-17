-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable: add status column defaulting to APPROVED (so existing posts stay visible)
ALTER TABLE "Post" ADD COLUMN "status" "PostStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");
