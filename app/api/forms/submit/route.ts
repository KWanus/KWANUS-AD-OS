// ---------------------------------------------------------------------------
// Form Submission Handler — captures leads from generated sites
// Auto-enrolls into email flows + creates contacts + fires tracking events
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrollContact } from "@/lib/integrations/emailFlowEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, email, name, phone, message, formType } = body as {
      siteId: string;
      email: string;
      name?: string;
      phone?: string;
      message?: string;
      formType?: string;
    };

    if (!siteId || !email) {
      return NextResponse.json({ ok: false, error: "siteId and email required" }, { status: 400 });
    }

    // Find the site and its owner
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });

    const userId = site.userId;

    // 1. Upsert contact
    const contact = await prisma.emailContact.upsert({
      where: { userId_email: { userId, email } },
      update: {
        firstName: name ?? undefined,
        status: "subscribed",
        properties: phone ? { phone, message, source: `site:${siteId}` } : undefined,
      },
      create: {
        userId,
        email,
        firstName: name ?? null,
        source: `site:${siteId}`,
        tags: ["site-form", `site:${site.slug}`],
        properties: { phone, message, formType },
      },
    });

    // 2. Create lead record
    await prisma.lead.create({
      data: {
        userId,
        name: name ?? email.split("@")[0],
        niche: site.name,
        location: "",
        email,
        phone: phone ?? null,
        notes: message ?? null,
        status: "new",
      },
    }).catch(() => {
      // Lead creation is non-blocking
    });

    // 3. Find active email flows for this site and auto-enroll
    // Look for flows created from the same deployment
    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { siteId: site.id, userId },
      orderBy: { createdAt: "desc" },
    });

    let enrollmentResult = null;
    if (deployment?.emailFlowId) {
      const flow = await prisma.emailFlow.findUnique({
        where: { id: deployment.emailFlowId },
      });

      if (flow && (flow.status === "active" || flow.status === "draft")) {
        enrollmentResult = await enrollContact({
          flowId: flow.id,
          contactEmail: email,
          userId,
          contactName: name,
        });
      }
    } else {
      // Fallback: find the most recent active flow for this user with "signup" trigger
      const flow = await prisma.emailFlow.findFirst({
        where: { userId, trigger: "signup", status: "active" },
        orderBy: { createdAt: "desc" },
      });

      if (flow) {
        enrollmentResult = await enrollContact({
          flowId: flow.id,
          contactEmail: email,
          userId,
          contactName: name,
        });
      }
    }

    // 4. Increment form submission count
    await prisma.sitePage.updateMany({
      where: { siteId: site.id },
      data: { views: { increment: 1 } }, // Using views as a proxy for submissions tracking
    }).catch(() => {});

    // 5. Track event
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId,
        event: "form_submission",
        metadata: {
          siteId: site.id,
          siteSlug: site.slug,
          contactId: contact.id,
          hasEmail: true,
          hasPhone: !!phone,
          enrolledInFlow: enrollmentResult?.ok ?? false,
        },
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      contactId: contact.id,
      enrolled: enrollmentResult?.ok ?? false,
    });
  } catch (err) {
    console.error("Form submission error:", err);
    return NextResponse.json(
      { ok: false, error: "Submission failed" },
      { status: 500 }
    );
  }
}
