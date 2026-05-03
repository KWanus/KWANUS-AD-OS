-- CreateTable
CREATE TABLE "MarketIntelligence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "subNiche" TEXT,
    "vertical" TEXT NOT NULL DEFAULT 'affiliate',
    "executionTier" TEXT NOT NULL DEFAULT 'elite',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "score" INTEGER,
    "topProductName" TEXT,
    "topProductUrl" TEXT,
    "discoveredProducts" JSONB,
    "winnerAnalysis" JSONB,
    "marketSynthesis" JSONB,
    "generatedAssets" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketIntelligence_userId_createdAt_idx" ON "MarketIntelligence"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "MarketIntelligence" ADD CONSTRAINT "MarketIntelligence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
