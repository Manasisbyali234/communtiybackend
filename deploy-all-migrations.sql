-- ============================================================
-- COMPLETE MIGRATION SQL FOR HOSTED SERVER
-- Applies all missing migrations in order:
--   20260808 - matrimony notifications
--   20260809 - matrimony approval status
--   20260810 - matrimony likes & matches
-- Plus: seeds admin user
-- ============================================================

-- ── Migration 20260808: Matrimony Notification Types ─────────────────────────
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_INTEREST_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_INTEREST_ACCEPTED';

-- ── Migration 20260809: Matrimony Approval Status ────────────────────────────

-- Create enum (safe)
DO $$ BEGIN
  CREATE TYPE "MatrimonyApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add columns to MatrimonyProfile (safe)
ALTER TABLE "MatrimonyProfile"
  ADD COLUMN IF NOT EXISTS "approvalStatus"  "MatrimonyApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Add index (safe)
CREATE INDEX IF NOT EXISTS "MatrimonyProfile_approvalStatus_idx"
  ON "MatrimonyProfile"("approvalStatus");

-- Add notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_PROFILE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_PROFILE_REJECTED';

-- ── Migration 20260810: Matrimony Likes & Matches ────────────────────────────

-- Add MATRIMONY_MATCH notification type
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATRIMONY_MATCH';

-- Create MatrimonyLike table
CREATE TABLE IF NOT EXISTS "MatrimonyLike" (
    "id"            TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId"   TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatrimonyLike_pkey" PRIMARY KEY ("id")
);

-- Create MatrimonyMatch table
CREATE TABLE IF NOT EXISTS "MatrimonyMatch" (
    "id"             TEXT NOT NULL,
    "profileAId"     TEXT NOT NULL,
    "profileBId"     TEXT NOT NULL,
    "conversationId" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatrimonyMatch_pkey" PRIMARY KEY ("id")
);

-- Indexes for MatrimonyLike
CREATE UNIQUE INDEX IF NOT EXISTS "MatrimonyLike_fromProfileId_toProfileId_key"
  ON "MatrimonyLike"("fromProfileId","toProfileId");
CREATE INDEX IF NOT EXISTS "MatrimonyLike_fromProfileId_idx" ON "MatrimonyLike"("fromProfileId");
CREATE INDEX IF NOT EXISTS "MatrimonyLike_toProfileId_idx"   ON "MatrimonyLike"("toProfileId");

-- Indexes for MatrimonyMatch
CREATE UNIQUE INDEX IF NOT EXISTS "MatrimonyMatch_profileAId_profileBId_key"
  ON "MatrimonyMatch"("profileAId","profileBId");
CREATE INDEX IF NOT EXISTS "MatrimonyMatch_profileAId_idx" ON "MatrimonyMatch"("profileAId");
CREATE INDEX IF NOT EXISTS "MatrimonyMatch_profileBId_idx" ON "MatrimonyMatch"("profileBId");

-- Foreign keys for MatrimonyLike
DO $$ BEGIN
  ALTER TABLE "MatrimonyLike"
    ADD CONSTRAINT "MatrimonyLike_fromProfileId_fkey"
    FOREIGN KEY ("fromProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MatrimonyLike"
    ADD CONSTRAINT "MatrimonyLike_toProfileId_fkey"
    FOREIGN KEY ("toProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign keys for MatrimonyMatch
DO $$ BEGIN
  ALTER TABLE "MatrimonyMatch"
    ADD CONSTRAINT "MatrimonyMatch_profileAId_fkey"
    FOREIGN KEY ("profileAId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MatrimonyMatch"
    ADD CONSTRAINT "MatrimonyMatch_profileBId_fkey"
    FOREIGN KEY ("profileBId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Seed Admin User ───────────────────────────────────────────────────────────
-- Password: Admin@1234 (bcrypt hash, 12 rounds)
INSERT INTO "User" (
    "id","email","username","passwordHash","displayName",
    "role","isVerified","isActive","isBanned","createdAt","updatedAt"
) VALUES (
    'admin_hosted_001',
    'admin@community.app',
    'adminuser',
    '$2a$12$vndJbhbMzsFQyAGCRGqq5.qihCGtvEDa.IydNjzXZdKud1kp821lS',
    'Admin User',
    'ADMIN', true, true, false,
    NOW(), NOW()
)
ON CONFLICT ("email") DO UPDATE SET
    "passwordHash" = '$2a$12$vndJbhbMzsFQyAGCRGqq5.qihCGtvEDa.IydNjzXZdKud1kp821lS',
    "role"         = 'ADMIN',
    "isVerified"   = true,
    "isActive"     = true,
    "updatedAt"    = NOW();

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT '=== VERIFICATION ===' AS info;
SELECT id, email, role, "isVerified" FROM "User" WHERE email = 'admin@community.app';
SELECT 'MatrimonyLike'  AS tbl, COUNT(*) AS rows FROM "MatrimonyLike";
SELECT 'MatrimonyMatch' AS tbl, COUNT(*) AS rows FROM "MatrimonyMatch";
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'MatrimonyProfile' AND column_name = 'approvalStatus';
