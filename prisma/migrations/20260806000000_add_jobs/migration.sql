-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('WORK_FROM_OFFICE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED');

-- CreateTable
CREATE TABLE "Job" (
    "id"             TEXT NOT NULL,
    "companyLogo"    TEXT,
    "companyName"    TEXT NOT NULL,
    "jobTitle"       TEXT NOT NULL,
    "description"    TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "workMode"       "WorkMode" NOT NULL,
    "salaryLPA"      TEXT NOT NULL,
    "address"        TEXT,
    "location"       TEXT NOT NULL,
    "experience"     TEXT NOT NULL,
    "education"      TEXT,
    "requiredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "vacancyCount"   INTEGER NOT NULL DEFAULT 1,
    "applyCount"     INTEGER NOT NULL DEFAULT 0,
    "lastDate"       TIMESTAMP(3),
    "hrContact"      TEXT,
    "hrEmail"        TEXT,
    "status"         "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id"        TEXT NOT NULL,
    "jobId"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "status"    "JobApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "JobApplication_jobId_idx" ON "JobApplication"("jobId");

-- CreateIndex
CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "JobApplication_userId_jobId_key" ON "JobApplication"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
