import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

const EXECUTION_TIER_PREFIX = "__execution_tier:";

function normalizeExecutionTier(value?: string) {
  return value === "core" ? "core" : "elite";
}

function visibleTags(tags: string[] | undefined) {
  return (tags ?? []).filter((tag) => !tag.startsWith(EXECUTION_TIER_PREFIX));
}

function parseExecutionTier(tags: string[] | undefined) {
  const raw = (tags ?? []).find((tag) => tag.startsWith(EXECUTION_TIER_PREFIX));
  return raw === `${EXECUTION_TIER_PREFIX}core` ? "core" : "elite";
}

function withExecutionTier(tags: string[] | undefined, tier?: string) {
  return [...visibleTags(tags), `${EXECUTION_TIER_PREFIX}${normalizeExecutionTier(tier)}`];
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") ?? "";
    const tag = searchParams.get("tag") ?? "";
    const status = searchParams.get("status") ?? "";
    const page  = parseInt(searchParams.get("page")  ?? "1",  10) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);

    const where = {
      userId: user.id,
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(tag && { tags: { has: tag } }),
      ...(status && { status }),
    };

    const [contacts, total] = await Promise.all([
      prisma.emailContact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailContact.count({ where }),
    ]);

    // Collect unique tags from a capped sample — avoid loading all contacts into memory
    const tagSample = await prisma.emailContact.findMany({
      where: { userId: user.id },
      select: { tags: true },
      take: 2000,
      orderBy: { createdAt: "desc" },
    });
    const allTags = [
      ...new Set(tagSample.flatMap((c: { tags: string[] }) => visibleTags(c.tags))),
    ].sort();

    return NextResponse.json({
      ok: true,
      contacts: contacts.map((contact) => ({
        ...contact,
        tags: visibleTags(contact.tags),
        executionTier: parseExecutionTier(contact.tags),
      })),
      total,
      page,
      limit,
      allTags,
    });
  } catch (err) {
    console.error("Contacts GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      email: string;
      firstName?: string;
      lastName?: string;
      tags?: string[];
      properties?: object;
      source?: string;
      executionTier?: "core" | "elite";
    };

    if (!body.email?.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const contact = await prisma.emailContact.upsert({
      where: { userId_email: { userId: user.id, email: body.email.toLowerCase().trim() } },
      update: {
        firstName: body.firstName,
        lastName: body.lastName,
        tags: withExecutionTier(body.tags, body.executionTier),
        properties: body.properties,
      },
      create: {
        userId: user.id,
        email: body.email.toLowerCase().trim(),
        firstName: body.firstName,
        lastName: body.lastName,
        tags: withExecutionTier(body.tags, body.executionTier),
        properties: body.properties,
        source: body.source ?? "manual",
        status: "subscribed",
      },
    });

    return NextResponse.json({
      ok: true,
      contact: {
        ...contact,
        tags: visibleTags(contact.tags),
        executionTier: parseExecutionTier(contact.tags),
      },
    });
  } catch (err) {
    console.error("Contacts POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// Bulk import
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      contacts: { email: string; firstName?: string; lastName?: string; tags?: string[]; executionTier?: "core" | "elite" }[];
    };

    if (!Array.isArray(body.contacts) || body.contacts.length === 0) {
      return NextResponse.json({ ok: false, error: "No contacts provided" }, { status: 400 });
    }

    const MAX_BULK = 500;
    if (body.contacts.length > MAX_BULK) {
      return NextResponse.json(
        { ok: false, error: `Bulk import is limited to ${MAX_BULK} contacts per request` },
        { status: 400 }
      );
    }

    const valid = body.contacts.filter((c) => c.email?.includes("@"));
    const skipped = body.contacts.length - valid.length;

    // createMany with skipDuplicates is O(1) DB round-trip vs N individual upserts
    const result = await prisma.emailContact.createMany({
      data: valid.map((c) => ({
        userId: user.id,
        email: c.email.toLowerCase().trim().slice(0, 254),
        firstName: c.firstName?.trim().slice(0, 100) ?? null,
        lastName:  c.lastName?.trim().slice(0, 100) ?? null,
        tags: withExecutionTier(c.tags, c.executionTier),
        source: "import" as const,
        status: "subscribed" as const,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true, imported: result.count, skipped: skipped + (valid.length - result.count) });
  } catch (err) {
    console.error("Contacts bulk import:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
