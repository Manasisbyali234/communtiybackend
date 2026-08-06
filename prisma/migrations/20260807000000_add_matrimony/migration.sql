-- CreateEnum
CREATE TYPE "MatrimonyGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MatrimonyMaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "MatrimonyEducation" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER');

-- CreateEnum
CREATE TYPE "MatrimonyInterestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "MatrimonyProfile" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "displayName"      TEXT NOT NULL,
    "gender"           "MatrimonyGender" NOT NULL,
    "dateOfBirth"      DATE NOT NULL,
    "height"           TEXT NOT NULL DEFAULT '',
    "maritalStatus"    "MatrimonyMaritalStatus" NOT NULL DEFAULT 'NEVER_MARRIED',
    "religion"         TEXT NOT NULL DEFAULT '',
    "caste"            TEXT,
    "motherTongue"     TEXT NOT NULL DEFAULT '',
    "education"        "MatrimonyEducation" NOT NULL DEFAULT 'OTHER',
    "educationDetails" TEXT,
    "occupation"       TEXT NOT NULL DEFAULT '',
    "annualIncome"     TEXT,
    "city"             TEXT NOT NULL,
    "state"            TEXT NOT NULL DEFAULT '',
    "aboutMe"          TEXT,
    "hobbies"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "diet"             TEXT,
    "familyType"       TEXT,
    "fatherOccupation" TEXT,
    "motherOccupation" TEXT,
    "siblings"         INTEGER,
    "photos"           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isVerified"       BOOLEAN NOT NULL DEFAULT false,
    "isActive"         BOOLEAN NOT NULL DEFAULT true,
    "partnerMinAge"    INTEGER,
    "partnerMaxAge"    INTEGER,
    "partnerReligion"  TEXT,
    "partnerCaste"     TEXT,
    "partnerEducation" TEXT,
    "partnerCity"      TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatrimonyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatrimonyInterest" (
    "id"            TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId"   TEXT NOT NULL,
    "status"        "MatrimonyInterestStatus" NOT NULL DEFAULT 'PENDING',
    "message"       TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatrimonyInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatrimonyProfile_userId_key" ON "MatrimonyProfile"("userId");

-- CreateIndex
CREATE INDEX "MatrimonyProfile_gender_idx" ON "MatrimonyProfile"("gender");

-- CreateIndex
CREATE INDEX "MatrimonyProfile_religion_idx" ON "MatrimonyProfile"("religion");

-- CreateIndex
CREATE INDEX "MatrimonyProfile_city_idx" ON "MatrimonyProfile"("city");

-- CreateIndex
CREATE INDEX "MatrimonyProfile_isActive_idx" ON "MatrimonyProfile"("isActive");

-- CreateIndex
CREATE INDEX "MatrimonyProfile_createdAt_idx" ON "MatrimonyProfile"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MatrimonyInterest_fromProfileId_toProfileId_key" ON "MatrimonyInterest"("fromProfileId", "toProfileId");

-- CreateIndex
CREATE INDEX "MatrimonyInterest_fromProfileId_idx" ON "MatrimonyInterest"("fromProfileId");

-- CreateIndex
CREATE INDEX "MatrimonyInterest_toProfileId_idx" ON "MatrimonyInterest"("toProfileId");

-- CreateIndex
CREATE INDEX "MatrimonyInterest_status_idx" ON "MatrimonyInterest"("status");

-- AddForeignKey
ALTER TABLE "MatrimonyProfile" ADD CONSTRAINT "MatrimonyProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatrimonyInterest" ADD CONSTRAINT "MatrimonyInterest_fromProfileId_fkey"
    FOREIGN KEY ("fromProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatrimonyInterest" ADD CONSTRAINT "MatrimonyInterest_toProfileId_fkey"
    FOREIGN KEY ("toProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
