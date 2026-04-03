import "dotenv/config";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { decide } from "../lib/himalaya/decisionEngine";
import { generateFoundation } from "../lib/himalaya/foundationGenerator";
import type { HimalayaProfileInput } from "../lib/himalaya/profileTypes";

async function main() {
  // 1. Connect to DB
  const url = new URL(process.env.DATABASE_URL!);
  const pool = new pg.Pool({
    host: url.hostname,
    port: parseInt(url.port || "5432", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("1. DB connection...");
  const count = await prisma.analysisRun.count();
  console.log(`   ✅ Connected. ${count} existing runs.\n`);

  // 2. Decide
  console.log("2. Decision engine...");
  const profileInput: HimalayaProfileInput = {
    businessStage: "no_business",
    primaryGoal: "full_business",
    budget: "micro",
    timeAvailable: "parttime",
    skills: ["communication"],
    riskTolerance: "medium",
    niche: "marketing agency",
    description: "Agency. Get first client.",
  };
  const result = decide(profileInput);
  console.log(`   ✅ Path: ${result.primary.path} (${result.primary.confidence}%)\n`);

  // 3. Save profile
  console.log("3. Save HimalayaProfile...");
  const profile = await prisma.himalayaProfile.create({
    data: {
      userId: "test-flow-user",
      budget: profileInput.budget,
      timeAvailable: profileInput.timeAvailable,
      skills: JSON.parse(JSON.stringify(profileInput.skills)),
      riskTolerance: profileInput.riskTolerance,
      primaryGoal: profileInput.primaryGoal,
      businessStage: profileInput.businessStage,
      niche: profileInput.niche ?? null,
      description: profileInput.description ?? null,
      recommendedPath: result.primary.path,
      decisionResult: JSON.parse(JSON.stringify(result)),
    },
  });
  console.log(`   ✅ Profile saved: ${profile.id}\n`);

  // 4. Generate foundation
  console.log("4. Generate foundation...");
  const foundation = generateFoundation(profileInput, "agency");
  console.log(`   ✅ ${foundation.pathLabel}: ${foundation.marketingAngles.length} angles, ${foundation.emailSequence.length} emails\n`);

  // 5. Save as AnalysisRun
  console.log("5. Save AnalysisRun...");
  const analysis = await prisma.analysisRun.create({
    data: {
      userId: "test-flow-user",
      mode: "operator",
      inputUrl: `himalaya://profile/${profile.id}`,
      title: `${foundation.pathLabel}: ${profileInput.niche}`,
      score: 70,
      verdict: "Pursue",
      confidence: "High",
      summary: `Foundation generated for ${foundation.pathLabel}`,
      decisionPacket: {
        audience: foundation.idealCustomer.who,
        painDesire: foundation.businessProfile.painPoint,
        angle: foundation.businessProfile.uniqueAngle,
        strengths: [foundation.offerDirection.coreOffer],
        weaknesses: [],
        nextActions: foundation.actionRoadmap[0]?.tasks.slice(0, 3) ?? [],
      },
      rawSignals: { foundation } as object,
    },
  });
  console.log(`   ✅ AnalysisRun saved: ${analysis.id}\n`);

  // 6. Save AssetPackage
  console.log("6. Save AssetPackage...");
  const asset = await prisma.assetPackage.create({
    data: {
      analysisRunId: analysis.id,
      mode: "operator",
      adHooks: foundation.marketingAngles.map(a => ({ format: a.platform, hook: a.hook })),
      adScripts: [],
      landingPage: foundation.websiteBlueprint as object,
      emailSequences: { welcome: foundation.emailSequence } as object,
      executionChecklist: { phases: foundation.actionRoadmap } as object,
    },
  });
  console.log(`   ✅ AssetPackage saved: ${asset.id}\n`);

  // 7. Verify fetch
  console.log("7. Fetch run back...");
  const fetched = await prisma.analysisRun.findUnique({
    where: { id: analysis.id },
    include: { assetPackages: true },
  });
  console.log(`   ✅ Fetched: ${fetched?.title}, ${fetched?.assetPackages.length} assets\n`);

  // Cleanup
  console.log("8. Cleanup...");
  await prisma.assetPackage.delete({ where: { id: asset.id } });
  await prisma.analysisRun.delete({ where: { id: analysis.id } });
  await prisma.himalayaProfile.delete({ where: { id: profile.id } });
  console.log("   ✅ Cleaned up\n");

  await prisma.$disconnect();
  await pool.end();
  console.log("🎉 FULL FLOW WORKS END-TO-END");
}

main().catch((e) => {
  console.error("❌ FAILED:", e);
  process.exit(1);
});
