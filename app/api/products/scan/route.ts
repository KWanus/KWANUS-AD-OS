import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

type Platform = "clickbank" | "amazon" | "aliexpress" | "jvzoo" | "warriorplus" | "cj" | "custom" | "dropship";

function detectPlatform(url: string): Platform {
  if (url.includes("clickbank.net") || url.includes("hop.clickbank")) return "clickbank";
  if (url.includes("amazon.com") || url.includes("amzn.to")) return "amazon";
  if (url.includes("aliexpress.com") || url.includes("ali.ski")) return "aliexpress";
  if (url.includes("jvzoo.com")) return "jvzoo";
  if (url.includes("warriorplus.com")) return "warriorplus";
  if (url.includes("cj.com") || url.includes("shareasale.com")) return "cj";
  return "custom";
}

function buildAffiliateUrl(
  url: string,
  platform: Platform,
  user: { clickbankNickname?: string | null; amazonTrackingId?: string | null; jvzooAffiliateId?: string | null; warriorplusId?: string | null }
): string | null {
  try {
    if (platform === "clickbank" && user.clickbankNickname) {
      // Extract vendor from URL: https://vendor.clickbank.net or hop link
      let vendor = "";
      const hopMatch = url.match(/https?:\/\/(?:[^.]+\.)?([^.]+)\.hop\.clickbank\.net/);
      const vendorMatch = url.match(/https?:\/\/([^.]+)\.clickbank\.net/);
      if (hopMatch) vendor = hopMatch[1];
      else if (vendorMatch) vendor = vendorMatch[1];
      // Try extracting from path: clickbank.net/vendor/product
      const pathMatch = url.match(/clickbank\.net\/([a-z0-9]+)/i);
      if (!vendor && pathMatch) vendor = pathMatch[1];
      if (vendor) return `https://${user.clickbankNickname}.${vendor}.hop.clickbank.net`;
      // Fallback: return hoplink base
      return `https://${user.clickbankNickname}.hop.clickbank.net`;
    }

    if (platform === "amazon" && user.amazonTrackingId) {
      const parsed = new URL(url);
      parsed.searchParams.set("tag", user.amazonTrackingId);
      return parsed.toString();
    }

    return null; // JVZoo/WarriorPlus give unique links per product - user pastes them directly
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clickbankNickname: true,
        amazonTrackingId: true,
        jvzooAffiliateId: true,
        warriorplusId: true,
      },
    });
    if (!user) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json() as { url: string; executionTier?: ExecutionTier };
    const url = body.url?.trim();
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";
    if (!url) return NextResponse.json({ ok: false, error: "URL required" }, { status: 400 });

    const platform = detectPlatform(url);
    const affiliateUrl = buildAffiliateUrl(url, platform, user);

    // Fetch the page with timeout
    const page = await Promise.race([
      fetchPage(url),
      new Promise<null>((r) => setTimeout(() => r(null), 15000)),
    ]);

    // Use Claude to extract product data
    const pageText = page ? `Title: ${page.title}\nDescription: ${page.metaDescription}\nBody: ${page.bodyText?.slice(0, 2000)}` : `URL: ${url}`;

    const response = await anthropic.messages.create({
      model: AI_MODELS.CLAUDE_PRIMARY,
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Extract product info from this page and return ONLY valid JSON (no markdown):
{
  "name": "product name",
  "description": "1-2 sentence description",
  "price": "price as string (e.g. $97)",
  "commission": "commission % or $ if visible",
  "niche": "main niche/category (e.g. weight loss, make money online, dropship, software)",
  "category": "digital | physical | dropship | saas | affiliate",
  "gravity": null,
  "imageUrl": null,
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "targetAudience": "who buys this",
  "painPoint": "main problem it solves",
  "topBenefit": "the biggest benefit/promise"
}

Execution tier: ${executionTier}
${executionTier === "elite"
  ? "Think like a top 1% offer strategist. Prefer sharper niche categorization, more specific buyer language, stronger pain articulation, and more usable hooks."
  : "Keep the extraction clean, accurate, and launch-ready."}

Page data:
${pageText}`
      }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]+\}/);
    const productData = match ? JSON.parse(match[0]) as {
      name?: string; description?: string; price?: string; commission?: string;
      niche?: string; category?: string; gravity?: number | null;
      imageUrl?: string | null; hooks?: string[]; targetAudience?: string;
      painPoint?: string; topBenefit?: string;
    } : {};

    return NextResponse.json({
      ok: true,
      executionTier,
      platform,
      affiliateUrl,
      hasAffiliateId: !!affiliateUrl,
      missingIdPlatform: !affiliateUrl && platform !== "custom" && platform !== "dropship" && platform !== "aliexpress" ? platform : null,
      product: {
        name: productData.name ?? (page?.title ?? url),
        description: productData.description ?? "",
        price: productData.price ?? "",
        commission: productData.commission ?? "",
        niche: productData.niche ?? "",
        category: productData.category ?? "custom",
        imageUrl: productData.imageUrl ?? null,
        hooks: productData.hooks ?? [],
        targetAudience: productData.targetAudience ?? "",
        painPoint: productData.painPoint ?? "",
        topBenefit: productData.topBenefit ?? "",
      },
    });
  } catch (err) {
    console.error("Product scan error:", err);
    return NextResponse.json({ ok: false, error: "Scan failed" }, { status: 500 });
  }
}
