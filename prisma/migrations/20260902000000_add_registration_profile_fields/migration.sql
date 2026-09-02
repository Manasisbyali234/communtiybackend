-- Add profile fields collected during community registration.
ALTER TABLE "User"
ADD COLUMN "familyName" TEXT,
ADD COLUMN "dob" TEXT,
ADD COLUMN "gender" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "nativePlace" TEXT,
ADD COLUMN "currentLocation" TEXT,
ADD COLUMN "profession" TEXT,
ADD COLUMN "company" TEXT,
ADD COLUMN "education" TEXT,
ADD COLUMN "skills" TEXT;
