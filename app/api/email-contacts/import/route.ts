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
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

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

    let created = 0;
    let skipped = 0;
    let invalid = 0;

    // Normalize and validate all emails upfront
    const validContacts: typeof body.contacts = [];
    for (const contact of body.contacts) {
      const email = contact.email?.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        invalid++;
        continue;
      }
      validContacts.push({ ...contact, email });
    }

    // Batch check for existing emails in one query
    const emails = validContacts.map(c => c.email.trim().toLowerCase());
    const existingEmails = new Set<string>();
    if (body.skipDuplicates !== false && emails.length > 0) {
      const existing = await prisma.emailContact.findMany({
        where: { userId: user.id, email: { in: emails } },
        select: { email: true },
      });
      for (const e of existing) existingEmails.add(e.email);
    }

    // Batch create non-duplicates using transaction
    const toCreate = validContacts.filter(c => {
      if (existingEmails.has(c.email.trim().toLowerCase())) {
        skipped++;
        return false;
      }
      return true;
    });

    if (toCreate.length > 0) {
      // Use createMany for batch insert (much faster than individual creates)
      const result = await prisma.emailContact.createMany({
        data: toCreate.map(contact => ({
          userId: user.id,
          email: contact.email.trim().toLowerCase(),
          firstName: contact.firstName?.trim() || null,
          lastName: contact.lastName?.trim() || null,
          tags: contact.tags ?? [],
          source: contact.source ?? "csv_import",
          status: "subscribed",
        })),
        skipDuplicates: true,
      });
      created = result.count;
    }

    return NextResponse.json({
      ok: true,
      total: body.contacts.length,
      created,
      skipped,
      invalid,
    });
  } catch (err) {
    console.error("Contact import error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
