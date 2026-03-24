import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { HIMALAYA_COPILOT_PROMPT } from "@/lib/copilot-prompt";
import { extractUrl, scanUrlForCopilot, formatScanForPrompt } from "@/lib/scanForCopilot";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!body.messages?.length) {
      return NextResponse.json({ ok: false, error: "No messages" }, { status: 400 });
    }

    // Detect URL in the latest user message
    const lastUserMsg = [...body.messages].reverse().find((m) => m.role === "user");
    const detectedUrl = lastUserMsg ? extractUrl(lastUserMsg.content) : null;

    // Build system prompt — inject scan data if a URL was found
    let systemPrompt = HIMALAYA_COPILOT_PROMPT;

    if (detectedUrl) {
      const scanTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000));
      const scan = await Promise.race([scanUrlForCopilot(detectedUrl).catch(() => null), scanTimeout]);
      if (scan) {
        const scanContext = formatScanForPrompt(scan);
        systemPrompt = `${HIMALAYA_COPILOT_PROMPT}

---
## SCAN CONTEXT (injected automatically — the user just shared a URL)
${scanContext}

**Instructions for this response:**
- Lead with the score and verdict (e.g. "Scanned it — **${scan.score}/100, ${scan.verdict}**")
- Give your honest take on the biggest opportunity and the biggest problem
- Recommend 1-2 specific next actions using Himalaya (link to the relevant section)
- Mention the top 2 ad hooks if they're good
- Keep it under 250 words — punchy, consultant tone, not a data dump
`;
      }
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: systemPrompt,
            messages: body.messages.slice(-20),
            stream: true,
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Copilot error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
