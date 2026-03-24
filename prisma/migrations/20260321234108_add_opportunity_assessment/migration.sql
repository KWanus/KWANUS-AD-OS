-- CreateTable
CREATE TABLE "OpportunityAssessment" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalScore" INTEGER,
    "demandPotential" INTEGER,
    "offerStrength" INTEGER,
    "emotionalLeverage" INTEGER,
    "trustCredibility" INTEGER,
    "conversionReadiness" INTEGER,
    "adViability" INTEGER,
    "emailLifecyclePotential" INTEGER,
    "seoPotential" INTEGER,
    "differentiation" INTEGER,
    "risk" INTEGER,
    "topGaps" JSONB,
    "topStrengths" JSONB,
    "recommendedPath" TEXT,
    "opportunityPacket" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityAssessment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OpportunityAssessment" ADD CONSTRAINT "OpportunityAssessment_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
