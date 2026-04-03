import "dotenv/config";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connStr = process.env.DATABASE_URL!;
  console.log("URL exists:", !!connStr);

  const url = new URL(connStr);
  console.log("Host:", url.hostname);
  console.log("Port:", url.port);
  console.log("User:", url.username);
  console.log("DB:", url.pathname.slice(1));
  console.log("Password length:", decodeURIComponent(url.password).length);

  const pool = new pg.Pool({
    host: url.hostname,
    port: parseInt(url.port || "5432", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  // Test raw pool
  const raw = await pool.query("SELECT count(*) FROM \"AnalysisRun\"");
  console.log("\n✅ Raw pool works. AnalysisRun count:", raw.rows[0].count);

  // Test PrismaPg
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const count = await prisma.analysisRun.count();
  console.log("✅ PrismaPg works. AnalysisRun count:", count);

  const profileCount = await prisma.himalayaProfile.count();
  console.log("✅ HimalayaProfile count:", profileCount);

  await prisma.$disconnect();
  await pool.end();
  console.log("\nAll DB tests passed.");
}

main().catch((e) => {
  console.error("❌ Failed:", e.message);
  process.exit(1);
});
