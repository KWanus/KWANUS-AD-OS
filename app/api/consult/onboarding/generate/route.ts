import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best business consultant and proposal writer inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, research what the TOP 1% of consultants and coaches in this exact niche charge, deliver, and say.
Then produce outputs that BEAT those benchmarks — sharper positioning, stronger value props, higher conversion.`;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { niche, clientName, businessType } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!niche || !businessType) {
      return NextResponse.json(
        { ok: false, error: "niche and businessType are required" },
        { status: 400 }
      );
    }

    const prompt = `Create a comprehensive client onboarding questionnaire for:
Niche: ${niche}
Business Type: ${businessType}
Client Name: ${clientName ?? "New Client"}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: write this like a top consultant diagnosing a serious business. Push for deeper decision-making, hidden constraints, financial reality, implementation blockers, and strategic clarity."
  : "Core mode: build a strong practical onboarding questionnaire that covers goals, blockers, resources, and scope clearly."}

Design questions that the TOP 1% of consultants use to deeply understand their clients before starting an engagement. Include questions that uncover hidden constraints, decision-making processes, success metrics, and prior failures. Group by logical sections.

Return ONLY this JSON:
{
  "sections": [
    {
      "title": "Business Overview",
      "description": "Help us understand your business at a high level",
      "questions": [
        {
          "id": "q1",
          "question": "What does your business do and who is your ideal customer?",
          "type": "text",
          "placeholder": "Describe in 2-3 sentences...",
          "required": true
        },
        {
          "id": "q2",
          "question": "How long have you been in business?",
          "type": "select",
          "options": ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"],
          "required": true
        }
      ]
    },
    {
      "title": "Goals & Outcomes",
      "description": "Define what success looks like for you",
      "questions": [
        {
          "id": "q10",
          "question": "What is your primary goal for this engagement?",
          "type": "text",
          "placeholder": "Be as specific as possible...",
          "required": true
        }
      ]
    },
    {
      "title": "Current Situation",
      "description": "Understand where you are today",
      "questions": []
    },
    {
      "title": "Challenges & Obstacles",
      "description": "Identify what's holding you back",
      "questions": []
    },
    {
      "title": "Resources & Constraints",
      "description": "Understand your capacity and limitations",
      "questions": []
    },
    {
      "title": "Decision Making & Team",
      "description": "Understand how decisions get made",
      "questions": []
    }
  ]
}

Requirements:
- Generate 4-7 questions per section (all sections must have questions — no empty arrays)
- Question IDs must be unique (q1, q2, q3... sequentially across all sections)
- Types: text | select | multiselect | number | textarea | date
- Include placeholder for text/textarea types
- Include options array for select/multiselect types
- Tailor all questions specifically to the "${niche}" niche and "${businessType}" business type
- Include niche-specific terminology and metrics`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: GLOBAL_RULE,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]+\}/);
    if (!match) {
      return NextResponse.json({ ok: false, error: "AI returned invalid JSON" }, { status: 500 });
    }

    const questionnaire = JSON.parse(match[0]) as {
      sections: Array<{
        title: string;
        description: string;
        questions: Array<{
          id: string;
          question: string;
          type: string;
          placeholder?: string;
          options?: string[];
          required: boolean;
        }>;
      }>;
    };

    // Compute total question count
    const totalQuestions = questionnaire.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );

    return NextResponse.json({
      ok: true,
      questionnaire,
      meta: {
        niche,
        businessType,
        clientName: clientName ?? null,
        executionTier,
        sectionCount: questionnaire.sections.length,
        totalQuestions,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Onboarding generate error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate onboarding questionnaire" },
      { status: 500 }
    );
  }
}
