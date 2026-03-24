-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "mode" TEXT NOT NULL,
    "inputUrl" TEXT NOT NULL,
    "linkType" TEXT,
    "title" TEXT,
    "score" INTEGER,
    "verdict" TEXT,
    "confidence" TEXT,
    "summary" TEXT,
    "rawSignals" JSONB,
    "decisionPacket" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);
