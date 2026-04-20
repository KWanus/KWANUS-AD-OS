import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateFormHtml, generatePopupHtml, generateBarHtml, getFormEmbedScript, FORM_TEMPLATES, getFormTemplate } from "@/lib/email/formBuilder";
import type { FormConfig } from "@/lib/email/formBuilder";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const templateId = req.nextUrl.searchParams.get("template");
    const formId = req.nextUrl.searchParams.get("embed");

    if (formId) {
      const script = getFormEmbedScript(formId);
      return NextResponse.json({ ok: true, script });
    }

    if (templateId && FORM_TEMPLATES.includes(templateId as typeof FORM_TEMPLATES[number])) {
      const template = getFormTemplate(templateId as typeof FORM_TEMPLATES[number]);
      return NextResponse.json({ ok: true, template });
    }

    return NextResponse.json({ ok: true, templates: FORM_TEMPLATES.map(t => ({ id: t, name: t.replace(/_/g, " ") })) });
  } catch (err) {
    console.error("Form error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const config = await req.json() as FormConfig;
    config.userId = user.id;

    let html: string;
    if (config.type === "popup" || config.type === "exit_intent") {
      html = generatePopupHtml(config);
    } else if (config.type === "bar") {
      html = generateBarHtml(config);
    } else {
      html = generateFormHtml(config);
    }

    return NextResponse.json({ ok: true, html, embedScript: getFormEmbedScript(config.id) });
  } catch (err) {
    console.error("Form generation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
