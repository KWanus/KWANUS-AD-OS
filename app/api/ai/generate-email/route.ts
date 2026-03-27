import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";

const TRIGGER_PROMPTS: Record<string, string> = {
  signup: "a welcome email for a new subscriber who just joined the list",
  new_subscriber: "a warm welcome email for a new subscriber",
  abandoned_cart: "a cart recovery email nudging the contact to complete their purchase",
  purchase: "a post-purchase thank-you and onboarding email",
  browse_abandon: "a browse abandonment email highlighting the product they viewed",
  win_back: "a re-engagement email for a contact who hasn't engaged in 30+ days",
  custom: "a marketing email",
};

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      trigger?: string;
      flowName?: string;
      existingSubject?: string;
      brandVoice?: string;
    };
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const businessContext = await getBusinessContext(user.id);

    const triggerContext = TRIGGER_PROMPTS[body.trigger ?? "custom"] ?? TRIGGER_PROMPTS.custom;
    const flowName = body.flowName ?? (profile?.businessName ? `${profile.businessName} Email Flow` : "Email Flow");

    const prompt = `You are an expert email marketer. Write ${triggerContext} for the "${flowName}" flow.

Requirements:
- Subject line: punchy, curiosity-driven, under 50 chars, no emojis
- Preview text: complements subject, 80-100 chars, creates urgency/curiosity
- Body: conversational, high-converting email body in plain text (2-4 short paragraphs). Include a clear CTA.${body.brandVoice ? `\n- Brand voice: ${body.brandVoice}` : ""}${body.existingSubject ? `\n- Existing subject for context (improve upon it): ${body.existingSubject}` : ""}
- Use the business profile below to keep the copy niche-aware and audience-aware when relevant.

${businessContext}

Respond ONLY with valid JSON in this exact format:
{
  "subject": "...",
  "previewText": "...",
  "body": "..."
}`;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // Return a smart placeholder when no key configured
      const placeholders = getSmartPlaceholder(body.trigger ?? "custom", flowName);
      return NextResponse.json({ ok: true, ...placeholders });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    // Extract JSON from markdown code block if present
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
    const jsonStr = jsonMatch[1]?.trim() ?? raw.trim();
    const parsed = JSON.parse(jsonStr) as { subject?: string; previewText?: string; body?: string };

    return NextResponse.json({
      ok: true,
      subject: parsed.subject ?? "",
      previewText: parsed.previewText ?? "",
      body: parsed.body ?? "",
    });
  } catch (err) {
    console.error("AI generate-email:", err);
    return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
  }
}

function getSmartPlaceholder(trigger: string, flowName: string) {
  const examples: Record<string, { subject: string; previewText: string; body: string }> = {
    signup: {
      subject: "Welcome — here's what's next",
      previewText: "You're in. Here's everything you need to get started today.",
      body: `Hey there,\n\nWelcome to ${flowName}! We're genuinely excited to have you.\n\nHere's what you can expect: actionable insights, exclusive offers, and content that actually moves the needle for you.\n\nClick below to explore what's waiting for you.\n\n→ Get Started\n\nTalk soon,\nThe Team`,
    },
    abandoned_cart: {
      subject: "You left something behind",
      previewText: "Your cart is still waiting — grab it before it's gone.",
      body: `Hey,\n\nNoticed you left some items in your cart. Life gets busy — we get it.\n\nThe good news: your cart is still saved. The even better news: now's the perfect time to complete your order.\n\n→ Complete My Order\n\nQuestions? Just reply to this email.\n\nCheers,\nThe Team`,
    },
    purchase: {
      subject: "Order confirmed — what's next",
      previewText: "Thank you! Here's how to get the most from your purchase.",
      body: `Hey,\n\nThank you so much for your order — you just made a great decision.\n\nHere's what happens next:\n• You'll receive a confirmation shortly\n• Your order is being processed\n• We'll send tracking details once shipped\n\n→ View My Order\n\nHave questions? We're always here.\n\nWith gratitude,\nThe Team`,
    },
    win_back: {
      subject: "We miss you — here's 20% off",
      previewText: "It's been a while. Come see what's new (and save while you're here).",
      body: `Hey,\n\nWe noticed it's been a little while since we last saw you here — and honestly, we miss you.\n\nA lot has changed. New products, better experiences, and a team that cares deeply about your success.\n\nAs a welcome-back gift: use code COMEBACK for 20% off your next order.\n\n→ Claim My Discount\n\nThis offer expires in 48 hours.\n\nHope to see you soon,\nThe Team`,
    },
  };

  return (
    examples[trigger] ?? {
      subject: `Important update from ${flowName}`,
      previewText: "Here's something we think you'll find valuable.",
      body: `Hey,\n\nWe have something important to share with you.\n\nWe've been working hard to bring you more value, and we wanted you to be the first to know.\n\n→ Learn More\n\nBest,\nThe Team`,
    }
  );
}
