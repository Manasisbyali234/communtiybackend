-- CreateTable
CREATE TABLE "MatrimonyLike" (
    "id" TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatrimonyLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatrimonyMatch" (
    "id" TEXT NOT NULL,
    "profileAId" TEXT NOT NULL,
    "profileBId" TEXT NOT NULL,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatrimonyMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatrimonyLike_fromProfileId_toProfileId_key" ON "MatrimonyLike"("fromProfileId", "toProfileId");
CREATE INDEX "MatrimonyLike_fromProfileId_idx" ON "MatrimonyLike"("fromProfileId");
CREATE INDEX "MatrimonyLike_toProfileId_idx" ON "MatrimonyLike"("toProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "MatrimonyMatch_conversationId_key" ON "MatrimonyMatch"("conversationId");
CREATE UNIQUE INDEX "MatrimonyMatch_profileAId_profileBId_key" ON "MatrimonyMatch"("profileAId", "profileBId");
CREATE INDEX "MatrimonyMatch_profileAId_idx" ON "MatrimonyMatch"("profileAId");
CREATE INDEX "MatrimonyMatch_profileBId_idx" ON "MatrimonyMatch"("profileBId");

-- AddForeignKey
ALTER TABLE "MatrimonyLike" ADD CONSTRAINT "MatrimonyLike_fromProfileId_fkey"
    FOREIGN KEY ("fromProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatrimonyLike" ADD CONSTRAINT "MatrimonyLike_toProfileId_fkey"
    FOREIGN KEY ("toProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatrimonyMatch" ADD CONSTRAINT "MatrimonyMatch_profileAId_fkey"
    FOREIGN KEY ("profileAId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatrimonyMatch" ADD CONSTRAINT "MatrimonyMatch_profileBId_fkey"
    FOREIGN KEY ("profileBId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add MATRIMONY_MATCH to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_MATCH';
