import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

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
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

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

    // Get unique tags across all contacts
    const allContacts = await prisma.emailContact.findMany({
      where: { userId: user.id },
      select: { tags: true },
    });
    const allTags = [
      ...new Set(allContacts.flatMap((c: { tags: string[] }) => c.tags)),
    ].sort();

    return NextResponse.json({ ok: true, contacts, total, page, limit, allTags });
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
    };

    if (!body.email?.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const contact = await prisma.emailContact.upsert({
      where: { userId_email: { userId: user.id, email: body.email.toLowerCase().trim() } },
      update: {
        firstName: body.firstName,
        lastName: body.lastName,
        tags: body.tags ?? [],
        properties: body.properties,
      },
      create: {
        userId: user.id,
        email: body.email.toLowerCase().trim(),
        firstName: body.firstName,
        lastName: body.lastName,
        tags: body.tags ?? [],
        properties: body.properties,
        source: body.source ?? "manual",
        status: "subscribed",
      },
    });

    return NextResponse.json({ ok: true, contact });
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
      contacts: { email: string; firstName?: string; lastName?: string; tags?: string[] }[];
    };

    if (!Array.isArray(body.contacts) || body.contacts.length === 0) {
      return NextResponse.json({ ok: false, error: "No contacts provided" }, { status: 400 });
    }

    const valid = body.contacts.filter(
      (c: { email: string; firstName?: string; lastName?: string; tags?: string[] }) =>
        c.email?.includes("@")
    );
    let imported = 0;

    for (const c of valid) {
      await prisma.emailContact.upsert({
        where: { userId_email: { userId: user.id, email: c.email.toLowerCase().trim() } },
        update: { firstName: c.firstName, lastName: c.lastName, tags: c.tags ?? [] },
        create: {
          userId: user.id,
          email: c.email.toLowerCase().trim(),
          firstName: c.firstName,
          lastName: c.lastName,
          tags: c.tags ?? [],
          source: "import",
          status: "subscribed",
        },
      });
      imported++;
    }

    return NextResponse.json({ ok: true, imported, skipped: body.contacts.length - imported });
  } catch (err) {
    console.error("Contacts bulk import:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
