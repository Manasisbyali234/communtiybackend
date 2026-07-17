-- CreateTable
CREATE TABLE "MarketRate" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "arrivalDate" DATE NOT NULL,
    "variety" TEXT NOT NULL DEFAULT 'Other',
    "grade" TEXT NOT NULL DEFAULT 'FAQ',
    "minPrice" DOUBLE PRECISION NOT NULL,
    "modalPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketRate_cropName_idx" ON "MarketRate"("cropName");

-- CreateIndex
CREATE INDEX "MarketRate_arrivalDate_idx" ON "MarketRate"("arrivalDate" DESC);

-- CreateIndex
CREATE INDEX "MarketRate_cropName_arrivalDate_idx" ON "MarketRate"("cropName", "arrivalDate");
