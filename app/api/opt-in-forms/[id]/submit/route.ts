import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fireWebhook } from "@/lib/webhooks";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

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

    // Rate limit public form submissions by IP to prevent spam
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limited = rateLimit(`form:${ip}`, RATE_LIMITS.publicEndpoint);
    if (limited) return limited;

    const form = await prisma.optInForm.findUnique({
      where: { id },
      include: { user: { select: { id: true, webhookUrl: true } } },
    });

    if (!form || !form.active || !form.user) {
      return NextResponse.json({ ok: false, error: "Form not found" }, { status: 404 });
    }

    const body = await req.json() as {
      email: string;
      firstName?: string;
      lastName?: string;
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!body.email || !emailRegex.test(body.email.trim())) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    const userId = form.user.id;

    // Upsert contact
    await prisma.emailContact.upsert({
      where: { userId_email: { userId, email: body.email.toLowerCase().trim() } },
      update: {
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        // Merge tags without duplicates
      },
      create: {
        userId,
        email: body.email.toLowerCase().trim(),
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        tags: visibleTags(form.tags),
        source: "form",
        status: "subscribed",
      },
    });

    // Increment submissions
    await prisma.optInForm.update({
      where: { id },
      data: { submissions: { increment: 1 } },
    });

    // Fire webhook (fire-and-forget)
    fireWebhook(userId, {
      event: "new_contact",
      timestamp: new Date().toISOString(),
      data: {
        email: body.email.toLowerCase().trim(),
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        tags: visibleTags(form.tags),
        formId: id,
        formName: form.name,
      },
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
