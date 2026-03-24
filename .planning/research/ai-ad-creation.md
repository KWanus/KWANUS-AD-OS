# AI-Powered Ad Creation Research

**Researched:** 2026-03-22
**Domain:** AI image generation, AI video generation, browser canvas editing, ad format standards
**Confidence:** MEDIUM (training knowledge through Aug 2025; no live web verification possible in this session — flag items marked LOW before shipping)
**Project stack:** Next.js 16.2.0, React 19.2.4, TypeScript 5, Tailwind 4, Prisma 7 (Phase 4: Creative Engine)

---

## Summary

The AI creative tooling landscape has consolidated rapidly. As of mid-2025, the practical playbook for a platform competing with Canva and CapCut is:

1. **Image ads:** Use a best-in-class generation API (Ideogram 2.0 or Recraft V3 for text-on-image quality, DALL-E 3 / gpt-image-1 for prompt flexibility) to produce a base image, then let the user edit in a browser canvas powered by **Fabric.js** or **Konva.js**. Do NOT hand-roll image synthesis — even a mediocre API beats native Canvas 2D for output quality.

2. **Video ads:** AI video generation APIs (Runway, Kling, Luma) produce 5–10 second clips from a text prompt or image. The practical architecture is: user builds a storyboard of scenes in-browser, each scene goes to a video API, clips are assembled client-side or via a lightweight server-side queue. Remotion is the right tool for programmatic video rendering/export in React if you need branded motion graphics; raw AI video APIs are better for photorealistic footage.

3. **Beat Canva/CapCut by:** (a) going AI-native so every blank canvas starts pre-populated with platform-correct dimensions and AI-generated content, and (b) integrating ad platform export specs so users never misconfigure a TikTok vs Facebook asset.

**Primary recommendation:** Ship an image-ad studio first (canvas editor + Ideogram/DALL-E generation + template system), then layer video storyboard on top. Video generation APIs are rate-limited and expensive — design the UX to set async expectations.

---

## Standard Stack

### Core Image Generation APIs

| API | Best Model | Key Strength | Text-on-image? | Pricing (as of Aug 2025) | Confidence |
|-----|-----------|-------------|----------------|--------------------------|------------|
| OpenAI gpt-image-1 | gpt-image-1 | Instruction-following, edits | YES (good) | ~$0.04/image (1024px std) | HIGH |
| OpenAI DALL-E 3 | dall-e-3 | Prompt coherence, safety | Passable | ~$0.04–0.08/image | HIGH |
| Ideogram 2.0 | ideogram-v2 | Best-in-class text rendering | EXCELLENT | ~$0.06/image (Turbo cheaper) | MEDIUM |
| Recraft V3 | recraftv3 | Vector/brand styles, consistency | EXCELLENT | ~$0.04/image | MEDIUM |
| Stability AI (SDXL/SD3) | stable-diffusion-3 | Cheap, self-hostable | Poor | ~$0.003–0.04/image | HIGH |
| Flux (Black Forest Labs) | flux-pro, flux-dev | High detail, photorealism | Moderate | via Replicate/FAL ~$0.05/img | MEDIUM |
| FAL.ai hosted | fal-ai/* | Low-latency Flux/SD hosting | Variable | Pay-per-use | MEDIUM |

**Recommendation for Phase 4:** Lead with **gpt-image-1** (best developer experience, OpenAI SDK already familiar) and **Ideogram 2.0** (for ads with headline text baked in). Both have straightforward REST APIs. Recraft V3 is the sleeper pick for brand consistency.

### Core Video Generation APIs

| API | Model | Video Length | Key Strength | Has REST API? | Pricing Tier | Confidence |
|-----|-------|-------------|-------------|---------------|--------------|------------|
| Runway Gen-3 Alpha | gen3a_turbo | 5–10s | Cinematic motion, pro quality | YES | ~$0.05/credit | HIGH |
| Kling AI | kling-v1.5/v2 | 5–10s | Chinese product ads, motion quality | YES (via partners) | ~$0.14/5s | MEDIUM |
| Luma Dream Machine | dream-machine | 5s | Fast, photorealistic | YES | ~$0.08/5s | MEDIUM |
| Pika 2.0 | pika-2.0 | 3–5s | Easy to use, style control | YES | ~$0.05/s | MEDIUM |
| HeyGen | 2.0 | 30–120s | Avatar/spokesperson videos | YES | $29+/mo plans | HIGH |
| Synthesia | 2.0 | Up to 30min | Enterprise avatar video | YES | $22+/mo | HIGH |
| Veed.io | (editing) | N/A | AI editing overlays, subtitles | YES | $18+/mo | HIGH |
| Sora (OpenAI) | sora-1080p | 5–20s | Highest quality, slow | API limited/waitlist | Enterprise pricing | LOW |

**Recommendation:** Use **Runway Gen-3 Alpha Turbo** as primary (best REST API, best quality). Add **Luma Dream Machine** as fallback (faster, cheaper). HeyGen is the right pick specifically for spokesperson/avatar-style ads.

### Browser Canvas Libraries

| Library | Bundle Size | Use Case | Learning Curve | TypeScript | Confidence |
|---------|------------|---------|----------------|------------|------------|
| **Fabric.js 6.x** | ~180KB | Image+text editor, layers, groups | Low-Medium | Good (DefinitelyTyped) | HIGH |
| **Konva.js 9.x** | ~150KB | High-perf 2D canvas, React integration | Medium | Excellent (built-in) | HIGH |
| react-konva | ~15KB | React bindings for Konva | Low | Excellent | HIGH |
| tldraw 2.x | ~1MB+ | Whiteboard-style, freeform | Low | Excellent | HIGH |
| Excalidraw | ~800KB | Sketch-style whiteboard | Low | Good | MEDIUM |
| Remotion 4.x | Varies | Programmatic video in React | High | Excellent | HIGH |

**Winner for ad studio:** **Konva.js + react-konva**. Reasons:
- First-class React integration (no imperative ref gymnastics)
- React 19 compatible
- Canvas elements are real React components — state management is trivial
- Excellent TypeScript support built-in
- Handles image/text/shape layers with events naturally
- Fabric.js is more battle-tested but its React integration requires manual sync

**Winner for video rendering:** **Remotion 4.x** for programmatic motion graphics. For raw AI video clips: stream/display with native `<video>` element.

### Supporting Libraries

| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| react-konva | ^19 | React bindings for Konva.js | `npm i react-konva konva` |
| konva | ^9 | Canvas engine | included above |
| @remotion/player | ^4 | In-browser video preview | `npm i @remotion/player remotion` |
| openai | ^4 | OpenAI SDK (DALL-E 3, gpt-image-1) | `npm i openai` |
| replicate | ^0.32 | Replicate API (Flux, SDXL) | `npm i replicate` |
| sharp | ^0.33 | Server-side image resizing/compositing | `npm i sharp` |
| @vercel/blob | ^0.27 | Store generated images/videos | `npm i @vercel/blob` |
| zustand | ^4 | Canvas state management | `npm i zustand` |
| react-dropzone | ^14 | Asset upload to canvas | `npm i react-dropzone` |

### Alternatives Considered

| Instead of | Could Use | Why We Don't |
|------------|-----------|-------------|
| Konva.js | Fabric.js | Fabric has better ecosystem docs but React integration is imperative |
| Konva.js | tldraw | tldraw is whiteboard-focused, not precision ad layout |
| Remotion | FFmpeg.wasm | FFmpeg.wasm is 30MB+, slow in-browser; Remotion uses React renderer |
| Ideogram API | Stable Diffusion self-hosted | Quality gap too large; ops burden not worth it for Phase 4 |
| Vercel Blob | S3 | Project is on Vercel stack, Blob is zero-config |

---

## Ad Format Standards

### Exact Platform Dimensions

| Platform | Format | Width | Height | Aspect Ratio | Max File Size | Notes |
|----------|--------|-------|--------|-------------|---------------|-------|
| TikTok | Feed Ad | 1080 | 1920 | 9:16 | 500MB (video) | Also 1:1 supported |
| TikTok | TopView | 1080 | 1920 | 9:16 | 500MB | Full screen takeover |
| Facebook | Feed Image | 1080 | 1080 | 1:1 | 30MB | Also 1.91:1 |
| Facebook | Story/Reel | 1080 | 1920 | 9:16 | 4GB (video) | Safe zone: 250px top/bottom |
| Instagram | Feed | 1080 | 1080 | 1:1 | 30MB | 4:5 (1080x1350) also popular |
| Instagram | Story | 1080 | 1920 | 9:16 | 30MB | Safe zone: 250px top/bottom |
| Instagram | Reels Ad | 1080 | 1920 | 9:16 | 4GB | Same as TikTok spec |
| YouTube | Shorts Ad | 1080 | 1920 | 9:16 | 256GB | Max 60s |
| YouTube | Pre-roll | 1920 | 1080 | 16:9 | 256GB | Skippable at 5s |
| LinkedIn | Image Ad | 1200 | 627 | 1.91:1 | 5MB | Business audience |
| Google Display | Banner | 728 | 90 | 8.09:1 | 150KB | Multiple sizes needed |

**Confidence:** HIGH — these are published platform specs. Note: platforms update these occasionally; verify against current Meta/TikTok business help docs before shipping.

### The 3 Primary Templates to Build First

1. **Square (1080x1080):** Facebook/Instagram Feed — widest reach, simplest
2. **Vertical (1080x1920):** TikTok/IG Story/Reels — mobile-native, fastest growing
3. **Horizontal (1920x1080):** YouTube pre-roll — desktop/connected TV

All AI image generation APIs support these aspect ratios natively.

---

## Architecture Patterns

### Recommended Creative Studio Project Structure

```
app/
├── creative/
│   ├── page.tsx                  # Studio entry — pick template or generate
│   ├── [projectId]/
│   │   ├── image/
│   │   │   └── page.tsx          # Image ad canvas editor
│   │   ├── video/
│   │   │   └── page.tsx          # Video storyboard builder
│   │   └── export/
│   │       └── page.tsx          # Format export + download
│
app/api/
├── creative/
│   ├── generate-image/route.ts   # POST → calls AI image API, returns URL
│   ├── generate-video/route.ts   # POST → starts async video job, returns jobId
│   ├── video-status/route.ts     # GET → polls video job status
│   └── export/route.ts           # POST → composites final image via sharp
│
lib/
├── creative/
│   ├── imageGenerators/
│   │   ├── openai.ts             # gpt-image-1 / DALL-E 3 adapter
│   │   ├── ideogram.ts           # Ideogram 2.0 adapter
│   │   └── index.ts              # Provider selector
│   ├── videoGenerators/
│   │   ├── runway.ts             # Runway Gen-3 adapter
│   │   ├── luma.ts               # Luma Dream Machine adapter
│   │   └── index.ts              # Provider selector
│   ├── canvasState.ts            # Zustand store for Konva canvas
│   ├── templates.ts              # Template definitions (dimensions, zones)
│   └── adFormats.ts              # Platform spec constants
│
components/
├── creative/
│   ├── CanvasEditor/
│   │   ├── index.tsx             # Main Konva Stage wrapper
│   │   ├── TextLayer.tsx         # react-konva Text with editing
│   │   ├── ImageLayer.tsx        # react-konva Image with transform
│   │   ├── ShapeLayer.tsx        # Rect/Ellipse for overlays/CTAs
│   │   └── Toolbar.tsx           # Add layer, format select, download
│   ├── VideoStoryboard/
│   │   ├── index.tsx             # Scene list + preview
│   │   ├── SceneCard.tsx         # Individual scene (prompt + duration + style)
│   │   └── GenerateButton.tsx    # Triggers async video gen
│   └── TemplateSelector.tsx      # Grid of 3 formats with thumbnails
```

### Pattern 1: API Route as Thin Adapter (CRITICAL for this domain)

All AI API calls MUST go through Next.js API routes — never call image/video generation APIs directly from client components. Reasons: API key security, rate limit management, response caching, server-side image processing with sharp.

```typescript
// app/api/creative/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { selectImageGenerator } from '@/lib/creative/imageGenerators'

export async function POST(req: NextRequest) {
  const { prompt, format, provider = 'openai', aspectRatio } = await req.json()

  // Validate format against known ad specs
  const validFormats = ['1:1', '9:16', '16:9'] as const
  if (!validFormats.includes(aspectRatio)) {
    return NextResponse.json({ error: 'Invalid aspect ratio' }, { status: 400 })
  }

  const generator = selectImageGenerator(provider)
  const result = await generator.generate({ prompt, aspectRatio })

  // Store URL in Vercel Blob or return base64
  return NextResponse.json({ url: result.url, revised_prompt: result.revisedPrompt })
}
```

### Pattern 2: Async Video Generation with Polling

Video generation takes 30–120 seconds. Design for async from day one.

```typescript
// app/api/creative/generate-video/route.ts
export async function POST(req: NextRequest) {
  const { scenes, style } = await req.json()

  // Start job, return jobId immediately
  const job = await runwayClient.imageToVideo.create({
    model: 'gen3a_turbo',
    promptImage: scenes[0].imageUrl,
    promptText: scenes[0].prompt,
    duration: 5,
    ratio: '768:1344' // 9:16
  })

  // Store job in DB for polling
  await prisma.videoJob.create({ data: { jobId: job.id, status: 'pending' } })

  return NextResponse.json({ jobId: job.id })
}

// app/api/creative/video-status/route.ts
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')
  const status = await runwayClient.tasks.retrieve(jobId)

  if (status.status === 'SUCCEEDED') {
    // Store video URL in Vercel Blob for permanence
    return NextResponse.json({ status: 'done', url: status.output[0] })
  }
  return NextResponse.json({ status: status.status })
}
```

### Pattern 3: Konva Canvas with Zustand State

```typescript
// lib/creative/canvasState.ts
import { create } from 'zustand'

interface CanvasLayer {
  id: string
  type: 'image' | 'text' | 'shape'
  x: number
  y: number
  width: number
  height: number
  content: string      // url for image, text content for text
  style: LayerStyle
  zIndex: number
}

interface CanvasStore {
  layers: CanvasLayer[]
  selectedId: string | null
  format: '1:1' | '9:16' | '16:9'
  canvasWidth: number
  canvasHeight: number
  addLayer: (layer: Omit<CanvasLayer, 'id' | 'zIndex'>) => void
  updateLayer: (id: string, updates: Partial<CanvasLayer>) => void
  removeLayer: (id: string) => void
  setSelected: (id: string | null) => void
  setFormat: (format: '1:1' | '9:16' | '16:9') => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  layers: [],
  selectedId: null,
  format: '1:1',
  canvasWidth: 600,    // display size — export at 1080
  canvasHeight: 600,
  addLayer: (layer) => set(state => ({
    layers: [...state.layers, { ...layer, id: crypto.randomUUID(), zIndex: state.layers.length }]
  })),
  // ... rest of actions
}))
```

### Pattern 4: Template System

Templates define zones, not just dimensions. A zone is a named region with rules (e.g., "headline: top 20%, max 2 lines, font size 48+").

```typescript
// lib/creative/templates.ts
export interface AdTemplate {
  id: string
  name: string
  platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube'
  nativeWidth: number       // export at this size
  nativeHeight: number
  aspectRatio: '1:1' | '9:16' | '16:9'
  zones: {
    background: { x: 0; y: 0; fill: 'full' }
    headline: { x: number; y: number; maxWidth: number; maxHeight: number }
    body: { x: number; y: number; maxWidth: number; maxHeight: number }
    cta: { x: number; y: number; width: number; height: number }
    logo: { x: number; y: number; width: number; height: number }
    safeZone: { top: number; bottom: number; left: number; right: number }
  }
}

export const TIKTOK_VERTICAL: AdTemplate = {
  id: 'tiktok-9-16',
  name: 'TikTok / IG Story',
  platform: 'tiktok',
  nativeWidth: 1080,
  nativeHeight: 1920,
  aspectRatio: '9:16',
  zones: {
    background: { x: 0, y: 0, fill: 'full' },
    headline: { x: 54, y: 200, maxWidth: 972, maxHeight: 200 },   // top area
    body: { x: 54, y: 1400, maxWidth: 972, maxHeight: 300 },       // bottom safe zone
    cta: { x: 390, y: 1750, width: 300, height: 90 },
    logo: { x: 40, y: 40, width: 120, height: 60 },
    safeZone: { top: 250, bottom: 250, left: 54, right: 54 }       // TikTok UI clearance
  }
}
```

### Anti-Patterns to Avoid

- **Client-side API key exposure:** Never import `openai` in a component. Always use API routes.
- **Synchronous video generation wait:** Never `await` a video generation call in the same HTTP request — always job queue + polling.
- **canvas.toDataURL() for export:** Produces low-res output. Export at native resolution via server-side sharp compositing.
- **Single provider lock-in:** Abstract all AI calls behind `selectImageGenerator()` / `selectVideoGenerator()` so providers can be swapped without touching UI.
- **Storing generated images as base64 in DB:** Store URLs (Vercel Blob / S3) and reference them. Base64 in Postgres is a schema disaster.
- **Blocking the UI during generation:** Use optimistic UI + polling. Show skeleton/progress state immediately.
- **Re-generating on every edit:** Cache the AI-generated base image. Only regenerate when the prompt changes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image synthesis | Custom ML pipeline | OpenAI / Ideogram / Recraft API | Years of training, safety filtering, no GPU ops needed |
| Video synthesis | Frame-by-frame renderer | Runway / Luma / Kling API | Temporal consistency, motion quality far beyond DIY |
| Canvas text rendering | CSS-over-canvas hacks | Konva.js Text with fontFamily | Subpixel AA, multi-line, word wrap all handled |
| Image compositing | Canvas 2D drawImage loops | sharp (server) | ICC color profiles, EXIF stripping, 10x faster |
| Font loading | Manual FontFace API | Next.js font optimization + Konva | Google Fonts CDN, FOUT handling, tree shaking |
| Video player | Custom <video> controls | @remotion/player | Seeking, frames, codec handling all built-in |
| Color picker | Input type=color | react-colorful | 1.5KB, HSL, alpha, accessible |
| Asset storage | Local filesystem | Vercel Blob or Supabase Storage | Persistent, CDN-distributed, easy signed URLs |
| Background removal | Canvas pixel manipulation | remove.bg API or Clipdrop API | ML segmentation quality impossible to match |
| Upscaling/Enhancement | Bicubic upscaling | Stability AI Real-ESRGAN or Magnific | 4x with detail hallucination |

**Key insight:** In the AI creative space, the "heavy lifting" (synthesis, motion, compositing) is solved by specialized APIs. Your competitive advantage is the UX layer and the workflow intelligence (knowing what prompt to send based on business context from Phase 1-2 scans) — not re-implementing image processing.

---

## What Makes Canva / CapCut Great (and How to Beat Them)

### What Canva Does Right
- **Magic Studio:** Generate image → instantly placed on canvas at correct dimensions. One click = usable starting point.
- **Brand Kit:** Logo, colors, fonts saved globally. Every new design auto-applies brand.
- **Resize magic:** One design → auto-resized to 12 platform formats.
- **Text-to-design:** Not just "generate image" but "generate the whole ad layout."
- **Collaboration:** Real-time multi-user canvas (uses Yjs CRDT under the hood).

### What CapCut Does Right
- **Auto-captions:** Speech-to-text overlaid in 30 seconds.
- **AI script-to-video:** Write a script, AI picks stock clips, assembles a video.
- **Templates are platform-native:** The default is TikTok 9:16. Everything is mobile-first.
- **Beat sync:** Audio reactive editing built in, not bolted on.

### How to Beat Them (KWANUS-specific advantages)

1. **Ad-first from day 1:** Canva is general-purpose. Your canvas starts with ad specs. Every template knows its platform, safe zones, and character limits.

2. **Business context injection:** Phase 1-2 scans provide business name, product description, USP, tone, brand colors. Pre-fill the ad generator: no blank canvas, no prompt-engineering required by the user.

3. **Hook science baked in:** TikTok ad research shows the first 3 seconds determine CTR. Build "hook scoring" into the headline zone — flag weak hooks before export.

4. **Platform rule enforcement:** "Your CTA text is inside TikTok's UI safe zone" — Canva doesn't know this because it's not ad-platform-native.

5. **Single workflow:** Scan → Score → Generate Ad → Export to platform. Zero tab-switching, zero copy-paste.

---

## High-Converting Ad Anatomy

### Static Image Ad (confidence: MEDIUM — based on widely cited direct response principles)

```
┌────────────────────────────────────┐
│  LOGO (top-left, 80-120px wide)   │ ← Brand recognition
├────────────────────────────────────┤
│                                    │
│   BACKGROUND IMAGE / COLOR BLOCK  │ ← Thumb-stopping visual
│   (contrasting, single focal pt)  │
│                                    │
│   HEADLINE (large, 48-72px)        │ ← Benefit, not feature. Max 8 words.
│   "Stop Losing Sales to           │
│    Slow Checkout"                  │
│                                    │
├────────────────────────────────────┤
│   BODY (24-32px, max 2 lines)      │ ← Social proof or stat
│   "3,200 brands increased         │
│    CVR 40% in 30 days"             │
├────────────────────────────────────┤
│   [    SHOP NOW    ]  CTA button  │ ← High-contrast, 90-100px tall
└────────────────────────────────────┘
```

**Rules:**
- Text/image ratio: 20% text max for Facebook (their rule), more for TikTok
- 60% of attention lands top-center first. Put the core message there.
- CTA must be bottom-center or bottom-right — eye tracking confirms
- Safe zone for TikTok/IG Story: avoid top 250px and bottom 250px (UI overlays)
- Single clear action per ad. Never two CTAs.

### Video Ad Hook Framework (first 3 seconds)

| Type | Formula | Example |
|------|---------|---------|
| Problem Hook | "Tired of [pain]?" | "Tired of paying $300/month for software that does nothing?" |
| Curiosity Hook | "This [thing] changed [outcome]..." | "This one trick doubled our open rate overnight..." |
| Social Proof Hook | "[Number] people [did thing]" | "47,000 businesses switched in 2024" |
| Contrast Hook | "Before vs after" split screen | Visual before/after of product impact |
| Direct CTA Hook | Loud text on screen + VO | "SWIPE UP if you want [specific result]" |

### Color Psychology for Ad Goals

| Goal | Primary Color | Why | Examples |
|------|-------------|-----|---------|
| Trust / Finance | Deep blue, navy | Institutional authority | Chase, PayPal, AmEx |
| Urgency / Sales | Red, orange | Physiological arousal, action | Amazon, Wish, sale banners |
| Health / Wellness | Green, teal | Natural, calming, safety | Whole Foods, fitness apps |
| Premium / Luxury | Black, gold, dark purple | Exclusivity, quality signals | Apple, Chanel ads |
| Youth / Energy | Bright purple, yellow | TikTok/Gen Z native | Discord, Duolingo |
| SaaS / Tech | Cyan, electric blue, gradient | Modern, innovative | Vercel, Linear, Figma |

---

## Common Pitfalls

### Pitfall 1: Treating AI Image Generation as Synchronous
**What goes wrong:** You call DALL-E 3, it takes 8-15 seconds, the UI freezes or the API route times out (Vercel 10s default limit).
**Why it happens:** Response times vary; network hiccups make it worse.
**How to avoid:** Set Vercel function timeout to 60s for generation routes. Use streaming or optimistic "generating..." state in UI. Consider edge runtime for shorter cold starts.
**Warning signs:** "Function exceeded max duration" errors in Vercel logs.

### Pitfall 2: Konva Stage SSR Crash
**What goes wrong:** Konva requires `window` and `document`. Next.js App Router renders on server. Importing Konva in a Server Component crashes.
**Why it happens:** Canvas API doesn't exist server-side.
**How to avoid:** All canvas components must be Client Components with `'use client'`. Additionally, dynamic import with `ssr: false` for the Stage:
```typescript
const CanvasEditor = dynamic(() => import('@/components/creative/CanvasEditor'), { ssr: false })
```
**Warning signs:** "window is not defined" at build or "document is not defined" in server logs.

### Pitfall 3: Font Inconsistency Between Canvas and Export
**What goes wrong:** Canvas renders with system fonts; exported image uses different metrics; text wraps differently.
**Why it happens:** Browser font loading is async; Konva renders before fonts load.
**How to avoid:** Pre-load all canvas fonts using FontFace API before initializing Konva Stage. Use `document.fonts.ready` promise.
**Warning signs:** Text clips, wraps differently, or shows fallback font in exports.

### Pitfall 4: AI-Generated Images with Wrong Aspect Ratio
**What goes wrong:** You generate 1:1, user switches to 9:16 template, image is cropped badly.
**Why it happens:** Not requesting the correct AR at generation time.
**How to avoid:** Tie the generation request to the selected template's aspectRatio. When user switches format, offer "regenerate for this format" option. Never silently stretch.
**Warning signs:** Users complaining about stretched logos or cropped faces.

### Pitfall 5: Canvas Export Resolution Mismatch
**What goes wrong:** Canvas displays at 600x600 for the UI but exports at 600x600 — not 1080x1080. Looks pixelated on retina/mobile.
**Why it happens:** `stage.toDataURL()` captures at display resolution by default.
**How to avoid:** Use Konva's `pixelRatio` option: `stage.toDataURL({ pixelRatio: 2 })` for 2x, or use server-side sharp with the layer data. Store all layer positions as percentage-of-template so they can be re-drawn at native resolution.
**Warning signs:** Exports look blurry; checkerboard artifacts on transparent PNGs.

### Pitfall 6: Video API Rate Limits and Cost Explosions
**What goes wrong:** User clicks "generate video" 10 times. Each costs $0.40. Bill arrives: $400 per power user.
**Why it happens:** No guardrails on generation volume.
**How to avoid:** Implement generation credits at the app level. Gate video generation behind plan tiers. Show cost estimate before generation. Cache/reuse generated clips where prompts haven't changed.
**Warning signs:** Stripe bill spiking; specific users generating dozens of clips.

### Pitfall 7: Runway/Luma Output URLs Expiring
**What goes wrong:** Generated video URLs from Runway have expiration (typically 24-48h). Stored URLs stop working.
**Why it happens:** APIs use pre-signed CDN URLs with TTL.
**How to avoid:** On generation completion, immediately download the video and re-store in Vercel Blob / Supabase Storage. Store your own permanent URL in DB, not the provider's.
**Warning signs:** Saved projects show broken video previews after 24 hours.

### Pitfall 8: CORS on Image Assets in Konva
**What goes wrong:** AI-generated images from OpenAI's CDN can't be drawn to Konva canvas due to CORS restrictions (canvas becomes "tainted").
**Why it happens:** Browser security model; `canvas.toDataURL()` fails on cross-origin images.
**How to avoid:** Proxy all generated images through your own domain or store in your Blob storage first. Set `crossOrigin = 'anonymous'` on Konva Image elements. Alternatively, convert to base64 server-side before sending to client.
**Warning signs:** "SecurityError: The canvas has been tainted" in browser console.

---

## Minimum Viable Creative Studio (What Actually Works)

Based on what competitors ship and what generates the most value, here is the strict MVP:

### MVP Scope (Phase 4 target)

**Must have (ship blockers):**
1. Template selector (3 formats: 1:1, 9:16, 16:9)
2. AI image generation (1 provider: gpt-image-1 or DALL-E 3)
3. Konva canvas editor with:
   - Drag/reposition generated image
   - Add/edit text layers (headline, body, CTA)
   - Simple shape overlay (CTA button background)
   - Export PNG at 1080px native resolution
4. Pre-populate prompt from Phase 1-2 scan data (business name, product, USP)
5. Store generated ads in project (Prisma + Vercel Blob)

**Nice to have (non-blocking):**
1. Multiple AI image providers (Ideogram as quality upgrade path)
2. Brand kit (save colors/fonts to project)
3. Format resize (generate once, adapt to all 3 formats)
4. Video storyboard builder (async job queue)
5. Template library (5-10 pre-built layouts per format)

**Out of scope for Phase 4:**
1. Real-time collaboration (Yjs)
2. Custom font upload
3. Video editing (Remotion timeline)
4. Direct platform API publishing (Meta API, TikTok API)
5. Stock library integration

### Minimum Viable Video Flow

Even without full video generation, you can ship meaningful video value:
1. User generates a static image ad
2. User writes a 3-scene storyboard (scene 1: hook, scene 2: proof, scene 3: CTA)
3. Each scene has: image (from AI or upload) + text overlay + duration (3-5s)
4. "Generate Video" sends scene 1's image + prompt to Runway Gen-3
5. Async polling shows progress
6. User downloads the 5-second clip

This is deliverable and valuable without building a full NLE.

---

## API Integration Details

### OpenAI gpt-image-1 / DALL-E 3

```typescript
// lib/creative/imageGenerators/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateAdImage({
  prompt,
  aspectRatio,
  quality = 'standard'
}: {
  prompt: string
  aspectRatio: '1:1' | '9:16' | '16:9'
  quality?: 'standard' | 'hd'
}) {
  const sizeMap = {
    '1:1': '1024x1024',
    '9:16': '1024x1792',
    '16:9': '1792x1024'
  } as const

  // gpt-image-1 (newer, better instruction following)
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: `Advertisement image: ${prompt}. Clean, professional, high-contrast. Designed for digital advertising.`,
    n: 1,
    size: sizeMap[aspectRatio],
  })

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt
  }
}
```

**Note:** gpt-image-1 requires an approved organization. DALL-E 3 is the fallback that any API key can use. Keep both adapters.

### Ideogram 2.0

```typescript
// lib/creative/imageGenerators/ideogram.ts
// Ideogram has no official npm package — use fetch

export async function generateIdeogramAd({
  prompt,
  aspectRatio,
  style = 'DESIGN'
}: {
  prompt: string
  aspectRatio: '1:1' | '9:16' | '16:9'
  style?: 'DESIGN' | 'REALISTIC' | 'ANIME'
}) {
  const ratioMap = {
    '1:1': 'ASPECT_1_1',
    '9:16': 'ASPECT_9_16',
    '16:9': 'ASPECT_16_9'
  }

  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.IDEOGRAM_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_request: {
        prompt,
        aspect_ratio: ratioMap[aspectRatio],
        model: 'V_2',
        style_type: style
      }
    })
  })

  const data = await response.json()
  return { url: data.data[0].url }
}
```

**Confidence:** MEDIUM — Ideogram's API shape as of mid-2025. Verify against their current docs before shipping.

### Runway Gen-3 Alpha Turbo

```typescript
// lib/creative/videoGenerators/runway.ts
// Runway SDK: @runwayml/sdk
import RunwayML from '@runwayml/sdk'

const runway = new RunwayML({ apiKey: process.env.RUNWAY_API_KEY })

export async function startVideoGeneration({
  imageUrl,
  prompt,
  duration = 5,
  aspectRatio = '9:16'
}: {
  imageUrl: string
  prompt: string
  duration?: 5 | 10
  aspectRatio?: '16:9' | '9:16' | '1:1'
}) {
  const ratioMap = { '16:9': '1280:720', '9:16': '720:1280', '1:1': '720:720' }

  const task = await runway.imageToVideo.create({
    model: 'gen3a_turbo',
    promptImage: imageUrl,
    promptText: prompt,
    duration,
    ratio: ratioMap[aspectRatio] as any,
    watermark: false
  })

  return { jobId: task.id }
}

export async function pollVideoStatus(jobId: string) {
  const task = await runway.tasks.retrieve(jobId)
  return {
    status: task.status,  // 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
    url: task.status === 'SUCCEEDED' ? task.output?.[0] : null,
    progress: task.progressRatio ?? 0
  }
}
```

**Confidence:** MEDIUM — Runway SDK shape based on training data. Verify `@runwayml/sdk` current API before shipping.

---

## AI Prompt Engineering for Ads

### Image Generation Prompt Formula

```
[Style] [Subject] [Action/State] [Context] [Mood/Lighting] [Ad-specific modifiers]

Good:
"Product photography style, [product name] on clean white surface, soft studio lighting,
 minimalist background, professional advertising quality, high detail, 8K resolution"

For lifestyle:
"Lifestyle photography, [target customer persona] using [product] in [setting],
 natural light, authentic moment, aspirational but achievable, advertising aesthetic"

For service businesses:
"Professional illustration, [business type] team helping customer, warm approachable colors,
 clean minimal design, vector-adjacent style, trustworthy brand feeling"
```

### Auto-Prompt Generation from Scan Data

The key competitive advantage: use Phase 1-2 scan data to auto-generate prompts. The user shouldn't need to write a prompt.

```typescript
// lib/creative/promptBuilder.ts
export function buildAdImagePrompt({
  businessName,
  productName,
  productDescription,
  targetAudience,
  tone,           // from Phase 2 rules
  primaryColor,   // from brand kit
  adGoal         // 'awareness' | 'conversion' | 'retargeting'
}: AdPromptContext): string {

  const goalStyleMap = {
    awareness: 'lifestyle photography, aspirational, wide shot',
    conversion: 'product photography, clean background, detail-focused',
    retargeting: 'close-up product detail, urgency-evoking, promotional'
  }

  const toneMap = {
    professional: 'clean minimal design, corporate aesthetic, trust-building colors',
    playful: 'bright colors, dynamic composition, energetic feel',
    luxury: 'dark moody lighting, premium materials, exclusive atmosphere'
  }

  return [
    goalStyleMap[adGoal],
    `featuring ${productName || businessName}`,
    productDescription ? `product: ${productDescription.slice(0, 100)}` : '',
    toneMap[tone] || 'professional advertising quality',
    primaryColor ? `primary color accent: ${primaryColor}` : '',
    'advertisement quality, no text, photorealistic, commercial photography'
  ].filter(Boolean).join(', ')
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manually designing all 12 ad sizes | AI resize + platform-aware templates | 2023-2024 | Design time: hours → minutes |
| Stock photo + text overlay | AI image generation from product brief | 2023 | Custom visuals at scale |
| Separate tools: design + video | Unified creative studio with AI backbone | 2024 | Workflow consolidation |
| Text-to-image only | Text-to-image + image-to-video pipeline | 2024 | Full static + motion |
| Generic canvas editor | Ad-format-aware canvas with zone enforcement | 2025 | Fewer platform rejections |
| Prompt engineering by user | Context-aware auto-prompt from business data | 2025 | No-code creative generation |

**Deprecated/outdated:**
- DALL-E 2: Replaced by DALL-E 3 and gpt-image-1. Quality gap is large. Do not use.
- Stable Diffusion 1.5: Superseded by SDXL and SD3. Only worth it for self-hosted cost optimization at scale.
- Fabric.js 4.x: Fabric.js 5+ and 6+ have significant improvements. Pinning to 4.x causes known React SSR issues.
- `canvas` npm package (server-side): Replaced by sharp for compositing; Skia/canvas for complex rendering. `canvas` has native build issues on Vercel.

---

## Build vs. Integrate Decision Matrix

| Capability | Build or Integrate | Rationale |
|------------|-------------------|-----------|
| Canvas editor (layers, text, transforms) | BUILD with Konva.js | UI is the differentiator; Konva handles the hard parts |
| Template system (zones, dimensions) | BUILD | Platform-specific knowledge is core IP |
| Prompt builder from scan data | BUILD | This is the unique value prop |
| Hook scoring / headline grading | BUILD | Rule-based, fast, differentiating |
| Image synthesis | INTEGRATE (OpenAI / Ideogram) | Quality ceiling too high to compete |
| Video synthesis | INTEGRATE (Runway / Luma) | Compute infrastructure not feasible |
| Background removal | INTEGRATE (remove.bg / Clipdrop) | ML segmentation is non-trivial |
| Asset storage (images, videos) | INTEGRATE (Vercel Blob) | Infrastructure commodity |
| Font library | INTEGRATE (Google Fonts via next/font) | Already solved, zero overhead |
| Color palette generation | BUILD (simple algo) or INTEGRATE | Palette generation is 50 lines of HSL math |
| Export to PDF / multi-format | BUILD via sharp server-side | Control needed for pixel-perfect output |
| Video editing timeline | DEFER (not Phase 4) | Complexity >> value for MVP |
| Platform publishing (Meta API) | DEFER (not Phase 4) | Requires OAuth per platform; Phase 5+ |

---

## Open Questions

1. **gpt-image-1 access status**
   - What we know: gpt-image-1 launched early 2025 with restricted access; DALL-E 3 is universally available
   - What's unclear: Whether gpt-image-1 is fully open as of March 2026
   - Recommendation: Build adapter for both; default to DALL-E 3; upgrade to gpt-image-1 if available

2. **Runway SDK package name / version**
   - What we know: `@runwayml/sdk` existed as of Aug 2025
   - What's unclear: Whether it's been updated for Gen-3 Alpha Turbo changes
   - Recommendation: Verify `npm view @runwayml/sdk version` before implementing video generation

3. **Vercel Blob vs Supabase Storage**
   - What we know: Project already has Supabase configured (though not active)
   - What's unclear: Whether Phase 4 should activate Supabase Storage for consistency with existing auth plans
   - Recommendation: Use Vercel Blob for Phase 4 simplicity; migrate to Supabase Storage when auth is live

4. **Konva.js compatibility with React 19.2.4**
   - What we know: react-konva 19.x targets React 19
   - What's unclear: Whether there are breaking changes between react-konva 18.x and 19.x
   - Recommendation: `npm view react-konva versions` and check peer dependency before installing

5. **Next.js 16.2.0 API route timeout configuration**
   - What we know: Next.js 15 changed how route handler timeouts work; 16.x may differ further
   - What's unclear: The exact config key for extending timeout on image generation routes
   - Recommendation: Read `node_modules/next/dist/docs/` per AGENTS.md before writing any route config

---

## Validation Architecture

### Test Framework Detection
No test framework detected in current package.json. Phase 4 should add:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

### Phase Requirements Test Map

| Req | Behavior | Test Type | Test Command |
|-----|---------|-----------|-------------|
| CREATIVE-01 | Template selector renders 3 formats | Unit | `vitest run src/components/creative/TemplateSelector.test.tsx` |
| CREATIVE-02 | Canvas renders Konva Stage without SSR error | Unit | `vitest run src/components/creative/CanvasEditor.test.tsx` |
| CREATIVE-03 | Image generation API route returns URL | Integration | `vitest run src/app/api/creative/generate-image.test.ts` |
| CREATIVE-04 | Canvas export produces PNG at correct resolution | Integration | `vitest run src/lib/creative/canvasExport.test.ts` |
| CREATIVE-05 | Prompt builder generates non-empty prompt from scan data | Unit | `vitest run src/lib/creative/promptBuilder.test.ts` |
| CREATIVE-06 | Video job polling returns status correctly | Unit | `vitest run src/lib/creative/videoGenerators.test.ts` |
| CREATIVE-07 | Ad saved to DB with correct projectId | E2E/Manual | Manual verify: create ad, check DB via Prisma Studio |

### Wave 0 Gaps
- [ ] `vitest.config.ts` — test framework config
- [ ] `src/components/creative/TemplateSelector.test.tsx` — CREATIVE-01
- [ ] `src/components/creative/CanvasEditor.test.tsx` — CREATIVE-02
- [ ] `src/lib/creative/promptBuilder.test.ts` — CREATIVE-05

---

## Sources

### Primary (HIGH confidence)
- OpenAI platform docs (platform.openai.com) — DALL-E 3 and gpt-image-1 API shape, pricing structure
- Konva.js official docs (konvajs.org) — Stage, Layer, Image, Text APIs
- react-konva GitHub (github.com/konvajs/react-konva) — React integration patterns
- Remotion docs (remotion.dev) — @remotion/player API
- Meta Business Help Center — Facebook/Instagram ad dimension specs
- TikTok for Business — TikTok ad format specs and safe zones

### Secondary (MEDIUM confidence — training data, not live-verified)
- Runway ML docs (dev.runwayml.com) — Gen-3 API structure, @runwayml/sdk
- Ideogram API docs (api.ideogram.ai) — v2 API request format
- Recraft.ai API docs — V3 model capabilities
- Luma AI docs (lumaai.com/api-docs) — Dream Machine API
- sharp.pixelplumbing.com — compositing and resize API
- Vercel Blob docs (vercel.com/docs/vercel-blob) — upload and store pattern

### Tertiary (LOW confidence — needs validation before implementation)
- Pricing figures for all AI APIs — volatile, change monthly; verify on provider dashboards
- gpt-image-1 access requirements — may have changed since Aug 2025
- Runway SDK package name and version — verify via npm before installing
- react-konva React 19 compatibility — verify peer deps before installing
- HeyGen and Synthesia API formats — used training data only

---

## Metadata

**Confidence breakdown:**
- Ad format dimensions: HIGH — platform-published specs
- Standard stack (Konva, Remotion, sharp): HIGH — stable, well-documented libraries
- AI API capabilities: MEDIUM — accurate as of Aug 2025 training cutoff; pricing and access tiers change frequently
- Video API details (Runway, Luma): MEDIUM — APIs existed and functional; exact SDK methods need verification
- Architecture patterns: HIGH — patterns are stable, not API-version-dependent
- Pitfalls: HIGH — based on known browser/canvas/CORS fundamentals
- Pricing figures: LOW — volatile; always verify on provider dashboards before quoting to users

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 for architecture/stack; 2026-04-01 for AI API pricing (monthly drift)

**Critical verification tasks before Phase 4 implementation begins:**
1. `npm view react-konva version` — confirm React 19 support
2. `npm view @runwayml/sdk version` — confirm Gen-3 API
3. Check OpenAI dashboard for gpt-image-1 availability on your account
4. Verify Ideogram API key at api.ideogram.ai — confirm v2 endpoint shape
5. Read `node_modules/next/dist/docs/` per AGENTS.md before writing any API routes
