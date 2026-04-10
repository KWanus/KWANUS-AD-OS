// ---------------------------------------------------------------------------
// AI Video Spokesperson — HeyGen integration
// Creates personalized video messages at scale from a single photo/recording
// Used in: landing pages, email, ads, proposals, onboarding
// ---------------------------------------------------------------------------

export type VideoConfig = {
  avatarId?: string;       // HeyGen avatar ID (user creates once)
  voiceId?: string;        // HeyGen voice ID
  script: string;
  outputSize: "landscape" | "portrait" | "square";
  background?: string;     // URL or color
};

export type VideoResult = {
  ok: boolean;
  videoUrl?: string;
  videoId?: string;
  duration?: number;
  error?: string;
};

/** Create a video with AI spokesperson via HeyGen */
export async function createVideo(config: VideoConfig): Promise<VideoResult> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return { ok: false, error: "HeyGen not configured. Set HEYGEN_API_KEY." };

  try {
    const dimension = config.outputSize === "portrait" ? { width: 1080, height: 1920 }
      : config.outputSize === "square" ? { width: 1080, height: 1080 }
      : { width: 1920, height: 1080 };

    const res = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: "avatar",
            avatar_id: config.avatarId ?? "default",
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: config.script,
            voice_id: config.voiceId ?? "en-US-JennyNeural",
          },
          background: config.background ? { type: "image", value: config.background } : { type: "color", value: "#050a14" },
        }],
        dimension,
        test: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: `HeyGen error: ${(err as Record<string, string>).message ?? res.status}` };
    }

    const data = await res.json();
    const videoId = data.data?.video_id;

    if (!videoId) return { ok: false, error: "No video ID returned" };

    // Poll for completion
    const videoUrl = await pollHeyGenVideo(apiKey, videoId);
    if (!videoUrl) return { ok: false, error: "Video generation timed out" };

    return { ok: true, videoUrl, videoId, duration: config.script.split(" ").length / 2.5 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Video creation failed" };
  }
}

async function pollHeyGenVideo(apiKey: string, videoId: string, maxAttempts = 60): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { "X-Api-Key": apiKey },
    });

    if (!res.ok) continue;
    const data = await res.json();
    if (data.data?.status === "completed") return data.data.video_url;
    if (data.data?.status === "failed") return null;
  }
  return null;
}

/** Generate personalized video scripts for different use cases */
export function generateVideoScripts(input: {
  businessName: string;
  niche: string;
  ownerName: string;
  audience: string;
  outcome: string;
}): { useCase: string; script: string; duration: string }[] {
  return [
    {
      useCase: "Landing page welcome",
      script: `Hey there! I'm ${input.ownerName} from ${input.businessName}. If you're a ${input.audience} looking for ${input.outcome}, you're in the right place. I've helped hundreds of people just like you achieve real results. Scroll down to see how it works — and if you have any questions, there's a chat right here on the page. Let's get you started.`,
      duration: "25 seconds",
    },
    {
      useCase: "Email follow-up",
      script: `Hey, it's ${input.ownerName}. I noticed you checked out ${input.businessName} but haven't taken the next step yet. I totally get it — making decisions takes time. But I wanted to personally tell you: the people who get the best results are the ones who start now, not the ones who wait for the perfect moment. Click the link below and let's make ${input.outcome} happen for you.`,
      duration: "20 seconds",
    },
    {
      useCase: "Ad creative",
      script: `If you're a ${input.audience} and you're tired of trying things that don't work — watch this. I built ${input.businessName} specifically for people like you. We focus on ${input.outcome}, and we have the results to prove it. Link in bio.`,
      duration: "15 seconds",
    },
    {
      useCase: "Proposal walkthrough",
      script: `Hi, this is ${input.ownerName}. I put together a custom growth plan for your business based on the analysis we ran. Let me walk you through the highlights. First, we identified three key gaps that are costing you revenue. Second, we've mapped out exactly how to fix them over the next 90 days. And third, the projected impact if we execute this together. Check the full proposal below — and book a call when you're ready to discuss.`,
      duration: "30 seconds",
    },
    {
      useCase: "Thank you / post-purchase",
      script: `Welcome to ${input.businessName}! I'm ${input.ownerName} and I'm genuinely excited you're here. You made a great decision. Here's what to do right now: check your email for access instructions, start with module one, and don't skip the first exercise — it's the foundation for everything else. If you need anything at all, just reply to any of our emails. I'm here for you. Let's get you those results.`,
      duration: "25 seconds",
    },
  ];
}

/** Check if video spokesperson is configured */
export function hasVideoSpokesperson(): boolean {
  return !!process.env.HEYGEN_API_KEY;
}
