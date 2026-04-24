// ---------------------------------------------------------------------------
// Himalaya Prompt Engine — pre-generates niche-specific, ready-to-fire prompts
// for every tool in the system. Zero thinking required from the user.
//
// Every prompt is built from the user's actual business data:
// - DecisionPacket (audience, pain, angle, strengths, weaknesses)
// - Foundation (offer, ICP, niche, business type)
// - AnalysisRun (title, score, mode)
//
// Usage: call buildPromptKit() once after deploy, store in the campaign/site.
// The UI surfaces these as one-click "Generate" buttons.
// ---------------------------------------------------------------------------

export type PromptKit = {
  // Ad image generation prompts (ready to fire into image gen API)
  imagePrompts: ImagePrompt[];
  // Ad video generation prompts (ready for Creatomate/Runway)
  videoPrompts: VideoPrompt[];
  // Ad copy prompts (ready for Claude/GPT)
  adCopyPrompts: AdCopyPrompt[];
  // Email copy prompts (for writing full email sequences)
  emailPrompts: EmailPrompt[];
  // Landing page copy prompts
  landingPrompts: LandingPrompt[];
  // Social media post prompts
  socialPrompts: SocialPrompt[];
  // Outreach/DM prompts
  outreachPrompts: OutreachPrompt[];
  // SEO metadata prompts
  seoPrompts: SeoPrompt[];
};

export type ImagePrompt = {
  id: string;
  label: string;
  platform: "Facebook" | "Instagram" | "TikTok" | "Google" | "Universal";
  size: "1024x1024" | "1792x1024" | "1024x1792";
  prompt: string;
  useCase: string; // "hero-product" | "problem-solution" | "social-proof" | "lifestyle" | "urgency" | "testimonial-bg"
};

export type VideoPrompt = {
  id: string;
  label: string;
  platform: "TikTok" | "Instagram Reels" | "Facebook" | "YouTube Shorts";
  duration: string;
  scenes: { text: string; duration: number }[];
  style: string;
};

export type AdCopyPrompt = {
  id: string;
  label: string;
  platform: "Facebook" | "Instagram" | "TikTok" | "Google Search" | "Google Display";
  format: "hook" | "script" | "carousel-caption" | "search-ad" | "story";
  prompt: string;
  previewText: string; // What the user sees before generating
};

export type EmailPrompt = {
  id: string;
  label: string;
  sequence: "welcome" | "nurture" | "sales" | "cart-recovery" | "post-purchase" | "re-engagement" | "referral";
  prompt: string;
  previewSubject: string;
};

export type LandingPrompt = {
  id: string;
  label: string;
  section: "hero" | "benefits" | "features" | "testimonials" | "faq" | "guarantee" | "urgency" | "full-page";
  prompt: string;
};

export type SocialPrompt = {
  id: string;
  label: string;
  platform: "Instagram" | "TikTok" | "Twitter/X" | "LinkedIn" | "Facebook";
  format: "post" | "caption" | "thread" | "story" | "carousel";
  prompt: string;
};

export type OutreachPrompt = {
  id: string;
  label: string;
  channel: "email" | "dm" | "linkedin" | "cold-call-script";
  prompt: string;
};

export type SeoPrompt = {
  id: string;
  label: string;
  type: "page-title" | "meta-description" | "blog-outline" | "keyword-strategy";
  prompt: string;
};

type BusinessContext = {
  title: string;
  niche: string;
  audience: string;
  painPoint: string;
  outcome: string;
  angle: string;
  strengths: string[];
  weaknesses: string[];
  offer?: string;
  pricing?: string;
  guarantee?: string;
  businessType?: string; // affiliate, agency, service, product, etc.
  mode: "operator" | "consultant";
};

/** Build the full prompt kit from business context */
export function buildPromptKit(ctx: BusinessContext): PromptKit {
  return {
    imagePrompts: buildImagePrompts(ctx),
    videoPrompts: buildVideoPrompts(ctx),
    adCopyPrompts: buildAdCopyPrompts(ctx),
    emailPrompts: buildEmailPrompts(ctx),
    landingPrompts: buildLandingPrompts(ctx),
    socialPrompts: buildSocialPrompts(ctx),
    outreachPrompts: buildOutreachPrompts(ctx),
    seoPrompts: buildSeoPrompts(ctx),
  };
}

/** Extract business context from analysis run + foundation */
export function extractBusinessContext(run: {
  title?: string | null;
  mode: string;
  decisionPacket?: Record<string, unknown> | null;
  rawSignals?: Record<string, unknown> | null;
}): BusinessContext {
  const packet = run.decisionPacket as Record<string, unknown> | null;
  const signals = run.rawSignals as Record<string, unknown> | null;
  const foundation = signals?.foundation as Record<string, unknown> | undefined;
  const offer = foundation?.offerDirection as Record<string, string> | undefined;
  const profile = foundation?.businessProfile as Record<string, string> | undefined;

  const painDesire = (packet?.painDesire as string) ?? "";
  const painParts = painDesire.split("→");

  return {
    title: run.title ?? "Business",
    niche: profile?.niche ?? (signals?.himalayaPayload as Record<string, string> | undefined)?.niche ?? "your niche",
    audience: (packet?.audience as string)?.split(",")[0]?.trim() ?? "your ideal customer",
    painPoint: painParts[0]?.replace(/escape from|pain:/gi, "").trim() ?? "their main problem",
    outcome: painParts[1]?.replace(/achieve/gi, "").trim() ?? "the result they want",
    angle: (packet?.angle as string)?.split("(")[0]?.trim() ?? "your unique approach",
    strengths: (packet?.strengths as string[]) ?? [],
    weaknesses: (packet?.weaknesses as string[]) ?? [],
    offer: offer?.coreOffer,
    pricing: offer?.pricing,
    guarantee: offer?.guarantee,
    businessType: profile?.businessType ?? (foundation?.path as string),
    mode: run.mode === "consultant" ? "consultant" : "operator",
  };
}

// ── Image Prompts ────────────────────────────────────────────────────────

function buildImagePrompts(ctx: BusinessContext): ImagePrompt[] {
  return [
    {
      id: "img-hero",
      label: "Hero Product Shot",
      platform: "Universal",
      size: "1024x1024",
      useCase: "hero-product",
      prompt: `Professional product advertisement photo for "${ctx.title}". Clean, modern, minimalist composition on a premium dark gradient background (#0c0a08 to #0a1628). Studio lighting with cyan (#f5a623) accent highlights. The product/service should be the clear hero of the image. No text overlays. Commercial photography quality.`,
    },
    {
      id: "img-problem-solution",
      label: `Problem → Solution Split (${ctx.painPoint} → ${ctx.outcome})`,
      platform: "Facebook",
      size: "1792x1024",
      useCase: "problem-solution",
      prompt: `Split-image direct response advertisement: Left side shows the frustration of "${ctx.painPoint}" — muted grey tones, stressed ${ctx.audience}. Right side shows the relief of achieving "${ctx.outcome}" — vibrant warm colors, confident happy person. Clean modern advertising style. No text. Professional quality suitable for Facebook ads.`,
    },
    {
      id: "img-lifestyle",
      label: `${ctx.audience} Lifestyle Shot`,
      platform: "Instagram",
      size: "1024x1024",
      useCase: "lifestyle",
      prompt: `Lifestyle photography: Happy, confident ${ctx.audience} person in their natural environment — at home, at work, or outdoors. They look satisfied and successful, representing someone who has achieved "${ctx.outcome}". Warm, inviting tones. Candid feel but professionally lit. No text. Aspirational but relatable. Instagram ad quality.`,
    },
    {
      id: "img-tiktok-thumb",
      label: "TikTok Video Thumbnail",
      platform: "TikTok",
      size: "1024x1792",
      useCase: "hero-product",
      prompt: `Bold, scroll-stopping thumbnail image for TikTok. Vertical format. Bright, high-contrast scene showing a dramatic "before and after" moment related to ${ctx.niche}. Expressive, authentic feeling — not overly polished. Eye-catching colors. No text. The kind of image that makes someone stop scrolling and want to watch the video.`,
    },
    {
      id: "img-social-proof",
      label: "Social Proof / Trust Graphic",
      platform: "Universal",
      size: "1024x1024",
      useCase: "social-proof",
      prompt: `Clean graphic design for a social proof advertisement. Premium dark background (#0c0a08) with subtle glowing elements. Five gold/yellow stars prominently displayed. Abstract shapes suggesting growth, success, and trust. Cyan (#f5a623) accent highlights. No text, no faces. Suitable as a background for overlaying customer testimonials or review quotes.`,
    },
    {
      id: "img-urgency",
      label: "Urgency / Limited Offer Graphic",
      platform: "Facebook",
      size: "1792x1024",
      useCase: "urgency",
      prompt: `Direct response advertisement background conveying urgency and exclusivity for ${ctx.niche}. Dark premium background with a dramatic single spotlight. Subtle elements suggesting limited time or availability — a clock motif, a closing door, or fading elements. Warm amber and cool cyan accent colors. No text. Professional, high-end feeling.`,
    },
    {
      id: "img-google-display",
      label: "Google Display Banner Background",
      platform: "Google",
      size: "1792x1024",
      useCase: "hero-product",
      prompt: `Clean, professional banner background for Google Display Network advertisement in ${ctx.niche}. Simple gradient from dark navy to slightly lighter blue. Subtle geometric patterns suggesting technology and innovation. Minimal, uncluttered composition leaving space for text overlay on the left third. Premium corporate feel. No text.`,
    },
    {
      id: "img-carousel-1",
      label: `Carousel Slide 1: The Problem (${ctx.painPoint})`,
      platform: "Instagram",
      size: "1024x1024",
      useCase: "problem-solution",
      prompt: `Instagram carousel first slide image representing the problem "${ctx.painPoint}" that ${ctx.audience} face. Show the frustration, struggle, or confusion visually — without being negative. Muted, slightly desaturated colors. One person, relatable and authentic. No text. The feeling should make the viewer think "that's exactly how I feel."`,
    },
    {
      id: "img-carousel-2",
      label: `Carousel Slide 2: The Solution (${ctx.angle})`,
      platform: "Instagram",
      size: "1024x1024",
      useCase: "problem-solution",
      prompt: `Instagram carousel solution slide representing "${ctx.angle}" for ${ctx.audience}. Show clarity, confidence, and momentum. Bright, warm colors — the opposite of the problem slide. Same person or similar, now empowered and in control. No text. The feeling should be "this is what's possible." Professional photography quality.`,
    },
  ];
}

// ── Video Prompts ────────────────────────────────────────────────────────

function buildVideoPrompts(ctx: BusinessContext): VideoPrompt[] {
  return [
    {
      id: "vid-tiktok-pov",
      label: `TikTok POV: "${ctx.outcome}" hack`,
      platform: "TikTok",
      duration: "15-25s",
      style: "ugc",
      scenes: [
        { text: `POV: You finally stopped struggling with ${ctx.painPoint}`, duration: 4 },
        { text: `${ctx.angle} actually works. Here's proof.`, duration: 8 },
        { text: `If you're ${ctx.audience}, you need this. Link in bio.`, duration: 6 },
      ],
    },
    {
      id: "vid-tiktok-secret",
      label: `TikTok: "Nobody tells ${ctx.audience} this..."`,
      platform: "TikTok",
      duration: "30-45s",
      style: "ugc",
      scenes: [
        { text: `Nobody tells you this, but if you're dealing with ${ctx.painPoint}...`, duration: 5 },
        { text: `Most people try the obvious solutions. That's why they fail.`, duration: 8 },
        { text: `The real answer is ${ctx.angle}. It works because ${ctx.strengths[0] ?? "it addresses the root cause"}.`, duration: 10 },
        { text: `Stop wasting time. Try this instead. Link below.`, duration: 5 },
      ],
    },
    {
      id: "vid-reel-transform",
      label: `Instagram Reel: ${ctx.painPoint} → ${ctx.outcome} transformation`,
      platform: "Instagram Reels",
      duration: "30-60s",
      style: "direct-response",
      scenes: [
        { text: `Month 4 of dealing with ${ctx.painPoint}... 😔`, duration: 5 },
        { text: `Then I found something different 💎`, duration: 4 },
        { text: `${ctx.outcome} — in less time than I expected`, duration: 10 },
        { text: `The secret? ${ctx.angle}. Results = real.`, duration: 6 },
        { text: `Best decision this year. Link in bio 🚀`, duration: 5 },
      ],
    },
    {
      id: "vid-fb-dr",
      label: `Facebook Direct Response: "${ctx.title}" USP`,
      platform: "Facebook",
      duration: "30-40s",
      style: "direct-response",
      scenes: [
        { text: `Finally, a real way to get ${ctx.outcome} without the ${ctx.painPoint}.`, duration: 5 },
        { text: `Built for ${ctx.audience}. Uses ${ctx.angle} to deliver results fast.`, duration: 12 },
        { text: `${ctx.strengths[0] ?? "Proven approach"}. ${ctx.strengths[1] ?? "Real results"}.`, duration: 8 },
        { text: `Click below to see why ${ctx.audience} are switching. Satisfaction guaranteed.`, duration: 7 },
      ],
    },
    {
      id: "vid-yt-short",
      label: `YouTube Short: "3 things about ${ctx.niche} nobody tells you"`,
      platform: "YouTube Shorts",
      duration: "45-60s",
      style: "ugc",
      scenes: [
        { text: `3 things about ${ctx.niche} that nobody tells you:`, duration: 4 },
        { text: `#1: ${ctx.weaknesses[0] ?? "The obvious approach doesn't work"} — and here's why.`, duration: 10 },
        { text: `#2: ${ctx.painPoint} is actually a symptom, not the problem.`, duration: 10 },
        { text: `#3: ${ctx.angle} fixes the root cause. That's why it works.`, duration: 10 },
        { text: `If this helped, follow for more. Link in description for ${ctx.outcome}.`, duration: 6 },
      ],
    },
  ];
}

// ── Ad Copy Prompts ─────────────────────────────────────────────────────

function buildAdCopyPrompts(ctx: BusinessContext): AdCopyPrompt[] {
  return [
    {
      id: "ad-fb-pain",
      label: "Facebook: Pain Point Hook",
      platform: "Facebook",
      format: "hook",
      previewText: `"Still dealing with ${ctx.painPoint}? There's a reason nothing's worked..."`,
      prompt: `Write a Facebook ad for ${ctx.audience} struggling with "${ctx.painPoint}". The product/service is "${ctx.title}" which uses ${ctx.angle} to help them achieve ${ctx.outcome}. Strengths: ${ctx.strengths.slice(0, 3).join(", ")}. Write in first person, conversational tone. Include: attention hook (first line must stop the scroll), 2-3 body sentences showing empathy and credibility, clear CTA. Keep under 125 words. ${ctx.guarantee ? `Mention guarantee: ${ctx.guarantee}` : ""} ${ctx.pricing ? `Price point: ${ctx.pricing}` : ""}`,
    },
    {
      id: "ad-fb-proof",
      label: "Facebook: Social Proof Hook",
      platform: "Facebook",
      format: "hook",
      previewText: `"${ctx.audience} are getting ${ctx.outcome} and here's what they're saying..."`,
      prompt: `Write a Facebook ad using social proof for ${ctx.title}. Target: ${ctx.audience}. Lead with a specific result or transformation story (make it believable and specific). Show that other ${ctx.audience} have overcome ${ctx.painPoint} using ${ctx.angle}. Include: a compelling opening stat or quote, brief explanation of why it works, urgency element, direct CTA. Under 125 words. Conversational, not salesy.`,
    },
    {
      id: "ad-ig-carousel",
      label: "Instagram: Carousel Captions (5 slides)",
      platform: "Instagram",
      format: "carousel-caption",
      previewText: "5 carousel slide captions that educate and sell",
      prompt: `Write 5 Instagram carousel slide captions for ${ctx.title} targeting ${ctx.audience}. Theme: How to overcome ${ctx.painPoint} and achieve ${ctx.outcome}. Slide 1: Bold hook question or statement. Slide 2: The real problem (not what they think). Slide 3: The ${ctx.angle} approach. Slide 4: Proof/results. Slide 5: CTA + what they get. Each caption: 1-2 sentences max. Use line breaks. End with a caption for the post description (include hashtags for ${ctx.niche}).`,
    },
    {
      id: "ad-tiktok-hook",
      label: "TikTok: Viral Hook Script",
      platform: "TikTok",
      format: "script",
      previewText: `"POV: You just discovered why ${ctx.painPoint} won't go away..."`,
      prompt: `Write a TikTok ad script (15-25 seconds) for ${ctx.title} targeting ${ctx.audience}. Style: authentic, fast-paced, native to TikTok. Open with a POV or "Nobody tells you this" hook about ${ctx.painPoint}. Middle: Quick reveal of ${ctx.angle} — show don't tell. Close: "Link in bio" CTA for ${ctx.outcome}. Include [VISUAL DIRECTION] notes for each section. Must feel like organic content, not an ad.`,
    },
    {
      id: "ad-tiktok-story",
      label: "TikTok: Story-Based Script (30-45s)",
      platform: "TikTok",
      format: "script",
      previewText: `"I was about to give up on ${ctx.painPoint}. Then I found..."`,
      prompt: `Write a TikTok story ad script (30-45 seconds) for ${ctx.title}. Target: ${ctx.audience}. Format: personal transformation narrative. Act 1 (0-8s): "I was dealing with ${ctx.painPoint} and tried everything..." Act 2 (8-25s): Discovery of ${ctx.angle}, initial skepticism, first results. Act 3 (25-45s): Full transformation to ${ctx.outcome}, recommendation. Include [VISUAL] and [AUDIO] notes. Must feel genuine, not scripted.`,
    },
    {
      id: "ad-google-search",
      label: "Google Search: 3 Ad Variations",
      platform: "Google Search",
      format: "search-ad",
      previewText: "3 search ad variations with headlines and descriptions",
      prompt: `Write 3 Google Search ad variations for "${ctx.title}" in ${ctx.niche}. Target keywords: "${ctx.niche}", "${ctx.painPoint} solution", "${ctx.outcome}". For each variation provide: Headline 1 (30 chars max), Headline 2 (30 chars max), Headline 3 (30 chars max), Description 1 (90 chars max), Description 2 (90 chars max). Each variation should use a different angle: Variation 1: Problem-focused, Variation 2: Solution-focused, Variation 3: Social proof/urgency. ${ctx.pricing ? `Include price point: ${ctx.pricing}` : ""}`,
    },
    {
      id: "ad-google-display",
      label: "Google Display: Banner Copy Set",
      platform: "Google Display",
      format: "hook",
      previewText: "Headlines and descriptions for responsive display ads",
      prompt: `Write Google Display ad copy for "${ctx.title}" targeting ${ctx.audience}. Provide: 5 short headlines (25 chars each), 5 long headlines (90 chars each), 5 descriptions (90 chars each). Cover these angles: pain relief from ${ctx.painPoint}, achieving ${ctx.outcome}, social proof, urgency/scarcity, value proposition of ${ctx.angle}. Keep language direct and benefit-focused.`,
    },
  ];
}

// ── Email Prompts ───────────────────────────────────────────────────────

function buildEmailPrompts(ctx: BusinessContext): EmailPrompt[] {
  const isConsultant = ctx.mode === "consultant";
  return [
    {
      id: "email-welcome-1",
      label: isConsultant ? "Welcome: Audit Delivery" : "Welcome: Post-Purchase",
      sequence: "welcome",
      previewSubject: isConsultant ? "Your audit is ready — one thing first" : "You made the right call — here's what's next",
      prompt: `Write a welcome email for ${ctx.title}. Audience: ${ctx.audience} who just ${isConsultant ? "requested a free audit" : "purchased/signed up"}. Tone: personal, direct, no fluff. Include: acknowledgment of their decision, set expectations for what comes next (3 specific things), one key insight about ${ctx.painPoint} that shows expertise, sign-off that invites reply. Length: 200-300 words. Format as plain text (not HTML marketing email).`,
    },
    {
      id: "email-nurture-teach",
      label: "Nurture: Teach Something Proprietary",
      sequence: "nurture",
      previewSubject: `The metric that predicts ${ctx.outcome} (most ${ctx.audience} ignore it)`,
      prompt: `Write a nurture email for ${ctx.title} targeting ${ctx.audience}. Purpose: teach one proprietary insight about ${ctx.niche} that builds authority. Structure: challenge a common belief about ${ctx.painPoint}, reveal a non-obvious metric or approach (${ctx.angle}), connect it to ${ctx.outcome}, tease tomorrow's email with a case study. No selling. Pure value. Length: 250-350 words.`,
    },
    {
      id: "email-nurture-proof",
      label: "Nurture: Case Study / Proof",
      sequence: "nurture",
      previewSubject: `Case study: $0 spent — ${ctx.outcome} achieved`,
      prompt: `Write a case study email for ${ctx.title}. Audience: ${ctx.audience}. Format: tell the story of a specific client/customer who had ${ctx.painPoint}, discovered ${ctx.angle}, and achieved ${ctx.outcome}. Include specific numbers (timeframe, percentage improvement, before/after). Make it feel real (name, location, specific details). End with soft CTA: "Your business has the same gaps. Reply 'call' to walk through them together." Length: 300-400 words.`,
    },
    {
      id: "email-sales-close",
      label: "Sales: Binary Close",
      sequence: "sales",
      previewSubject: "One question before I close this out",
      prompt: `Write a closing/decision email for ${ctx.title}. Audience: ${ctx.audience} who have been in the nurture sequence for 5-7 days. Structure: acknowledge they've been thinking, present two clear options (Option A: do it yourself with the info provided, Option B: work together for faster results), include real scarcity (calendar spots, pricing window), no fake urgency. ${ctx.guarantee ? `Mention guarantee: ${ctx.guarantee}` : ""} ${ctx.pricing ? `Price: ${ctx.pricing}` : ""} Sign-off: "This is my last email in this sequence." Length: 200-250 words.`,
    },
    {
      id: "email-cart-recovery",
      label: "Cart Recovery: Assume Technical Issue",
      sequence: "cart-recovery",
      previewSubject: "Did something go wrong?",
      prompt: `Write an abandoned cart email for ${ctx.title}. Audience: ${ctx.audience} who left before completing purchase. Tone: helpful, not pushy. Lead with "we assume something went wrong" (not "you forgot"). Show the product/offer they left behind. Include: ${ctx.guarantee ? `mention guarantee: ${ctx.guarantee}` : "mention money-back guarantee"}, one social proof line, clear "Complete My Order" CTA. Length: 150-200 words.`,
    },
    {
      id: "email-post-purchase",
      label: "Post-Purchase: Onboarding + Usage",
      sequence: "post-purchase",
      previewSubject: "Your order is in — do this first",
      prompt: `Write a post-purchase onboarding email for ${ctx.title}. Audience: ${ctx.audience} who just bought. Include: order confirmation feel, the ONE most important thing to do first (specific, actionable), what to expect in the first 7 days, common mistake to avoid, invitation to reply with questions. Warm, personal tone. Not a transactional template. Length: 200-300 words.`,
    },
    {
      id: "email-reengagement",
      label: "Re-engagement: Win-Back",
      sequence: "re-engagement",
      previewSubject: `I noticed you went quiet — everything okay?`,
      prompt: `Write a re-engagement email for ${ctx.title}. Audience: ${ctx.audience} who haven't opened emails in 30+ days. Tone: genuine concern, not guilt. Structure: "Hey, I noticed you haven't been opening these — I want to make sure they're useful." Offer: one-click preferences update, or reply to tell me what you need. Include a new value hook about ${ctx.niche} to re-interest them. End with: "If you'd rather not hear from me, no hard feelings." Length: 150-200 words.`,
    },
    {
      id: "email-referral",
      label: "Referral: Turn Customers into Promoters",
      sequence: "referral",
      previewSubject: `Know someone dealing with ${ctx.painPoint}? Share this.`,
      prompt: `Write a referral request email for ${ctx.title}. Audience: satisfied ${ctx.audience} customers. Structure: acknowledge their success ("You've been with us for X weeks and I hope you're seeing ${ctx.outcome}"), explain the referral offer (what they and their friend get), make it easy (one link to share), add social proof ("X people have already shared this"). Keep it brief and non-pushy. Length: 150-200 words.`,
    },
  ];
}

// ── Landing Page Prompts ────────────────────────────────────────────────

function buildLandingPrompts(ctx: BusinessContext): LandingPrompt[] {
  return [
    {
      id: "lp-hero",
      label: "Hero Section Copy",
      section: "hero",
      prompt: `Write a hero section for a landing page selling "${ctx.title}" to ${ctx.audience}. Headline formula: [Specific outcome] + [timeframe or proof element] + [without the common pain]. Subheadline: confirm who this is for and bridge to the CTA. CTA button text: first-person format ("Get My [Result]"). ${ctx.pricing ? `Price: ${ctx.pricing}` : ""} ${ctx.guarantee ? `Guarantee: ${ctx.guarantee}` : ""}`,
    },
    {
      id: "lp-benefits",
      label: "Benefits Section (6 bullets)",
      section: "benefits",
      prompt: `Write 6 benefit bullets for "${ctx.title}" landing page. Audience: ${ctx.audience}. Format each as: "[Checkmark] [What they get] — [why it matters to them specifically]". Focus on outcomes, not features. Reference: overcoming ${ctx.painPoint}, achieving ${ctx.outcome}, leveraging ${ctx.angle}. Each bullet under 20 words.`,
    },
    {
      id: "lp-faq",
      label: "FAQ Section (5 objection-handling questions)",
      section: "faq",
      prompt: `Write 5 FAQ entries for "${ctx.title}" landing page. Audience: ${ctx.audience}. Each FAQ should handle a real buying objection: Q1: "Does this work for my specific situation?" Q2: "How long until I see results?" Q3: "What if it doesn't work?" Q4: Price/value objection Q5: "How is this different from X?" Answers: 2-3 sentences each. Direct, honest, proof-based. ${ctx.guarantee ? `Reference guarantee: ${ctx.guarantee}` : ""}`,
    },
    {
      id: "lp-full",
      label: "Full Landing Page Copy (all sections)",
      section: "full-page",
      prompt: `Write complete landing page copy for "${ctx.title}" targeting ${ctx.audience}. Sections needed: 1) Hero (headline + subheadline + CTA), 2) Trust bar (4 credibility elements), 3) Problem section (name the pain: ${ctx.painPoint}), 4) Solution section (introduce ${ctx.angle}), 5) Benefits (6 bullets), 6) Social proof (3 testimonial frameworks), 7) How it works (3 steps), 8) Guarantee (${ctx.guarantee ?? "risk reversal"}), 9) FAQ (5 questions), 10) Final CTA with urgency. ${ctx.pricing ? `Price: ${ctx.pricing}` : ""} Tone: confident, direct, proof-based. No fluff.`,
    },
  ];
}

// ── Social Media Prompts ────────────────────────────────────────────────

function buildSocialPrompts(ctx: BusinessContext): SocialPrompt[] {
  return [
    {
      id: "social-ig-post",
      label: `Instagram Post: ${ctx.niche} insight`,
      platform: "Instagram",
      format: "post",
      prompt: `Write an Instagram post for ${ctx.title} account in ${ctx.niche}. Share one actionable insight about overcoming ${ctx.painPoint}. Format: bold opening line, 3-5 short paragraphs, CTA to comment or DM. Include 15-20 relevant hashtags. Tone: authoritative but approachable.`,
    },
    {
      id: "social-tiktok-caption",
      label: "TikTok Video Caption",
      platform: "TikTok",
      format: "caption",
      prompt: `Write 5 TikTok video caption variations for ${ctx.title} content about ${ctx.niche}. Each caption should: hook viewers in first 5 words, create curiosity about ${ctx.outcome}, include a CTA (link in bio, follow for more, save this). Use native TikTok language. Include 3-5 hashtags each. Under 150 characters each.`,
    },
    {
      id: "social-x-thread",
      label: `Twitter/X Thread: How ${ctx.audience} can achieve ${ctx.outcome}`,
      platform: "Twitter/X",
      format: "thread",
      prompt: `Write a Twitter/X thread (8-10 tweets) for ${ctx.title} about how ${ctx.audience} can achieve ${ctx.outcome}. Tweet 1: Bold hook claim. Tweets 2-7: Step-by-step breakdown using ${ctx.angle}. Tweet 8: Summary + CTA. Each tweet under 280 chars. Include relevant emojis sparingly.`,
    },
    {
      id: "social-linkedin",
      label: `LinkedIn Post: Authority in ${ctx.niche}`,
      platform: "LinkedIn",
      format: "post",
      prompt: `Write a LinkedIn post for ${ctx.title} establishing authority in ${ctx.niche}. Structure: contrarian opening ("Most people think X about ${ctx.niche}. They're wrong."), share a specific insight about ${ctx.painPoint}, provide actionable framework, end with a question to drive comments. Professional but not stiff. 200-300 words.`,
    },
  ];
}

// ── Outreach Prompts ────────────────────────────────────────────────────

function buildOutreachPrompts(ctx: BusinessContext): OutreachPrompt[] {
  if (ctx.mode !== "consultant") return [];
  return [
    {
      id: "outreach-cold-email",
      label: "Cold Email: Audit Offer",
      channel: "email",
      prompt: `Write a cold email from a ${ctx.niche} consultant to a potential client (${ctx.audience}). Offer: free audit of their ${ctx.weaknesses[0] ?? "biggest gap"}. Structure: 1) Name their specific problem (${ctx.painPoint}), 2) Show you understand their world (one specific detail), 3) Offer the audit with zero commitment, 4) One-line CTA (reply "audit" or book a call). Under 100 words. No attachments, no links in first email. Subject line under 40 chars.`,
    },
    {
      id: "outreach-dm",
      label: "Instagram/LinkedIn DM: Value-First",
      channel: "dm",
      prompt: `Write a cold DM for ${ctx.title} targeting ${ctx.audience}. Format: 3 sentences max. Open with specific compliment about their business/content. Offer one free insight about ${ctx.weaknesses[0] ?? ctx.painPoint}. Close with "Want me to show you?" No links. No pitch. Pure value-first.`,
    },
    {
      id: "outreach-followup",
      label: "Follow-Up Email (3 variations)",
      channel: "email",
      prompt: `Write 3 follow-up email variations for ${ctx.title} consultant. Audience: ${ctx.audience} who didn't respond to initial cold email. Follow-up 1 (3 days later): Add new value — share a relevant insight about ${ctx.niche}. Follow-up 2 (7 days later): Social proof — "Just helped another ${ctx.audience} fix ${ctx.weaknesses[0] ?? "a similar gap"}". Follow-up 3 (14 days later): Breakup email — "Closing your file, but wanted to leave the door open." Each under 75 words.`,
    },
  ];
}

// ── SEO Prompts ─────────────────────────────────────────────────────────

function buildSeoPrompts(ctx: BusinessContext): SeoPrompt[] {
  return [
    {
      id: "seo-page-title",
      label: "SEO Page Title (5 variations)",
      type: "page-title",
      prompt: `Write 5 SEO page title variations for "${ctx.title}" landing page. Target keyword: "${ctx.niche} ${ctx.outcome}". Each title: under 60 characters, includes primary keyword, has a compelling reason to click. Format: [Keyword Phrase] | [Benefit] | [Brand].`,
    },
    {
      id: "seo-meta-desc",
      label: "Meta Description (3 variations)",
      type: "meta-description",
      prompt: `Write 3 meta description variations for "${ctx.title}" targeting ${ctx.audience}. Each: under 155 characters, includes "${ctx.niche}" keyword naturally, has a clear CTA or value prop, addresses ${ctx.painPoint}. Make searchers want to click.`,
    },
    {
      id: "seo-blog-outline",
      label: `Blog Post: "How to ${ctx.outcome}"`,
      type: "blog-outline",
      prompt: `Write a blog post outline for "${ctx.title}" blog targeting ${ctx.audience}. Title: "How to [Achieve ${ctx.outcome}]: The Complete Guide for ${ctx.audience}". Include: H1, 8-10 H2 sections, 2-3 H3s per section, target keywords for each section, estimated word count per section. Focus on: solving ${ctx.painPoint} using ${ctx.angle}. Total target: 2500-3000 words.`,
    },
  ];
}
