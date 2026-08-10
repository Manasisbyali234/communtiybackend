-- ============================================================
-- COMPLETE DEPLOYMENT SQL FOR HOSTED SERVER
-- Run this on your hosted PostgreSQL database
-- Then deploy new backend code + restart server
-- ============================================================

-- 1. Add MATRIMONY_MATCH enum value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'NotificationType' AND e.enumlabel = 'MATRIMONY_MATCH'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'MATRIMONY_MATCH';
  END IF;
END$$;

-- 2. Create MatrimonyLike table
CREATE TABLE IF NOT EXISTS "MatrimonyLike" (
    "id"            TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId"   TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatrimonyLike_pkey" PRIMARY KEY ("id")
);

-- 3. Create MatrimonyMatch table
CREATE TABLE IF NOT EXISTS "MatrimonyMatch" (
    "id"             TEXT NOT NULL,
    "profileAId"     TEXT NOT NULL,
    "profileBId"     TEXT NOT NULL,
    "conversationId" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatrimonyMatch_pkey" PRIMARY KEY ("id")
);

-- 4. Indexes for MatrimonyLike
CREATE UNIQUE INDEX IF NOT EXISTS "MatrimonyLike_fromProfileId_toProfileId_key"
    ON "MatrimonyLike"("fromProfileId","toProfileId");
CREATE INDEX IF NOT EXISTS "MatrimonyLike_fromProfileId_idx" ON "MatrimonyLike"("fromProfileId");
CREATE INDEX IF NOT EXISTS "MatrimonyLike_toProfileId_idx"   ON "MatrimonyLike"("toProfileId");

-- 5. Indexes for MatrimonyMatch
CREATE UNIQUE INDEX IF NOT EXISTS "MatrimonyMatch_profileAId_profileBId_key"
    ON "MatrimonyMatch"("profileAId","profileBId");
CREATE INDEX IF NOT EXISTS "MatrimonyMatch_profileAId_idx" ON "MatrimonyMatch"("profileAId");
CREATE INDEX IF NOT EXISTS "MatrimonyMatch_profileBId_idx" ON "MatrimonyMatch"("profileBId");

-- 6. Foreign keys for MatrimonyLike (safe — only adds if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'MatrimonyLike_fromProfileId_fkey'
  ) THEN
    ALTER TABLE "MatrimonyLike"
      ADD CONSTRAINT "MatrimonyLike_fromProfileId_fkey"
      FOREIGN KEY ("fromProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'MatrimonyLike_toProfileId_fkey'
  ) THEN
    ALTER TABLE "MatrimonyLike"
      ADD CONSTRAINT "MatrimonyLike_toProfileId_fkey"
      FOREIGN KEY ("toProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
  END IF;
END$$;

-- 7. Foreign keys for MatrimonyMatch
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'MatrimonyMatch_profileAId_fkey'
  ) THEN
    ALTER TABLE "MatrimonyMatch"
      ADD CONSTRAINT "MatrimonyMatch_profileAId_fkey"
      FOREIGN KEY ("profileAId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'MatrimonyMatch_profileBId_fkey'
  ) THEN
    ALTER TABLE "MatrimonyMatch"
      ADD CONSTRAINT "MatrimonyMatch_profileBId_fkey"
      FOREIGN KEY ("profileBId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE;
  END IF;
END$$;

-- 8. Seed/fix admin user (password = Admin@1234)
INSERT INTO "User" (
    "id","email","username","passwordHash","displayName",
    "role","isVerified","isActive","isBanned","createdAt","updatedAt"
) VALUES (
    'admin_hosted_001',
    'admin@community.app',
    'adminuser',
    '$2a$12$vndJbhbMzsFQyAGCRGqq5.qihCGtvEDa.IydNjzXZdKud1kp821lS',
    'Admin User',
    'ADMIN',
    true, true, false,
    NOW(), NOW()
)
ON CONFLICT ("email") DO UPDATE SET
    "passwordHash" = '$2a$12$vndJbhbMzsFQyAGCRGqq5.qihCGtvEDa.IydNjzXZdKud1kp821lS',
    "role"         = 'ADMIN',
    "isVerified"   = true,
    "isActive"     = true,
    "updatedAt"    = NOW();

-- 9. Verify everything
SELECT '=== VERIFICATION ===' as info;
SELECT id, email, role, "isVerified" FROM "User" WHERE email = 'admin@community.app';
SELECT 'MatrimonyLike table' as tbl, COUNT(*) as rows FROM "MatrimonyLike";
SELECT 'MatrimonyMatch table' as tbl, COUNT(*) as rows FROM "MatrimonyMatch";
SELECT enumlabel FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'NotificationType' AND e.enumlabel = 'MATRIMONY_MATCH';
