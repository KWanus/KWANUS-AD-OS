// ---------------------------------------------------------------------------
// POST /api/ai/generate-blog
// Generates a full SEO-optimized blog post from a topic + business context
// Returns ready-to-publish markdown with headings, body, meta
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      topic: string;
      targetKeyword?: string;
      wordCount?: number;
      tone?: string;
    };

    if (!body.topic) return NextResponse.json({ ok: false, error: "topic required" }, { status: 400 });

    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const niche = profile?.niche ?? "business";
    const audience = profile?.targetAudience ?? "your audience";
    const wordCount = body.wordCount ?? 1500;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "AI not configured" }, { status: 400 });

    const anthropic = new Anthropic({ apiKey });

    const prompt = `Write a complete, SEO-optimized blog post.

Topic: ${body.topic}
${body.targetKeyword ? `Target keyword: ${body.targetKeyword}` : ""}
Niche: ${niche}
Audience: ${audience}
Target length: ${wordCount} words
Tone: ${body.tone ?? "authoritative but conversational"}

Requirements:
- Include an SEO-optimized title (H1)
- Write a compelling meta description (under 155 chars)
- Use H2 and H3 subheadings throughout
- Include an intro that hooks the reader
- Provide actionable, specific advice (not generic)
- End with a clear conclusion and CTA
- Use bullet points and numbered lists where appropriate
- ${body.targetKeyword ? `Naturally include "${body.targetKeyword}" 3-5 times` : "Include relevant keywords naturally"}
- Write in a way that builds authority in ${niche}
- Make it genuinely useful for ${audience}

Format as markdown. Output the complete blog post with no meta-commentary.

Start with:
---
title: "..."
description: "..."
keywords: "..."
---

Then the full post.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const content = textContent?.text ?? "";

    // Extract meta from frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let meta: Record<string, string> = {};
    if (frontmatterMatch) {
      const lines = frontmatterMatch[1].split("\n");
      for (const line of lines) {
        const [key, ...vals] = line.split(":");
        if (key && vals.length) {
          meta[key.trim()] = vals.join(":").trim().replace(/^["']|["']$/g, "");
        }
      }
    }

    const blogBody = frontmatterMatch
      ? content.slice(frontmatterMatch[0].length).trim()
      : content;

    return NextResponse.json({
      ok: true,
      blog: {
        title: meta.title ?? body.topic,
        description: meta.description ?? "",
        keywords: meta.keywords ?? "",
        content: blogBody,
        wordCount: blogBody.split(/\s+/).length,
      },
    });
  } catch (err) {
    console.error("Blog generation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
