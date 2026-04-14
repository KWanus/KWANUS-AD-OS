import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/kwanus_db";

  if (process.env.NODE_ENV === "development") {
    const masked = connectionString.replace(/:[^:@]+@/, ":****@");
    console.log(`[Prisma] Initializing with: ${masked}`);
  }

  // Parse manually to handle special chars in password (like !!)
  let poolConfig: pg.PoolConfig;
  try {
    const url = new URL(connectionString);
    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port || "5432", 10),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1) || "postgres",
      ssl: url.hostname !== "localhost" ? { rejectUnauthorized: false } : undefined,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    };
  } catch {
    poolConfig = { connectionString, max: 3 };
  }

  const pool = new pg.Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
