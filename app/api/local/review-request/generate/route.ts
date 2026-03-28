import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, LOCAL_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { businessName, niche, reviewPlatform, auditId } = body as {
      businessName: string;
      niche: string;
      reviewPlatform?: "google" | "yelp" | "facebook";
      auditId?: string;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!businessName || !niche) {
      return NextResponse.json(
        { ok: false, error: "businessName and niche are required" },
        { status: 400 }
      );
    }

    const platform = reviewPlatform ?? "google";

    // Optionally verify the audit belongs to this user
    if (auditId) {
      const auditCheck = await prisma.localAudit.findFirst({
        where: { id: auditId, userId: user.id },
        select: { id: true },
      });
      if (!auditCheck)
        return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });
    }

    const prompt = `Generate high-converting review request templates for:
Business Name: ${businessName}
Niche: ${niche}
Review Platform: ${platform}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: write these like a top local retention operator. Push for better personalization, stronger compliance psychology, and smarter tone without sounding robotic."
  : "Core mode: produce strong human review-request templates with clear tone and practical conversion logic."}

Create templates that:
- Sound human and personal, not automated or corporate
- Are niche-specific (reference the actual service they received)
- Have tested psychological triggers for compliance (reciprocity, social proof, ease)
- Include a direct link placeholder: [REVIEW_LINK]
- Keep SMS under 160 characters each
- Email subjects must have >40% open rate potential for this niche

Return this exact JSON structure:
{
  "sms": [
    { "timing": "same_day", "message": "..." },
    { "timing": "3_days", "message": "..." },
    { "timing": "7_days", "message": "..." }
  ],
  "email": [
    { "timing": "same_day", "subject": "...", "body": "..." },
    { "timing": "3_days", "subject": "...", "body": "..." }
  ],
  "qrCodeUrl": null,
  "notes": "best practices and specific tips for ${niche} businesses requesting reviews on ${platform}"
}`;

    const result = await callClaude(LOCAL_SYSTEM_PROMPT, prompt);

    // If auditId provided, store reviewTemplates on the LocalAudit
    if (auditId) {
      await prisma.localAudit.update({
        where: { id: auditId },
        data: { reviewTemplates: result as object },
      });
    }

    return NextResponse.json({ ok: true, templates: result, executionTier });
  } catch (err) {
    console.error("Review request generate POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate review request templates" },
      { status: 500 }
    );
  }
}
