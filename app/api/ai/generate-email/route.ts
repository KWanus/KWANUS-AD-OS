import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { config } from "@/lib/config";

const BODY_SIZE_LIMIT = 32 * 1024; // 32 KB

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

    // Rate limiting: 20 generation calls per minute per user
    const rl = checkRateLimit(`${user.id}:generate-email`, RATE_LIMITS.AI_GENERATION);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests — please wait before trying again" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Body size guard
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > BODY_SIZE_LIMIT) {
      return NextResponse.json({ ok: false, error: "Request body too large" }, { status: 413 });
    }

    const body = await req.json() as {
      trigger?: string;
      flowName?: string;
      existingSubject?: string;
      brandVoice?: string;
      executionTier?: ExecutionTier;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const businessContext = await getBusinessContext(user.id);

    const triggerContext = TRIGGER_PROMPTS[body.trigger ?? "custom"] ?? TRIGGER_PROMPTS.custom;
    const flowName = body.flowName ?? (profile?.businessName ? `${profile.businessName} Email Flow` : "Email Flow");

    const prompt = `You are an expert email marketer. Write ${triggerContext} for the "${flowName}" flow.

Requirements:
- Subject line: punchy, curiosity-driven, under 50 chars, no emojis
- Preview text: complements subject, 80-100 chars, creates urgency/curiosity
- Body: conversational, high-converting email body in plain text (2-4 short paragraphs). Include a clear CTA.
- Execution tier: ${executionTier}
- ${executionTier === "elite"
    ? "Write like a top 1% lifecycle marketer: stronger specificity, clearer stakes, more believable proof framing, tighter objection handling, and a CTA that feels premium and decisive."
    : "Keep it strong, clear, and launch-ready without overcomplicating the message."}${body.brandVoice ? `\n- Brand voice: ${body.brandVoice}` : ""}${body.existingSubject ? `\n- Existing subject for context (improve upon it): ${body.existingSubject}` : ""}
- Use the business profile below to keep the copy niche-aware and audience-aware when relevant.

${businessContext}

Respond ONLY with valid JSON in this exact format:
{
  "subject": "...",
  "previewText": "...",
  "body": "..."
}`;

    const openaiKey = config.openAiApiKey;
    if (!openaiKey) {
      // Return a smart placeholder when no key configured
      const placeholders = getSmartPlaceholder(body.trigger ?? "custom", flowName, executionTier);
      return NextResponse.json({ ok: true, executionTier, ...placeholders });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODELS.OPENAI_FAST,
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
      executionTier,
      subject: parsed.subject ?? "",
      previewText: parsed.previewText ?? "",
      body: parsed.body ?? "",
    });
  } catch (err) {
    console.error("AI generate-email:", err);
    return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
  }
}

function getSmartPlaceholder(trigger: string, flowName: string, executionTier: ExecutionTier) {
  const examples: Record<string, { subject: string; previewText: string; body: string }> = {
    signup: {
      subject: executionTier === "elite" ? "Welcome — here's how to win with this" : "Welcome — here's what's next",
      previewText: executionTier === "elite"
        ? "You're in. Here's the fastest way to get value without wasting time."
        : "You're in. Here's everything you need to get started today.",
      body: executionTier === "elite"
        ? `Hey there,\n\nWelcome to ${flowName}. You're here because you want a better result, not more noise.\n\nSo here's how to get value fast: start with the core move, ignore the fluff, and use what actually closes the gap between where you are now and the result you want.\n\nWhen you're ready, take the next step below.\n\n→ Get Started\n\nTalk soon,\nThe Team`
        : `Hey there,\n\nWelcome to ${flowName}! We're genuinely excited to have you.\n\nHere's what you can expect: actionable insights, exclusive offers, and content that actually moves the needle for you.\n\nClick below to explore what's waiting for you.\n\n→ Get Started\n\nTalk soon,\nThe Team`,
    },
    abandoned_cart: {
      subject: executionTier === "elite" ? "Still thinking it over?" : "You left something behind",
      previewText: executionTier === "elite"
        ? "A quick note on the hesitation point that usually stalls this decision."
        : "Your cart is still waiting — grab it before it's gone.",
      body: executionTier === "elite"
        ? `Hey,\n\nYou were close. Usually when someone pauses here, it's not because they don't want the result — it's because they're weighing timing, trust, or whether this is really the right fit.\n\nSo here's the simple version: if you still want the outcome this helps create, your cart is ready, and this is the easiest point to move.\n\n→ Complete My Order\n\nIf you have a question holding you back, reply and ask.\n\nCheers,\nThe Team`
        : `Hey,\n\nNoticed you left some items in your cart. Life gets busy — we get it.\n\nThe good news: your cart is still saved. The even better news: now's the perfect time to complete your order.\n\n→ Complete My Order\n\nQuestions? Just reply to this email.\n\nCheers,\nThe Team`,
    },
    purchase: {
      subject: executionTier === "elite" ? "You're in — here’s how to get the full value" : "Order confirmed — what's next",
      previewText: executionTier === "elite"
        ? "A quick plan to make sure this purchase pays off the way it should."
        : "Thank you! Here's how to get the most from your purchase.",
      body: executionTier === "elite"
        ? `Hey,\n\nExcellent call on this. The next move is making sure you get the result you bought this for, not just the transaction.\n\nHere's what happens now, what to expect next, and how to get the fastest win from your purchase.\n\n→ View My Order\n\nIf you want help getting the most out of it, just reply.\n\nWith gratitude,\nThe Team`
        : `Hey,\n\nThank you so much for your order — you just made a great decision.\n\nHere's what happens next:\n• You'll receive a confirmation shortly\n• Your order is being processed\n• We'll send tracking details once shipped\n\n→ View My Order\n\nHave questions? We're always here.\n\nWith gratitude,\nThe Team`,
    },
    win_back: {
      subject: executionTier === "elite" ? "Before you write this off completely" : "We miss you — here's 20% off",
      previewText: executionTier === "elite"
        ? "One quick reason this may be more relevant to you now than before."
        : "It's been a while. Come see what's new (and save while you're here).",
      body: executionTier === "elite"
        ? `Hey,\n\nIf you drifted away because the timing wasn't right, that makes sense. But if the underlying problem is still there, this may be worth another look.\n\nWe've sharpened the offer, improved the experience, and made the next step easier. If you want back in, here's the simplest way to do it.\n\n→ Come Back In\n\nThis incentive won't stay around forever.\n\nHope to see you soon,\nThe Team`
        : `Hey,\n\nWe noticed it's been a little while since we last saw you here — and honestly, we miss you.\n\nA lot has changed. New products, better experiences, and a team that cares deeply about your success.\n\nAs a welcome-back gift: use code COMEBACK for 20% off your next order.\n\n→ Claim My Discount\n\nThis offer expires in 48 hours.\n\nHope to see you soon,\nThe Team`,
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
