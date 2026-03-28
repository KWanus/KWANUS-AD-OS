import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/email-contacts/import
 * Bulk import email contacts from a JSON array.
 * Each contact needs at minimum an email address.
 *
 * Body: { contacts: [{ email, firstName?, lastName?, tags? }], skipDuplicates?: boolean }
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BODY_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > BODY_SIZE_LIMIT) {
      return NextResponse.json({ ok: false, error: "Request body too large" }, { status: 413 });
    }

    const body = await req.json() as {
      contacts: {
        email: string;
        firstName?: string;
        lastName?: string;
        tags?: string[];
        source?: string;
      }[];
      skipDuplicates?: boolean;
    };

    if (!body.contacts?.length) {
      return NextResponse.json({ ok: false, error: "No contacts provided" }, { status: 400 });
    }

    if (body.contacts.length > 500) {
      return NextResponse.json({ ok: false, error: "Maximum 500 contacts per import" }, { status: 400 });
    }

    // Validate and normalize all emails first
    const valid: { email: string; firstName: string | null; lastName: string | null; tags: string[]; source: string }[] = [];
    let invalid = 0;

    for (const contact of body.contacts) {
      const email = contact.email?.trim().slice(0, 254).toLowerCase();
      if (!email || !EMAIL_RE.test(email)) {
        invalid++;
        continue;
      }
      valid.push({
        email,
        firstName: contact.firstName?.trim().slice(0, 100) || null,
        lastName: contact.lastName?.trim().slice(0, 100) || null,
        tags: Array.isArray(contact.tags) ? contact.tags.slice(0, 20) : [],
        source: String(contact.source ?? "csv_import").slice(0, 50),
      });
    }

    // Batch-check for existing emails — single query instead of N+1
    let existingSet = new Set<string>();
    if (body.skipDuplicates !== false && valid.length > 0) {
      const existingEmails = await prisma.emailContact.findMany({
        where: { userId: user.id, email: { in: valid.map((c) => c.email) } },
        select: { email: true },
      });
      existingSet = new Set(existingEmails.map((e) => e.email));
    }

    const toCreate = valid.filter((c) => !existingSet.has(c.email));
    const skipped = valid.length - toCreate.length;

    if (toCreate.length > 0) {
      await prisma.emailContact.createMany({
        data: toCreate.map((c) => ({
          userId: user.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          tags: c.tags,
          source: c.source,
          status: "subscribed",
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      ok: true,
      total: body.contacts.length,
      created: toCreate.length,
      skipped,
      invalid,
    });
  } catch (err) {
    console.error("Contact import error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
