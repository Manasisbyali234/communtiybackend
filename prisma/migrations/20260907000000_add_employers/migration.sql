-- Employer directory backing the admin Jobs screens.
-- This migration is deliberately safe to apply to deployments where Jobs
-- already exists but the employer table was never deployed.
CREATE TABLE IF NOT EXISTS "Employer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "employerId" TEXT;

CREATE INDEX IF NOT EXISTS "Employer_name_idx" ON "Employer"("name");
CREATE INDEX IF NOT EXISTS "Employer_isActive_idx" ON "Employer"("isActive");
CREATE INDEX IF NOT EXISTS "Employer_createdAt_idx" ON "Employer"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Job_employerId_idx" ON "Job"("employerId");

DO $$ BEGIN
  ALTER TABLE "Job" ADD CONSTRAINT "Job_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
