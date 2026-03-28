-- Add performance indexes for common query patterns

-- AnalysisRun: user timeline and verdict filtering
CREATE INDEX IF NOT EXISTS "AnalysisRun_userId_idx"
  ON "AnalysisRun"("userId");

CREATE INDEX IF NOT EXISTS "AnalysisRun_userId_createdAt_idx"
  ON "AnalysisRun"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "AnalysisRun_userId_verdict_idx"
  ON "AnalysisRun"("userId", "verdict");

-- OpportunityAssessment: join lookups from AnalysisRun
CREATE INDEX IF NOT EXISTS "OpportunityAssessment_analysisRunId_idx"
  ON "OpportunityAssessment"("analysisRunId");

-- Campaign: user project listing and status filtering
CREATE INDEX IF NOT EXISTS "Campaign_userId_idx"
  ON "Campaign"("userId");

CREATE INDEX IF NOT EXISTS "Campaign_userId_status_idx"
  ON "Campaign"("userId", "status");

CREATE INDEX IF NOT EXISTS "Campaign_userId_createdAt_idx"
  ON "Campaign"("userId", "createdAt" DESC);

-- EmailContact: status filtering and timeline queries
CREATE INDEX IF NOT EXISTS "EmailContact_userId_status_idx"
  ON "EmailContact"("userId", "status");

CREATE INDEX IF NOT EXISTS "EmailContact_userId_createdAt_idx"
  ON "EmailContact"("userId", "createdAt" DESC);
