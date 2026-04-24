// ---------------------------------------------------------------------------
// Himalaya Video Spokesperson — our own AI video generation system
//
// Three tiers:
// 1. HeyGen API (premium — if key configured, uses their avatars)
// 2. fal.ai image + browser TTS (mid-tier — AI-generated presenter image + voice)
// 3. Animated text video (free — motion graphics with AI script)
//
// Output: Embeddable video component for sites, social media, and ads
// Uses our unified AI for scripts, fal.ai for visuals (already configured)
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";
import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type VideoConfig = {
  businessName: string;
  niche: string;
  targetAudience: string;
  style: "professional" | "casual" | "energetic" | "empathetic";
  duration: "15s" | "30s" | "60s" | "90s";
  purpose: "welcome" | "sales" | "testimonial" | "explainer" | "ad";
};

export type VideoResult = {
  ok: boolean;
  method: "heygen" | "fal_presenter" | "animated_text";
  script: string;
  scenes: VideoScene[];
  presenterImageUrl?: string;
  embedCode: string;
  error?: string;
};

export type VideoScene = {
  text: string;
  duration: number; // seconds
  animation: "fade_in" | "slide_left" | "slide_up" | "zoom" | "typewriter";
  background: string; // CSS gradient or color
  textColor: string;
  fontSize: "xl" | "2xl" | "3xl" | "4xl";
  subtext?: string;
};

// ── Script Generator ─────────────────────────────────────────────────────────

async function generateVideoScript(config: VideoConfig): Promise<{
  script: string;
  scenes: Array<{ text: string; subtext?: string; duration: number }>;
}> {
  const durationMap = { "15s": 15, "30s": 30, "60s": 60, "90s": 90 };
  const totalSeconds = durationMap[config.duration];
  const sceneCount = Math.max(3, Math.floor(totalSeconds / 8));

  const purposeContext = {
    welcome: "welcoming new visitors to the website",
    sales: "convincing viewers to buy/sign up",
    testimonial: "sharing a customer success story",
    explainer: "explaining how the product/service works",
    ad: "a social media ad that stops the scroll",
  };

  const result = await generateAI({
    prompt: `Create a ${config.duration} video script for ${config.businessName} (${config.niche}).
Purpose: ${purposeContext[config.purpose]}
Target audience: ${config.targetAudience}
Tone: ${config.style}

Return a JSON object with:
{
  "script": "The full spoken script",
  "scenes": [
    { "text": "Main text shown on screen (max 12 words)", "subtext": "Optional subtitle (max 20 words)", "duration": <seconds> }
  ]
}

Rules:
- Exactly ${sceneCount} scenes
- Total duration must equal ${totalSeconds} seconds
- Each scene text should be impactful, scannable
- First scene = hook (grab attention)
- Last scene = CTA (clear action)
- Middle scenes = value/proof
- Return ONLY valid JSON`,
    systemPrompt: "You are a world-class video scriptwriter who creates scroll-stopping content. Return only valid JSON.",
    maxTokens: 1000,
  });

  try {
    const parsed = JSON.parse(result.content);
    return {
      script: parsed.script ?? "",
      scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
    };
  } catch {
    // Fallback scenes
    return {
      script: `${config.businessName} helps ${config.targetAudience} with ${config.niche}. Get started today.`,
      scenes: [
        { text: `Struggling with ${config.niche}?`, duration: Math.floor(totalSeconds / 3) },
        { text: `${config.businessName} makes it easy`, subtext: "Proven results. Zero guesswork.", duration: Math.floor(totalSeconds / 3) },
        { text: "Get started free today", subtext: "Click below to learn more", duration: Math.ceil(totalSeconds / 3) },
      ],
    };
  }
}

// ── AI Presenter Image (via fal.ai) ─────────────────────────────────────────

async function generatePresenterImage(config: {
  style: string;
  niche: string;
}): Promise<string | null> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) return null;

  try {
    const prompt = config.style === "professional"
      ? "Professional business person in modern office, friendly smile, looking at camera, headshot style, clean background, photorealistic, 4k"
      : config.style === "casual"
      ? "Friendly young professional in casual setting, warm smile, looking at camera, natural lighting, photorealistic"
      : "Energetic presenter in bright studio, confident pose, looking at camera, modern background, photorealistic";

    const res = await fetch("https://queue.fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: "cartoon, anime, illustration, painting, drawing, blurry, low quality",
        image_size: "square_hd",
        num_images: 1,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.images?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

// ── HeyGen Integration (if configured) ──────────────────────────────────────

async function generateWithHeyGen(input: {
  script: string;
  avatarId?: string;
}): Promise<{ ok: boolean; videoUrl?: string; error?: string }> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return { ok: false, error: "HeyGen not configured" };

  try {
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
            avatar_id: input.avatarId ?? "Angela-inTshirt-20220820",
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: input.script,
            voice_id: "en-US-JennyNeural",
          },
        }],
        dimension: { width: 1080, height: 1920 },
      }),
    });

    if (!res.ok) return { ok: false, error: `HeyGen ${res.status}` };
    const data = await res.json();
    return { ok: true, videoUrl: data.data?.video_url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "HeyGen failed" };
  }
}

// ── Embed Code Generator ─────────────────────────────────────────────────────

function generateEmbedCode(scenes: VideoScene[], presenterImageUrl?: string, config?: VideoConfig): string {
  const animations: Record<string, string> = {
    fade_in: "animation: fadeIn 0.8s ease-out forwards;",
    slide_left: "animation: slideLeft 0.6s ease-out forwards;",
    slide_up: "animation: slideUp 0.6s ease-out forwards;",
    zoom: "animation: zoomIn 0.5s ease-out forwards;",
    typewriter: "animation: fadeIn 1.2s ease-out forwards;",
  };

  const sceneHtml = scenes.map((scene, i) => `
    <div class="hv-scene" data-index="${i}" data-duration="${scene.duration}" style="display:none;${animations[scene.animation] ?? animations.fade_in}">
      ${presenterImageUrl ? `<img src="${presenterImageUrl}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 20px;display:block;border:3px solid rgba(255,255,255,0.2);" alt="Presenter"/>` : ""}
      <h2 style="font-size:${scene.fontSize === "4xl" ? "36px" : scene.fontSize === "3xl" ? "30px" : scene.fontSize === "2xl" ? "24px" : "20px"};font-weight:900;color:${scene.textColor};text-align:center;margin:0 0 12px;line-height:1.2;">${scene.text}</h2>
      ${scene.subtext ? `<p style="font-size:14px;color:rgba(255,255,255,0.6);text-align:center;margin:0;">${scene.subtext}</p>` : ""}
    </div>`).join("");

  return `<div id="himalaya-video" style="position:relative;width:100%;max-width:400px;aspect-ratio:9/16;border-radius:24px;overflow:hidden;margin:0 auto;">
  <style>
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideLeft { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
    @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
    @keyframes zoomIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
    .hv-scene { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 24px; }
    .hv-progress { position:absolute; bottom:0; left:0; height:3px; background:linear-gradient(90deg,#f5a623,#e07850); transition:width 0.3s linear; z-index:10; }
  </style>
  ${sceneHtml}
  <div class="hv-progress" style="width:0%"></div>
  <script>
  (function(){
    var scenes = document.querySelectorAll('.hv-scene');
    var progress = document.querySelector('.hv-progress');
    var total = 0;
    scenes.forEach(function(s){ total += parseInt(s.dataset.duration); });
    var current = 0, elapsed = 0;
    function show(i) {
      scenes.forEach(function(s){ s.style.display = 'none'; });
      if (scenes[i]) {
        scenes[i].style.display = 'flex';
        ${config?.style !== "professional" ? `
        if ('speechSynthesis' in window) {
          var u = new SpeechSynthesisUtterance(scenes[i].querySelector('h2').textContent);
          u.rate = 0.9; speechSynthesis.speak(u);
        }` : ""}
      }
    }
    show(0);
    var interval = setInterval(function(){
      elapsed++;
      var sceneDur = parseInt(scenes[current].dataset.duration);
      if (elapsed >= sceneDur) {
        elapsed = 0; current++;
        if (current >= scenes.length) { clearInterval(interval); return; }
        show(current);
      }
      var totalElapsed = 0;
      for (var i=0; i<current; i++) totalElapsed += parseInt(scenes[i].dataset.duration);
      totalElapsed += elapsed;
      progress.style.width = ((totalElapsed/total)*100) + '%';
    }, 1000);
  })();
  </script>
</div>`;
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

/** Generate a video spokesperson for a business */
export async function generateVideoSpokesperson(
  config: VideoConfig,
  userId: string,
): Promise<VideoResult> {
  // Generate the script
  const { script, scenes: rawScenes } = await generateVideoScript(config);

  const animations: VideoScene["animation"][] = ["fade_in", "slide_left", "slide_up", "zoom", "typewriter"];
  const backgrounds = [
    "linear-gradient(135deg, #0f172a, #1e293b)",
    "linear-gradient(135deg, #1e1b4b, #312e81)",
    "linear-gradient(135deg, #042f2e, #134e4a)",
    "linear-gradient(135deg, #1c1917, #292524)",
    "linear-gradient(135deg, #0c0a09, #1c1917)",
  ];

  // Build scenes
  const videoScenes: VideoScene[] = rawScenes.map((s, i) => ({
    text: s.text,
    subtext: s.subtext,
    duration: s.duration || 5,
    animation: animations[i % animations.length],
    background: backgrounds[i % backgrounds.length],
    textColor: "#ffffff",
    fontSize: i === 0 ? "3xl" : i === rawScenes.length - 1 ? "3xl" : "2xl",
  }));

  // ── Try HeyGen first (premium) ──────────────────────────────────────────
  if (process.env.HEYGEN_API_KEY) {
    const heygenResult = await generateWithHeyGen({ script });
    if (heygenResult.ok && heygenResult.videoUrl) {
      const embedCode = `<video src="${heygenResult.videoUrl}" controls autoplay muted style="width:100%;max-width:400px;border-radius:24px;" />`;

      await logVideo(userId, config, "heygen", script);

      return {
        ok: true,
        method: "heygen",
        script,
        scenes: videoScenes,
        embedCode,
      };
    }
  }

  // ── Try fal.ai presenter image (mid-tier) ───────────────────────────────
  let presenterImageUrl: string | null = null;
  if (process.env.FAL_KEY) {
    presenterImageUrl = await generatePresenterImage({
      style: config.style,
      niche: config.niche,
    });
  }

  const embedCode = generateEmbedCode(videoScenes, presenterImageUrl ?? undefined, config);

  await logVideo(userId, config, presenterImageUrl ? "fal_presenter" : "animated_text", script);

  return {
    ok: true,
    method: presenterImageUrl ? "fal_presenter" : "animated_text",
    script,
    scenes: videoScenes,
    presenterImageUrl: presenterImageUrl ?? undefined,
    embedCode,
  };
}

async function logVideo(userId: string, config: VideoConfig, method: string, script: string) {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "video_generated",
      metadata: JSON.parse(JSON.stringify({
        method,
        businessName: config.businessName,
        purpose: config.purpose,
        duration: config.duration,
        style: config.style,
        scriptLength: script.length,
        createdAt: new Date().toISOString(),
      })),
    },
  }).catch(() => {});
}

/** Generate a quick sales video for a campaign */
export async function generateQuickSalesVideo(input: {
  businessName: string;
  niche: string;
  offer: string;
  userId: string;
}): Promise<VideoResult> {
  return generateVideoSpokesperson({
    businessName: input.businessName,
    niche: input.niche,
    targetAudience: `People looking for ${input.niche} solutions`,
    style: "energetic",
    duration: "30s",
    purpose: "ad",
  }, input.userId);
}
