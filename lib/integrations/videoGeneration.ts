// ---------------------------------------------------------------------------
// AI Video Generation — motion graphic ads from ad briefs
// Uses Creatomate (primary) with Runway as experimental fallback
// ---------------------------------------------------------------------------

export type VideoGenInput = {
  title: string;
  scenes: VideoScene[];
  format: "landscape" | "portrait" | "square";
  duration: number; // seconds
  style: "ugc" | "direct-response" | "cinematic" | "minimal";
};

export type VideoScene = {
  text: string;
  duration: number; // seconds
  transition?: "fade" | "cut" | "slide";
  backgroundType: "solid" | "gradient" | "image";
  backgroundColor?: string;
  backgroundImageBase64?: string;
  textPosition?: "center" | "bottom" | "top";
  fontSize?: "large" | "medium" | "small";
};

export type GeneratedVideo = {
  url?: string;
  base64?: string;
  format: string;
  durationSeconds: number;
  model: string;
};

export type VideoGenResult = {
  ok: boolean;
  video?: GeneratedVideo;
  error?: string;
};

/** Generate video using Creatomate API (template-based) */
async function generateWithCreatomate(input: VideoGenInput): Promise<VideoGenResult> {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) return { ok: false, error: "CREATOMATE_API_KEY not set" };

  try {
    // Build JSON-based video (no template needed — full code control)
    const width = input.format === "portrait" ? 1080 : input.format === "landscape" ? 1920 : 1080;
    const height = input.format === "portrait" ? 1920 : input.format === "landscape" ? 1080 : 1080;

    const elements = input.scenes.map((scene, i) => {
      const startTime = input.scenes.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
      return {
        type: "composition",
        track: 1,
        time: startTime,
        duration: scene.duration,
        elements: [
          // Background
          {
            type: "shape",
            track: 1,
            shape: "rectangle",
            width: "100%",
            height: "100%",
            fill_color: scene.backgroundColor ?? "#0c0a08",
          },
          // Text overlay
          {
            type: "text",
            track: 2,
            text: scene.text,
            font_family: "Inter",
            font_weight: "700",
            font_size: scene.fontSize === "large" ? "8 vmin" : scene.fontSize === "small" ? "4 vmin" : "6 vmin",
            fill_color: "#ffffff",
            x: "50%",
            y: scene.textPosition === "top" ? "25%" : scene.textPosition === "bottom" ? "75%" : "50%",
            x_alignment: "50%",
            y_alignment: "50%",
            width: "80%",
            text_alignment: "center",
            enter: { effect: "text-appear", duration: 0.5 },
          },
        ],
      };
    });

    const response = await fetch("https://api.creatomate.com/v2/renders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          output_format: "mp4",
          width,
          height,
          duration: input.duration,
          elements,
        },
      ]),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { ok: false, error: `Creatomate error: ${errText}` };
    }

    const data = await response.json();
    const render = data[0];

    // Creatomate returns async renders — poll for completion
    if (render?.id) {
      const videoUrl = await pollCreatomateRender(apiKey, render.id);
      if (videoUrl) {
        return {
          ok: true,
          video: {
            url: videoUrl,
            format: "mp4",
            durationSeconds: input.duration,
            model: "creatomate",
          },
        };
      }
    }

    return { ok: false, error: "Creatomate render did not complete" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Creatomate failed" };
  }
}

/** Poll Creatomate render status until complete */
async function pollCreatomateRender(
  apiKey: string,
  renderId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const response = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) continue;

    const data = await response.json();
    if (data.status === "succeeded" && data.url) return data.url;
    if (data.status === "failed") return null;
  }
  return null;
}

/** Generate video using Runway (experimental — for more cinematic output) */
async function generateWithRunway(input: VideoGenInput): Promise<VideoGenResult> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) return { ok: false, error: "RUNWAY_API_KEY not set" };

  try {
    // Runway Gen-3 Alpha image-to-video
    // Build a text prompt from scenes
    const sceneText = input.scenes.map((s) => s.text).join(". ");
    const prompt = `Create a ${input.style} advertisement video: ${sceneText}. Professional quality, smooth motion, modern design.`;

    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptText: prompt,
        duration: Math.min(input.duration, 10), // Runway max 10s
        watermark: false,
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Runway error: ${response.status}` };
    }

    const data = await response.json();
    if (data.id) {
      // Poll for completion
      const videoUrl = await pollRunwayTask(apiKey, data.id);
      if (videoUrl) {
        return {
          ok: true,
          video: {
            url: videoUrl,
            format: "mp4",
            durationSeconds: Math.min(input.duration, 10),
            model: "runway-gen3a",
          },
        };
      }
    }

    return { ok: false, error: "Runway render did not complete" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Runway failed" };
  }
}

async function pollRunwayTask(
  apiKey: string,
  taskId: string,
  maxAttempts = 60,
  intervalMs = 3000
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    });

    if (!response.ok) continue;
    const data = await response.json();
    if (data.status === "SUCCEEDED" && data.output?.[0]) return data.output[0];
    if (data.status === "FAILED") return null;
  }
  return null;
}

/** Generate video — tries Creatomate first, falls back to Runway */
export async function generateVideo(input: VideoGenInput): Promise<VideoGenResult> {
  // Try Creatomate first (faster, more reliable for text-based ads)
  if (process.env.CREATOMATE_API_KEY) {
    const result = await generateWithCreatomate(input);
    if (result.ok) return result;
  }

  // Fallback to Runway (more cinematic but slower)
  if (process.env.RUNWAY_API_KEY) {
    return generateWithRunway(input);
  }

  return { ok: false, error: "No video generation API available (set CREATOMATE_API_KEY or RUNWAY_API_KEY)" };
}

/** Convert ad brief scenes to video generation input */
export function adBriefToVideoInput(brief: {
  title: string;
  platform: string;
  scenes: { timestamp: string; textOverlay: string; audio: string }[];
  productionKit: { colorGrade: string };
}): VideoGenInput {
  const format: "portrait" | "landscape" | "square" =
    brief.platform === "TikTok" || brief.platform === "Instagram"
      ? "portrait"
      : brief.platform === "Facebook"
        ? "landscape"
        : "square";

  const scenes: VideoScene[] = brief.scenes.map((scene) => {
    // Parse duration from timestamp (e.g., "0-5s" → 5 seconds)
    const match = scene.timestamp.match(/(\d+)-(\d+)/);
    const duration = match ? parseInt(match[2]) - parseInt(match[1]) : 5;

    return {
      text: scene.textOverlay || scene.audio.replace(/"/g, ""),
      duration,
      transition: "fade",
      backgroundType: "solid",
      backgroundColor: "#0c0a08",
      textPosition: "center",
      fontSize: "large",
    };
  });

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    title: brief.title,
    scenes,
    format,
    duration: totalDuration,
    style: brief.platform === "Cinematic" ? "cinematic" : "direct-response",
  };
}
