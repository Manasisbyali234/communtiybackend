-- CreateEnum
CREATE TYPE "CommunityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_REJECTED';

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_creatorId_fkey";

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "status" "CommunityStatus" NOT NULL DEFAULT 'PENDING';
