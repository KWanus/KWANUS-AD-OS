import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fireWebhook } from "@/lib/webhooks";
import { checkRateLimit } from "@/lib/rateLimit";

const BODY_SIZE_LIMIT = 8 * 1024; // 8 KB — form submissions need very little space

// Basic RFC-5322 email validation (catches most invalid formats)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

const EXECUTION_TIER_PREFIX = "__execution_tier:";

function visibleTags(tags: string[] | undefined) {
  return (tags ?? []).filter((tag) => !tag.startsWith(EXECUTION_TIER_PREFIX));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const form = await prisma.optInForm.findUnique({
      where: { id },
      include: { user: { select: { id: true, webhookUrl: true } } },
    });

    if (!form || !form.active || !form.user) {
      return NextResponse.json({ ok: false, error: "Form not found" }, { status: 404 });
    }

    // Body size guard
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > BODY_SIZE_LIMIT) {
      return NextResponse.json({ ok: false, error: "Request body too large" }, { status: 413 });
    }

    // Rate limiting: 5 submissions per minute per IP to prevent spam floods
    const ip = getClientIp(req);
    const rl = checkRateLimit(`form-submit:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "Too many submissions — please slow down" }, { status: 429 });
    }

    const body = await req.json() as {
      email: string;
      firstName?: string;
      lastName?: string;
      _hp?: string; // honeypot field — bots fill it, humans don't
    };

    // Honeypot check: if the hidden field has any value, silently accept but don't save
    if (body._hp) {
      return NextResponse.json({ ok: true, redirectUrl: null });
    }

    if (!body.email || !EMAIL_RE.test(body.email)) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    // Sanitize string lengths to prevent oversized DB writes
    const email = body.email.toLowerCase().trim().slice(0, 254);
    const firstName = body.firstName?.trim().slice(0, 100) || null;
    const lastName = body.lastName?.trim().slice(0, 100) || null;

    const userId = form.user.id;

    // Upsert contact + increment counter atomically
    await prisma.$transaction([
      prisma.emailContact.upsert({
        where: { userId_email: { userId, email } },
        update: {
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
        },
        create: {
          userId,
          email,
          firstName,
          lastName,
          tags: visibleTags(form.tags),
          source: "form",
          status: "subscribed",
        },
      }),
      prisma.optInForm.update({
        where: { id },
        data: { submissions: { increment: 1 } },
      }),
    ]);

    // Fire webhook (fire-and-forget)
    fireWebhook(userId, {
      event: "new_contact",
      timestamp: new Date().toISOString(),
      data: { email, firstName, lastName, tags: visibleTags(form.tags), formId: id, formName: form.name },
    });

    return NextResponse.json({
      ok: true,
      redirectUrl: form.redirectUrl || null,
    });
  } catch (err) {
    console.error("Form submit:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
