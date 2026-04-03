import { prisma } from "../lib/prisma";
import { decide } from "../lib/himalaya/decisionEngine";
import type { HimalayaProfileInput } from "../lib/himalaya/profileTypes";

async function main() {
  console.log("Testing decide + DB write...\n");

  const body: HimalayaProfileInput = {
    businessStage: "no_business",
    primaryGoal: "full_business",
    budget: "micro",
    timeAvailable: "parttime",
    skills: ["communication"],
    riskTolerance: "medium",
    niche: "test niche",
    description: "Agency. Get first client. Test dream",
  };

  console.log("1. Running decision engine...");
  const result = decide(body);
  console.log(`   Primary: ${result.primary.path} (${result.primary.confidence}%)`);

  console.log("\n2. Writing to HimalayaProfile...");
  try {
    const profile = await prisma.himalayaProfile.create({
      data: {
        userId: "test-user-123",
        budget: body.budget,
        timeAvailable: body.timeAvailable,
        skills: JSON.parse(JSON.stringify(body.skills)),
        riskTolerance: body.riskTolerance,
        primaryGoal: body.primaryGoal,
        businessStage: body.businessStage,
        existingUrl: body.existingUrl ?? null,
        niche: body.niche ?? null,
        description: body.description ?? null,
        recommendedPath: result.primary.path,
        decisionResult: JSON.parse(JSON.stringify(result)),
      },
    });
    console.log(`   ✅ Created profile: ${profile.id}`);

    // Clean up
    await prisma.himalayaProfile.delete({ where: { id: profile.id } });
    console.log("   ✅ Cleaned up test record");
  } catch (err) {
    console.error("   ❌ DB write failed:", err);
  }

  console.log("\n3. Testing HimalayaMemory upsert...");
  try {
    const memory = await prisma.himalayaMemory.upsert({
      where: { userId: "test-user-123" },
      create: {
        userId: "test-user-123",
        lastMode: "operator",
        lastNiche: "test niche",
      },
      update: {
        lastMode: "operator",
        lastNiche: "test niche",
      },
    });
    console.log(`   ✅ Memory upserted: ${memory.id}`);

    await prisma.himalayaMemory.delete({ where: { id: memory.id } });
    console.log("   ✅ Cleaned up test record");
  } catch (err) {
    console.error("   ❌ Memory upsert failed:", err);
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch(console.error);
