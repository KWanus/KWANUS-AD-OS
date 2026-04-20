-- CreateTable
CREATE TABLE "NicheResearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "location" TEXT,
    "competitorUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scans" JSONB NOT NULL,
    "intelligence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NicheResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteFormSubmission" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "pageId" TEXT,
    "blockId" TEXT,
    "data" JSONB NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NicheResearch_userId_idx" ON "NicheResearch"("userId");

-- CreateIndex
CREATE INDEX "SiteFormSubmission_siteId_createdAt_idx" ON "SiteFormSubmission"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "NicheResearch" ADD CONSTRAINT "NicheResearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
