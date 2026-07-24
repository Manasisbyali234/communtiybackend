-- AlterTable: add referredById to User
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;

-- AddForeignKey for referredById
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: ProfileShare
CREATE TABLE "ProfileShare" (
    "id"           TEXT NOT NULL,
    "sharerId"     TEXT NOT NULL,
    "sharedWith"   TEXT,
    "sharedEmail"  TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileShare_sharerId_idx" ON "ProfileShare"("sharerId");
CREATE INDEX "ProfileShare_createdAt_idx" ON "ProfileShare"("createdAt" DESC);

-- AddForeignKey for ProfileShare.sharerId
ALTER TABLE "ProfileShare" ADD CONSTRAINT "ProfileShare_sharerId_fkey"
  FOREIGN KEY ("sharerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
