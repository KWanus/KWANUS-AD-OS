import type { DecisionPacket } from "./buildDecisionPacket";
import type { AnalysisMode } from "./normalizeInput";

export type AdScene = {
    timestamp: string;
    shotType: string;
    visual: string;
    audio: string;
    textOverlay: string;
};

export type AdBrief = {
    id: string;
    format: string;
    title: string;
    duration: string;
    platform: "TikTok" | "Facebook" | "Instagram" | "Cinematic" | "Static";
    concept: string;
    scenes: AdScene[];
    productionKit: {
        location: string;
        props: string[];
        casting: string;
        lighting: string;
        audioStyle: string;
        colorGrade: string;
    };
    imageAd?: {
        headline: string;
        visualDirection: string;
        bodyCopy: string;
        cta: string;
    };
};

function clean(text: string): string {
    return text.replace(/undefined|null/gi, "").trim();
}

function extractPain(packet: DecisionPacket): string {
    const pain = packet.painDesire;
    if (pain.includes("→")) return pain.split("→")[0].replace(/escape from|pain:/gi, "").trim();
    return pain.split(".")[0].trim();
}

function extractOutcome(packet: DecisionPacket): string {
    const pain = packet.painDesire;
    if (pain.includes("→")) return pain.split("→")[1].replace(/achieve/gi, "").trim();
    return "the result you want";
}

export function generateAdBriefs(
    packet: DecisionPacket,
    mode: AnalysisMode
): AdBrief[] {
    const pain = clean(extractPain(packet));
    const outcome = clean(extractOutcome(packet));
    const audience = clean(packet.audience.split(",")[0]);
    const angle = clean(packet.angle.split("(")[0].trim());
    const strengths = packet.strengths.slice(0, 3);

    const briefs: AdBrief[] = [
        // ─── 1. TikTok POV (15-30s) ───
        {
            id: "tiktok-pov",
            format: "TikTok POV / Product in Action",
            title: `The ${outcome} Hack`,
            duration: "15-25 seconds",
            platform: "TikTok",
            concept: `Showing a relatable POV of using the product to escape ${pain}. Rapid cuts, native text, trending audio style.`,
            scenes: [
                {
                    timestamp: "0-3s",
                    shotType: "Extreme Close-up / POV",
                    visual: `Person's hands holding phone or product. Quick zoom into the "pain point" action.`,
                    audio: `"POV: You finally stopped struggling with ${pain}." (Native TTS)`,
                    textOverlay: `POV: You found the fix for ${pain} 🛡️`,
                },
                {
                    timestamp: "3-12s",
                    shotType: "Rapid Cuts (0.5s each)",
                    visual: `Product being used in real environments. Messy desk to clean desk, or sad face to happy face.`,
                    audio: `Fast-paced trending beat with "match cuts" on every beat.`,
                    textOverlay: `It actually works.`,
                },
                {
                    timestamp: "12-20s",
                    shotType: "Medium Shot / Selfie",
                    visual: `Creator looking directly into camera, nodding, showing the product.`,
                    audio: `"I'm not even kidding. If you're ${audience}, you need this."`,
                    textOverlay: `Link in bio 🔗`,
                },
            ],
            productionKit: {
                location: "Home / Natural environment",
                props: ["Product", "Smartphone"],
                casting: "Authentic creator (not a model)",
                lighting: "Natural window light",
                audioStyle: "Lo-fi / Trending TikTok sound",
                colorGrade: "iPhone Standard / Clean",
            },
        },

        // ─── 2. TikTok "Nobody tells you..." (30-45s) ───
        {
            id: "tiktok-secrets",
            format: "TikTok 'Nobody Tells You'",
            title: `The ${outcome} Secret`,
            duration: "30-45 seconds",
            platform: "TikTok",
            concept: `Pattern interrupt leading with a "secret" or "confession" about ${pain}. Direct to camera, high retention.`,
            scenes: [
                {
                    timestamp: "0-5s",
                    shotType: "Selfie / Talking Head",
                    visual: `Creator whispered tone, leaning in close to the lens.`,
                    audio: `"Nobody tells you this, but if you have ${pain}, you're probably doing it all wrong."`,
                    textOverlay: `DON'T SKIP THIS ❌`,
                },
                {
                    timestamp: "5-25s",
                    shotType: "Green Screen / B-Roll",
                    visual: `Creator uses 'Green Screen' effect over the product website or results. Points at features.`,
                    audio: `"Most people try X, but that's why they fail. The real secret is ${angle}. It works because it addresses ${strengths[0]} directly."`,
                    textOverlay: `The ${angle} Loop`,
                },
                {
                    timestamp: "25-45s",
                    shotType: "Medium Shot",
                    visual: `Creator showing the checkout or the results on their own device.`,
                    audio: `"Stop wasting time. Try this instead. Link's below."`,
                    textOverlay: `Get ${outcome} here 👇`,
                },
            ],
            productionKit: {
                location: "Casual Room / Office",
                props: ["Phone showing results"],
                casting: "Personable, high-energy speaker",
                lighting: "Bright, punchy colors",
                audioStyle: "Clear VO over subtle suspenseful synth",
                colorGrade: "Vibrant / Contrast",
            },
        },

        // ─── 3. TikTok Transformation (45-60s) ───
        {
            id: "tiktok-transform",
            format: "TikTok Transformation / Story",
            title: `Goodbye ${pain}`,
            duration: "45-60 seconds",
            platform: "TikTok",
            concept: `Emotional arc from frustrated with ${pain} to relieved with ${outcome}. Narrative-driven.`,
            scenes: [
                {
                    timestamp: "0-8s",
                    shotType: "Wide Shot",
                    visual: `Person looking frustrated, staring at the problem. Hand on head. Black and white filter.`,
                    audio: `Slow, muffled sound. "I was about to give up on ${pain}."`,
                    textOverlay: `Month 4 of ${pain}...`,
                },
                {
                    timestamp: "8-15s",
                    shotType: "Close-up",
                    visual: `Flash of the product. Color returns to the shot.`,
                    audio: `Audio "sweeps" up. Uplifting music kicks in.`,
                    textOverlay: `Then I found this 💎`,
                },
                {
                    timestamp: "15-45s",
                    shotType: "Montage",
                    visual: `Fast cuts of product usage, happy reactions, and real results ${outcome}.`,
                    audio: `"Within a week, I saw the difference. ${strengths[1] || "The change was real"}. No more stress."`,
                    textOverlay: `Results = ${outcome}`,
                },
                {
                    timestamp: "45-60s",
                    shotType: "Selfie / Outro",
                    visual: `Creator smiling, holding product.`,
                    audio: `"Best decision I made this year. Link in bio to join the ${audience} using this."`,
                    textOverlay: `Link in bio 🚀`,
                },
            ],
            productionKit: {
                location: "Frustrating zone -> Happy zone",
                props: ["Product"],
                casting: "Relatable 'Before' look",
                lighting: "Moody (before) -> Bright (after)",
                audioStyle: "Emotional transition",
                colorGrade: "B&W to Warm/Vibrant",
            },
        },

        // ─── 4. Facebook/IG Direct Response (30-45s) ───
        {
            id: "fb-dr",
            format: "FB Direct Response / USP Focus",
            title: `The ${outcome} Solution`,
            duration: "30-40 seconds",
            platform: "Facebook",
            concept: `Clear, rational, and high-contrast. Leading with the primary benefit and features.`,
            scenes: [
                {
                    timestamp: "0-5s",
                    shotType: "Graphic / High Contrast",
                    visual: `Bold text on screen. Bright background. Product image center.`,
                    audio: `Punchy beat. "Finally, a real way to get ${outcome} without the ${pain}."`,
                    textOverlay: `STOP THE ${pain.toUpperCase()}`,
                },
                {
                    timestamp: "5-25s",
                    shotType: "Split Screen",
                    visual: `Left: The old way (frustrating). Right: The ${outcome} way (clean/fast).`,
                    audio: `"Engineered for ${audience}, it uses ${angle} to deliver results in record time."`,
                    textOverlay: `Why it works 🚀`,
                },
                {
                    timestamp: "25-40s",
                    shotType: "Call to Action Screen",
                    visual: `Large button graphic. List of 3 benefits.`,
                    audio: `"Click the link below to see why ${audience} are switching. Satisfaction guaranteed."`,
                    textOverlay: `Claim Yours Now`,
                },
            ],
            productionKit: {
                location: "Studio / Studio-quality home",
                props: ["Product", "Graphic overlays"],
                casting: "Professional spokesperson",
                lighting: "Bright, consistent studio lighting",
                audioStyle: "High energy, clear voiceover",
                colorGrade: "Commercial / Blue-Cyan tones",
            },
        },

        // ─── 5. Facebook/IG UGC Testimonial (20-30s) ───
        {
            id: "fb-ugc",
            format: "FB UGC Testimonial / Social Proof",
            title: `Real Talk about ${outcome}`,
            duration: "20-30 seconds",
            platform: "Instagram",
            concept: `Authentic user review. High trust, low friction. Feels like a friend recommending a product.`,
            scenes: [
                {
                    timestamp: "0-5s",
                    shotType: "Close-up / Selfie",
                    visual: `Creator speaking to camera in a car or kitchen. Unpolished.`,
                    audio: `"Okay, so I tried that ${outcome} thing everyone's talking about..."`,
                    textOverlay: `Honestly? 🤭`,
                },
                {
                    timestamp: "5-20s",
                    shotType: "Close-up on product",
                    visual: `Showing the product details while talking. Demoing a specific feature.`,
                    audio: `"I was skeptical at first because of ${pain}. But look at this — it actually solved it. ${strengths[0]} is a game changer."`,
                    textOverlay: `Proof is in the results`,
                },
                {
                    timestamp: "20-30s",
                    shotType: "Selfie / Outro",
                    visual: `Creator nodding. "Yeah, I'm hooked. Swipe up if you're dealing with ${pain}."`,
                    audio: `Swipe up sound.`,
                    textOverlay: `Swipe Up to See More`,
                },
            ],
            productionKit: {
                location: "Car / Home / Outdoor",
                props: ["Product"],
                casting: "Very relatable user type",
                lighting: "Natural / Practical",
                audioStyle: "Organic room sound (no music)",
                colorGrade: "Raw / Unfiltered",
            },
        },

        // ─── 6. Cinematic Brand Spot (60s) ───
        {
            id: "cinematic-brand",
            format: "Cinematic Brand Story / Super Bowl Style",
            title: `The Rise of ${outcome}`,
            duration: "60 seconds",
            platform: "Cinematic",
            concept: `High production value, emotional arc, cinematic lighting. Positioning the product as a heroic solution.`,
            scenes: [
                {
                    timestamp: "0-15s",
                    shotType: "Wide / Atmospheric",
                    visual: `Stunning landscape or urban shot. Slow pan. Shadowy lighting.`,
                    audio: `Deep, resonant cello. "The world is full of ${pain}." (Cinematic VO)`,
                    textOverlay: ``,
                },
                {
                    timestamp: "15-30s",
                    shotType: "Slow Motion / Macro",
                    visual: `Close-up of human struggle — an eye opening, a hand reaching out. Tension building.`,
                    audio: `Music swells with low-frequency pulses. "But what if there was another way?"`,
                    textOverlay: ``,
                },
                {
                    timestamp: "30-50s",
                    shotType: "Epic Reveal",
                    visual: `The product revealed in dramatic top-down lighting. Flashes of ${outcome} in use by diverse groups.`,
                    audio: `Modern, driving orchestral beat. "Introducing the new standard. Built for those who demand ${outcome}."`,
                    textOverlay: `RE-ENGINEERED`,
                },
                {
                    timestamp: "50-60s",
                    shotType: "Hero Shot / Logo",
                    visual: `Product silhouette. Logo fade-in.`,
                    audio: `"Welcome to the future of ${outcome}. [Brand Name]."`,
                    textOverlay: ``,
                },
            ],
            productionKit: {
                location: "Studio / Epic Landscapes",
                props: ["Hero Product", "High-end tech"],
                casting: "Cinematic quality actors",
                lighting: "High dynamic range / Shadows",
                audioStyle: "Orchestral Hybrid / Sound Design",
                colorGrade: "Film Noir / Deep Contrast",
            },
        },

        // ─── 7. Static Image Ad ───
        {
            id: "static-image",
            format: "Static Image Ad / Pattern Interrupt",
            title: `${outcome} Visual`,
            duration: "0 seconds (Static)",
            platform: "Static",
            concept: `High contrast static image designed to stop the scroll in 0.5s.`,
            scenes: [], // No scenes for static but include image data
            productionKit: {
                location: "Studio",
                props: ["Product"],
                casting: "N/A",
                lighting: "Bright / No-shadow",
                audioStyle: "N/A",
                colorGrade: "High saturation",
            },
            imageAd: {
                headline: `Hate ${pain}? Try this instead.`,
                visualDirection: `High-contrast product shot on a vibrant background (e.g. Electric Blue). Hand holding product for scale. Text bubble with "Social Proof" (e.g., 4.9/5 stars).`,
                bodyCopy: `Stop settling for ${pain}. ${audience} are switching to ${angle} to get better results. Join 50k+ others who achieved ${outcome} this month.`,
                cta: `Get Started Today →`,
            },
        },
    ];

    return briefs;
}
