// ---------------------------------------------------------------------------
// AI Image Generation — ad creatives, product shots, social proof graphics
// Uses OpenAI GPT Image (primary) with fal.ai Flux as fallback
// ---------------------------------------------------------------------------

import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export type ImageGenInput = {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "natural" | "vivid";
};

export type GeneratedImage = {
  base64: string;
  prompt: string;
  model: string;
};

export type ImageGenResult = {
  ok: boolean;
  images: GeneratedImage[];
  error?: string;
};

/** Generate images using OpenAI GPT Image */
async function generateWithOpenAI(
  inputs: ImageGenInput[]
): Promise<ImageGenResult> {
  const openai = getOpenAI();
  const images: GeneratedImage[] = [];

  for (const input of inputs) {
    try {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: input.prompt,
        n: 1,
        size: input.size ?? "1024x1024",
        quality: input.quality === "hd" ? "high" : "medium",
      });

      const firstImage = result.data?.[0];
      if (firstImage?.b64_json) {
        images.push({
          base64: firstImage.b64_json,
          prompt: input.prompt,
          model: "gpt-image-1",
        });
      }
    } catch (err) {
      console.error("OpenAI image gen failed for prompt:", input.prompt, err);
    }
  }

  return { ok: images.length > 0, images };
}

/** Generate images using fal.ai Flux (fallback) */
async function generateWithFal(
  inputs: ImageGenInput[]
): Promise<ImageGenResult> {
  const key = process.env.FAL_KEY;
  if (!key) return { ok: false, images: [], error: "FAL_KEY not set" };

  const images: GeneratedImage[] = [];

  for (const input of inputs) {
    try {
      const response = await fetch("https://queue.fal.run/fal-ai/flux/dev", {
        method: "POST",
        headers: {
          Authorization: `Key ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.prompt,
          image_size: input.size === "1792x1024" ? "landscape_16_9" : input.size === "1024x1792" ? "portrait_16_9" : "square",
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const imageUrl = data?.images?.[0]?.url;
      if (!imageUrl) continue;

      // Fetch the image and convert to base64
      const imgResponse = await fetch(imageUrl);
      const buffer = await imgResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      images.push({ base64, prompt: input.prompt, model: "fal-flux-dev" });
    } catch (err) {
      console.error("fal.ai image gen failed for prompt:", input.prompt, err);
    }
  }

  return { ok: images.length > 0, images };
}

/** Generate ad creative images — tries OpenAI first, falls back to fal.ai */
export async function generateImages(
  inputs: ImageGenInput[]
): Promise<ImageGenResult> {
  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    const result = await generateWithOpenAI(inputs);
    if (result.ok) return result;
  }

  // Fallback to fal.ai
  if (process.env.FAL_KEY) {
    return generateWithFal(inputs);
  }

  return { ok: false, images: [], error: "No image generation API available" };
}

/** Build ad-specific image prompts from campaign data */
export function buildAdImagePrompts(input: {
  productName: string;
  audience: string;
  painPoint: string;
  outcome: string;
  angle: string;
  mode: "operator" | "consultant";
}): ImageGenInput[] {
  const { productName, audience, painPoint, outcome, angle } = input;

  return [
    // 1. Hero product shot
    {
      prompt: `Professional product advertisement photo for "${productName}". Clean, modern, minimalist composition on a gradient background. Premium feel, high-end commercial photography style. No text overlays. Studio lighting with subtle shadows. The product should be the hero of the image.`,
      size: "1024x1024" as const,
      quality: "hd" as const,
    },
    // 2. Problem-solution split
    {
      prompt: `Split-image advertisement concept: Left side shows frustration and struggle (representing "${painPoint}" for ${audience}) in muted, grey tones. Right side shows relief, success, and achievement (representing "${outcome}") in warm, vibrant colors. Clean modern style, no text. Professional advertising photography.`,
      size: "1792x1024" as const,
      quality: "standard" as const,
    },
    // 3. Social proof / lifestyle
    {
      prompt: `Lifestyle photography for advertisement: Happy, confident ${audience} person in a natural environment, looking satisfied and successful. Warm, inviting tones. Candid feel but professionally lit. Represents someone who has achieved "${outcome}". No text. Clean, modern aesthetic suitable for Facebook/Instagram ads.`,
      size: "1024x1024" as const,
      quality: "standard" as const,
    },
    // 4. Bold statement graphic
    {
      prompt: `Bold, eye-catching advertisement background graphic. Abstract modern design with electric blue (#06b6d4) and dark navy (#050a14) color scheme. Dynamic geometric shapes suggesting transformation and progress. Clean, premium feel. No text. Suitable as a background for a direct response advertisement.`,
      size: "1792x1024" as const,
      quality: "standard" as const,
    },
    // 5. Urgency / scarcity visual
    {
      prompt: `Minimalist advertisement visual conveying urgency and exclusivity. Premium dark background with a single spotlight effect. Subtle elements suggesting limited availability or time sensitivity. Modern, clean, luxurious feel with cyan accent highlights. No text. Professional graphic design style.`,
      size: "1024x1024" as const,
      quality: "standard" as const,
    },
  ];
}
