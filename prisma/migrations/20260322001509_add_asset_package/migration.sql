-- CreateTable
CREATE TABLE "AssetPackage" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "opportunityAssessmentId" TEXT,
    "mode" TEXT NOT NULL,
    "adHooks" JSONB NOT NULL,
    "adScripts" JSONB NOT NULL,
    "landingPage" JSONB NOT NULL,
    "emailSequences" JSONB NOT NULL,
    "executionChecklist" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetPackage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssetPackage" ADD CONSTRAINT "AssetPackage_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPackage" ADD CONSTRAINT "AssetPackage_opportunityAssessmentId_fkey" FOREIGN KEY ("opportunityAssessmentId") REFERENCES "OpportunityAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
