-- Add phone to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Add likesCount and commentsCount to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "likesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "commentsCount" INTEGER NOT NULL DEFAULT 0;

-- Add new NotificationType values
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_LIKE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_COMMENT';

-- EventLike table
CREATE TABLE IF NOT EXISTS "EventLike" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventLike_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EventLike_eventId_userId_key" ON "EventLike"("eventId", "userId");
CREATE INDEX IF NOT EXISTS "EventLike_eventId_idx" ON "EventLike"("eventId");
CREATE INDEX IF NOT EXISTS "EventLike_userId_idx" ON "EventLike"("userId");
ALTER TABLE "EventLike" ADD CONSTRAINT "EventLike_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventLike" ADD CONSTRAINT "EventLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventComment table
CREATE TABLE IF NOT EXISTS "EventComment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EventComment_eventId_idx" ON "EventComment"("eventId");
CREATE INDEX IF NOT EXISTS "EventComment_authorId_idx" ON "EventComment"("authorId");
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
