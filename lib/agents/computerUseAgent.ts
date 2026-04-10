// ---------------------------------------------------------------------------
// Computer Use Agent — AI operates ad platforms, posts content, manages accounts
// Uses Anthropic's Computer Use API to control browsers and desktop apps
//
// This is the HOLY GRAIL. The AI doesn't just generate — it EXECUTES.
// It opens Meta Ads Manager, creates the campaign, uploads creatives,
// sets targeting, sets budget, and clicks "Publish."
//
// The user watches it happen.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";

export type ComputerUseTask = {
  id: string;
  type: "create_meta_ad" | "create_google_ad" | "create_tiktok_ad" | "post_to_instagram" | "post_to_tiktok" | "post_to_linkedin" | "fill_form" | "custom";
  description: string;
  steps: string[];
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
};

export type ComputerUseConfig = {
  task: ComputerUseTask;
  credentials?: {
    platform: string;
    loginUrl: string;
    // Credentials would be retrieved from encrypted OAuth tokens
  };
  assets?: {
    imageUrls: string[];
    videoUrls: string[];
    adCopy: string;
    targetAudience: string;
    budget: number;
  };
};

/** Generate instructions for the Computer Use agent */
export function generateComputerUseInstructions(config: ComputerUseConfig): string {
  const { task, assets } = config;

  switch (task.type) {
    case "create_meta_ad":
      return `You are controlling a computer to create a Meta (Facebook) ad campaign.

Steps:
1. Open the browser and navigate to https://adsmanager.facebook.com
2. Click "Create" to start a new campaign
3. Select "Traffic" as the campaign objective
4. Name the campaign: "${task.description}"
5. Set the daily budget to $${assets?.budget ?? 20}
6. In the ad set, set targeting:
   - Location: United States
   - Interests: ${assets?.targetAudience ?? "business owners"}
   - Age: 25-55
7. Create the ad:
   - Upload the image from: ${assets?.imageUrls?.[0] ?? "no image"}
   - Set the primary text to: "${assets?.adCopy ?? "Check this out"}"
   - Set the headline to the first line of the ad copy
   - Set the CTA button to "Learn More"
8. Set the campaign status to PAUSED (do not publish live)
9. Click "Publish" to save the draft

IMPORTANT: Set to PAUSED, not active. The user will review and activate manually.`;

    case "create_google_ad":
      return `You are controlling a computer to create a Google Ads campaign.

Steps:
1. Open https://ads.google.com
2. Click "New Campaign"
3. Select "Search" campaign type
4. Name it: "${task.description}"
5. Set daily budget: $${assets?.budget ?? 20}
6. Add keywords: ${assets?.targetAudience ?? "relevant keywords"}
7. Create ad:
   - Headlines: Use first 3 lines of ad copy
   - Descriptions: Use remaining ad copy
   - Final URL: [the landing page URL]
8. Set campaign to PAUSED
9. Save`;

    case "post_to_instagram":
      return `You are controlling a computer to post on Instagram.

Steps:
1. Open https://www.instagram.com
2. Click the "+" (create) button
3. Upload the image: ${assets?.imageUrls?.[0] ?? "no image"}
4. Write the caption: "${assets?.adCopy ?? "New post"}"
5. Click "Share"

Post immediately — this is organic content, not an ad.`;

    case "post_to_linkedin":
      return `You are controlling a computer to post on LinkedIn.

Steps:
1. Open https://www.linkedin.com
2. Click "Start a post"
3. Type the content: "${assets?.adCopy ?? "New post"}"
4. Click "Post"`;

    default:
      return `Perform the following task: ${task.description}\n\nSteps:\n${task.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
  }
}

/** Execute a computer use task via Anthropic API */
export async function executeComputerUseTask(
  task: ComputerUseTask,
  assets?: ComputerUseConfig["assets"]
): Promise<{ ok: boolean; result?: string; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Anthropic API key not configured" };

  const instructions = generateComputerUseInstructions({ task, assets });

  try {
    const anthropic = new Anthropic({ apiKey });

    // Note: Computer Use requires Claude's computer use tool
    // In production, this would use the computer_use_tool beta
    // For now, we generate the instruction set that can be fed to
    // Claude Desktop or Claude Code with computer use enabled
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: "You are an AI assistant that generates step-by-step instructions for computer use tasks. Be specific about what to click, type, and verify.",
      messages: [{
        role: "user",
        content: `Generate a detailed, step-by-step execution plan for this task. Include specific UI elements to click, fields to fill, and verification steps.\n\n${instructions}`,
      }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    return {
      ok: true,
      result: textContent?.text ?? "Task instruction generated",
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Computer use failed" };
  }
}

/** Pre-built task templates */
export function getTaskTemplates(): ComputerUseTask[] {
  return [
    {
      id: "meta-ad",
      type: "create_meta_ad",
      description: "Create Meta ad campaign",
      steps: ["Open Ads Manager", "Create campaign", "Set targeting", "Upload creative", "Set budget", "Save as draft"],
      status: "pending",
    },
    {
      id: "google-ad",
      type: "create_google_ad",
      description: "Create Google Search campaign",
      steps: ["Open Google Ads", "Create campaign", "Add keywords", "Write ad copy", "Set budget", "Save as draft"],
      status: "pending",
    },
    {
      id: "ig-post",
      type: "post_to_instagram",
      description: "Post to Instagram",
      steps: ["Open Instagram", "Create post", "Upload image", "Write caption", "Publish"],
      status: "pending",
    },
    {
      id: "linkedin-post",
      type: "post_to_linkedin",
      description: "Post to LinkedIn",
      steps: ["Open LinkedIn", "Start a post", "Write content", "Publish"],
      status: "pending",
    },
    {
      id: "tiktok-ad",
      type: "create_tiktok_ad",
      description: "Create TikTok ad campaign",
      steps: ["Open TikTok Ads", "Create campaign", "Upload video", "Set targeting", "Set budget", "Save as draft"],
      status: "pending",
    },
  ];
}

/** Check if computer use is available */
export function hasComputerUse(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
