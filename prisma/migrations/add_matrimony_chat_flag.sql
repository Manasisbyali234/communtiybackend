-- Migration: matrimony chat on mutual interest/like
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "isMatrimonyChat" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MatrimonyInterest" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "MatrimonyInterest_conversationId_key" ON "MatrimonyInterest"("conversationId");
