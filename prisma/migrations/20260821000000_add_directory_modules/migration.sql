CREATE TABLE "BusinessListing" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "productsServices" TEXT NOT NULL DEFAULT '',
  "location" TEXT NOT NULL,
  "address" TEXT, "website" TEXT, "whatsapp" TEXT, "phone" TEXT, "email" TEXT,
  "logoUrl" TEXT, "coverUrl" TEXT, "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "offers" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING', "rejectionReason" TEXT,
  "approvedAt" TIMESTAMP(3), "rejectedAt" TIMESTAMP(3), "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessListing_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BusinessReview" (
  "id" TEXT NOT NULL, "businessId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "reviewerName" TEXT NOT NULL, "rating" INTEGER NOT NULL, "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunityHelpRequest" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "category" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL, "location" TEXT NOT NULL, "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
  "contactPreference" TEXT NOT NULL DEFAULT 'IN_APP', "status" TEXT NOT NULL DEFAULT 'PENDING',
  "rejectionReason" TEXT, "resolvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CommunityHelpRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunityHelpOffer" (
  "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "userId" TEXT NOT NULL, "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CommunityHelpOffer_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunityProfileStory" (
  "id" TEXT NOT NULL, "authorId" TEXT NOT NULL, "title" TEXT NOT NULL, "personName" TEXT NOT NULL,
  "profession" TEXT NOT NULL DEFAULT '', "location" TEXT NOT NULL DEFAULT '', "category" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL, "fullStory" TEXT NOT NULL, "featuredImage" TEXT NOT NULL,
  "additionalImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityProfileStory_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "BusinessListing" ADD CONSTRAINT "BusinessListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessReview" ADD CONSTRAINT "BusinessReview_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityHelpRequest" ADD CONSTRAINT "CommunityHelpRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityHelpOffer" ADD CONSTRAINT "CommunityHelpOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CommunityHelpRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityHelpOffer" ADD CONSTRAINT "CommunityHelpOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityProfileStory" ADD CONSTRAINT "CommunityProfileStory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "BusinessReview_businessId_userId_key" ON "BusinessReview"("businessId", "userId");
CREATE UNIQUE INDEX "CommunityHelpOffer_requestId_userId_key" ON "CommunityHelpOffer"("requestId", "userId");
CREATE INDEX "BusinessListing_status_idx" ON "BusinessListing"("status");
CREATE INDEX "CommunityHelpRequest_status_idx" ON "CommunityHelpRequest"("status");
CREATE INDEX "CommunityProfileStory_status_idx" ON "CommunityProfileStory"("status");
