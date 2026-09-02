-- Existing accounts stay approved; newly registered accounts are created as PENDING by auth.service.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "approvalHistory" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "User"
SET "approvalStatus" = 'APPROVED'
WHERE "approvalStatus" IS NULL;

CREATE INDEX IF NOT EXISTS "User_approvalStatus_idx" ON "User"("approvalStatus");
