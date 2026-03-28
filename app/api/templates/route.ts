import { NextRequest, NextResponse } from "next/server";
import { SITE_TEMPLATES } from "@/templates/siteTemplates";
import { EMAIL_TEMPLATES } from "@/templates/emailTemplates";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "all";
  const category = searchParams.get("category") ?? "";

  const result: { siteTemplates?: typeof SITE_TEMPLATES; emailTemplates?: typeof EMAIL_TEMPLATES } = {};

  if (type === "all" || type === "site") {
    result.siteTemplates = category
      ? SITE_TEMPLATES.filter((t) => t.category === category)
      : SITE_TEMPLATES;
  }

  if (type === "all" || type === "email") {
    result.emailTemplates = category
      ? EMAIL_TEMPLATES.filter((t) => t.category === category)
      : EMAIL_TEMPLATES;
  }

  return NextResponse.json({ ok: true, ...result });
}
