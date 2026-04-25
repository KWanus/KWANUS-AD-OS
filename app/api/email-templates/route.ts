import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  EMAIL_TEMPLATES,
  getTemplate,
  getTemplatesByCategory,
  generateEmail,
  type EmailTemplate,
} from "@/lib/email-templates/outreachTemplates";

/** GET — Fetch all templates or filter by category */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as EmailTemplate["category"] | null;
    const templateId = searchParams.get("id");

    // Get single template by ID
    if (templateId) {
      const template = getTemplate(templateId);
      if (!template) {
        return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, template });
    }

    // Get templates by category
    if (category) {
      const templates = getTemplatesByCategory(category);
      return NextResponse.json({ ok: true, templates });
    }

    // Get all templates
    return NextResponse.json({ ok: true, templates: EMAIL_TEMPLATES });
  } catch (err) {
    console.error("Email templates GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch templates" }, { status: 500 });
  }
}

/** POST — Generate personalized email from template */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      templateId: string;
      variables: Record<string, string>;
    };

    if (!body.templateId || !body.variables) {
      return NextResponse.json(
        { ok: false, error: "Missing templateId or variables" },
        { status: 400 }
      );
    }

    const email = generateEmail(body.templateId, body.variables);
    if (!email) {
      return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      subject: email.subject,
      body: email.body,
    });
  } catch (err) {
    console.error("Email template generation error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate email" }, { status: 500 });
  }
}
