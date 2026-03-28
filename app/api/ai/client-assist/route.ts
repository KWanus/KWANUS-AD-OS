import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

type ExecutionTier = "core" | "elite";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      clientId: string;
      action: "draft_followup" | "summarize" | "next_action" | "score_explain";
      executionTier?: ExecutionTier;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    // Load client with activities
    const client = await prisma.client.findFirst({
      where: { id: body.clientId, userId: user.id },
      include: { activities: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!client) return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });

    const activitySummary = client.activities
      .map((a: { createdAt: Date; type: string; content: string | null }) => `[${new Date(a.createdAt).toLocaleDateString()}] ${a.type}: ${a.content ?? ""}`)
      .join("\n");

    const prompts: Record<string, string> = {
      draft_followup: `You are an expert agency account manager.

Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: write like a premium strategist protecting the relationship while advancing the sale. Be sharper, more specific, and more commercially aware."
  : "Core mode: write a strong, warm, practical follow-up that is easy to send immediately."}

Draft a concise, warm follow-up email for this client.

Client: ${client.name}${client.company ? ` at ${client.company}` : ""}
Niche: ${client.niche ?? "unknown"}
Pipeline Stage: ${client.pipelineStage}
Deal Value: ${client.dealValue ? `$${client.dealValue.toLocaleString()}` : "not set"}
Recent Activity:
${activitySummary || "No recent activity logged."}

Write a 3–4 sentence follow-up email that:
1. References their specific situation naturally
2. Provides a clear next step or question
3. Has a compelling subject line

Format as JSON: { "subject": "...", "body": "..." }`,

      summarize: `Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: summarize like a premium operator briefing a founder. Surface commercial risk, leverage, and decision-quality clearly."
  : "Core mode: summarize clearly and practically for a busy operator."}

Summarize this client relationship in 2–3 sentences for a busy agency owner.

Client: ${client.name}${client.company ? ` at ${client.company}` : ""}
Stage: ${client.pipelineStage} | Health: ${client.healthScore}/100
Last Contact: ${client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : "Never"}
Recent Activity:
${activitySummary || "No recent activity."}

Be direct and actionable. Highlight risks.`,

      next_action: `Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: prioritize the move that best protects revenue, speed, and deal momentum."
  : "Core mode: prioritize the clearest practical next move."}

What is the single most important next action for this client?

Client: ${client.name} | Stage: ${client.pipelineStage} | Health: ${client.healthScore}/100
Last Contact: ${client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : "Never"}
Deal Value: ${client.dealValue ? `$${client.dealValue.toLocaleString()}` : "not set"}
Recent Activity:
${activitySummary || "No activity."}

Respond with ONE specific, actionable recommendation in 1–2 sentences. Start with a verb.`,

      score_explain: `Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: explain the score like a strategist diagnosing account risk and relationship health."
  : "Core mode: explain the score clearly in plain English."}

Explain this client's health score in plain English.

Client: ${client.name} | Score: ${client.healthScore}/100 (${client.healthStatus})
Stage: ${client.pipelineStage}
Last Contact: ${client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : "Never"}

Explain in 2–3 sentences: why this score, what risks it implies, what would improve it.`,
    };

    const prompt = prompts[body.action] ?? prompts.summarize;

    // Try Anthropic Claude first, fallback to OpenAI, fallback to smart local response
    const anthropicKey = config.anthropicApiKey;
    const openaiKey = config.openAiApiKey;

    if (anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: AI_MODELS.CLAUDE_PRIMARY,
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json() as { content: { text: string }[] };
        const text = data.content?.[0]?.text ?? "";
        return NextResponse.json({ ok: true, result: text, action: body.action, executionTier });
      }
    }

    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: AI_MODELS.OPENAI_FAST,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { choices: { message: { content: string } }[] };
        const text = data.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ ok: true, result: text, action: body.action, executionTier });
      }
    }

    const clientDisplayName = `${client.name}${client.company ? ` (${client.company})` : ""}`;
    const eliteRelationshipState =
      client.healthScore < 50
        ? "is at real risk because momentum and confidence are weak"
        : client.healthScore < 70
          ? "has moderate friction that needs active management"
          : "looks commercially healthy, but still needs deliberate forward motion";
    const eliteLatestTouchpoint = client.lastContactAt
      ? `the latest logged touchpoint was ${new Date(client.lastContactAt).toLocaleDateString()}`
      : "no recent contact has been logged yet";
    const coreContactStatus = client.lastContactAt
      ? `Last contacted ${new Date(client.lastContactAt).toLocaleDateString()}.`
      : "Has not been contacted yet.";
    const coreHealthRead =
      client.healthScore < 50
        ? "Needs immediate attention."
        : client.healthScore < 70
          ? "Monitor closely."
          : "Relationship is healthy.";

    // Smart local fallbacks
    const fallbacks: Record<string, string> = {
      draft_followup:
        executionTier === "elite"
          ? `Subject: Aligning on the next move for ${client.company ?? client.name}\n\nHi ${client.name},\n\nI’ve been reviewing where things currently stand and I think the biggest opportunity is making the next step feel simpler and more concrete. Rather than leaving momentum on the table, I’d like to align on the one decision that would move this forward fastest.\n\nAre you open to a quick 15-minute check-in this week so we can lock that in?\n\nBest,\n[Your Name]`
          : `Subject: Quick check-in — ${client.name}\n\nHi ${client.name},\n\nI wanted to touch base and see how things are going on your end. Based on our last conversation, I'd love to discuss next steps.\n\nAre you available for a quick 15-minute call this week?\n\nLooking forward to connecting,\n[Your Name]`,
      summarize:
        executionTier === "elite"
          ? `${clientDisplayName} is currently in the ${client.pipelineStage} stage with a health score of ${client.healthScore}/100. The relationship ${eliteRelationshipState}, and ${eliteLatestTouchpoint}.`
          : `${clientDisplayName} is in the ${client.pipelineStage} stage with a health score of ${client.healthScore}/100. ${coreContactStatus} ${coreHealthRead}`,
      next_action:
        executionTier === "elite"
          ? `${client.pipelineStage === "lead" ? "Qualify this lead with a sharper discovery call focused on urgency, budget, and decision authority." : client.pipelineStage === "qualified" ? "Send a tighter proposal path with a clear recommendation instead of leaving too many open options." : client.pipelineStage === "proposal" ? "Follow up on the proposal with a direct objection-clearing question and a concrete decision timeline." : client.pipelineStage === "active" ? "Run a strategic review that ties current work to business outcomes and tees up the next expansion move." : "Re-open the relationship with a direct message that names the stalled point and offers a low-friction next step."}`
          : `${client.pipelineStage === "lead" ? "Qualify this lead with a discovery call to understand their needs and budget." : client.pipelineStage === "qualified" ? "Send a tailored proposal based on their specific goals and timeline." : client.pipelineStage === "proposal" ? "Follow up on the proposal — ask for specific feedback or objections." : client.pipelineStage === "active" ? "Schedule a performance review call to show results and discuss expansion." : "Reach out within 24 hours to re-engage this relationship."}`,
      score_explain:
        executionTier === "elite"
          ? `${client.name} is sitting at ${client.healthScore}/100, which suggests the relationship is ${client.healthScore >= 70 ? "in a healthy place but still needs proactive account management" : client.healthScore >= 40 ? "stable enough to recover, but vulnerable if momentum slips further" : "fragile and likely to decay without fast intervention"}. The score is being shaped by stage, recency of contact, and whether the account feels like it is moving toward a clear business outcome.`
          : `${client.name} has a health score of ${client.healthScore}/100 (${client.healthStatus}). ${client.healthScore >= 70 ? "This is healthy — recent contact and positive pipeline progression." : client.healthScore >= 40 ? "This is moderate risk — some engagement gaps need attention." : "This is high risk — contact has gone cold or the relationship has stalled."}${client.lastContactAt ? "" : " The biggest factor: no contact has been logged yet."}`,
    };

    return NextResponse.json({
      ok: true,
      result: fallbacks[body.action] ?? fallbacks.summarize,
      action: body.action,
      executionTier,
    });
  } catch (err) {
    console.error("AI client-assist:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
