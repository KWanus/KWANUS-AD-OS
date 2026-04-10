// ---------------------------------------------------------------------------
// Dynamic Site Personalization Engine
// Every visitor sees a DIFFERENT page based on who they are.
// Not A/B testing (50/50). Actual 1-to-1 personalization.
//
// Data sources: UTM params, referrer, intent signals, return visit,
// device type, time of day, geographic location
//
// What changes: headline, subheadline, CTA text, testimonials shown,
// urgency messaging, social proof numbers, pricing display
// ---------------------------------------------------------------------------

export type VisitorContext = {
  // Traffic source
  utmSource?: string;      // facebook, google, tiktok, email, organic
  utmMedium?: string;      // cpc, social, email
  utmCampaign?: string;
  utmContent?: string;     // Which ad variation
  referrer?: string;

  // Behavior
  isReturnVisitor: boolean;
  visitCount: number;
  lastVisitPage?: string;
  intentScore: number;
  intentStage: string;

  // Device/geo
  isMobile: boolean;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek: string;
};

export type PersonalizedContent = {
  headline: string;
  subheadline: string;
  ctaText: string;
  urgencyBar?: string;
  socialProofText?: string;
  testimonialIndex: number;    // Which testimonial to show first
  showPricing: boolean;
  showGuarantee: boolean;
  popupDelay?: number;         // Seconds before showing popup (0 = none)
  popupMessage?: string;
};

/** Generate personalized content based on visitor context */
export function personalizePage(
  context: VisitorContext,
  defaults: { headline: string; subheadline: string; ctaText: string; niche: string; painPoint: string; outcome: string }
): PersonalizedContent {
  const { headline, subheadline, ctaText, niche, painPoint, outcome } = defaults;

  let personalizedHeadline = headline;
  let personalizedSub = subheadline;
  let personalizedCTA = ctaText;
  let urgencyBar: string | undefined;
  let socialProofText: string | undefined;
  let testimonialIndex = 0;
  let showPricing = true;
  let showGuarantee = true;
  let popupDelay: number | undefined;
  let popupMessage: string | undefined;

  // ── Source-based personalization ──
  if (context.utmSource === "facebook" || context.utmSource === "instagram") {
    // Social traffic: casual, visual-first
    personalizedCTA = `Yes, I Want ${outcome}`;
    socialProofText = `Join thousands of ${niche} enthusiasts who already started`;
  } else if (context.utmSource === "google") {
    // Search traffic: high intent, solution-focused
    personalizedHeadline = `The ${niche} Solution You've Been Searching For`;
    personalizedSub = `${outcome} — backed by real results and a money-back guarantee.`;
    showGuarantee = true;
  } else if (context.utmSource === "tiktok") {
    // TikTok: trend-aware, FOMO
    urgencyBar = `Trending now — ${Math.floor(Math.random() * 50 + 20)} people viewing this right now`;
    personalizedCTA = "Get It Before It's Gone";
  } else if (context.utmSource === "email") {
    // Email: they know you, warmer
    personalizedHeadline = `Welcome Back — Ready to Get ${outcome}?`;
    personalizedSub = "You've been thinking about this. Here's why now is the time.";
    showPricing = true;
  }

  // ── Behavior-based personalization ──
  if (context.isReturnVisitor) {
    if (context.visitCount >= 3) {
      // Multiple returns = high intent but hesitating
      urgencyBar = "You've visited 3 times. This offer won't last forever.";
      personalizedCTA = "Stop Thinking, Start Doing";
      showGuarantee = true;
      popupDelay = 5;
      popupMessage = "Still deciding? Here's a special offer just for you.";
    } else {
      personalizedHeadline = `Welcome Back — ${outcome} Is Closer Than You Think`;
      testimonialIndex = 1; // Show different testimonial than first visit
    }
  }

  // ── Intent-based personalization ──
  if (context.intentScore >= 80) {
    // Ready to buy — remove friction, add urgency
    urgencyBar = "Limited availability — don't miss out";
    personalizedCTA = "Get Started Now — Risk Free";
    showPricing = true;
    showGuarantee = true;
  } else if (context.intentScore >= 50) {
    // Evaluating — show proof
    socialProofText = `Rated 4.9/5 by ${Math.floor(Math.random() * 500 + 100)}+ customers`;
    testimonialIndex = 0;
    personalizedCTA = "See Why People Love This";
  } else if (context.intentScore < 20) {
    // Just browsing — educate, don't sell hard
    showPricing = false;
    personalizedCTA = `Learn More About ${niche}`;
    personalizedSub = `Discover how ${outcome.toLowerCase()} is possible — even if you've tried everything else.`;
  }

  // ── Time-based personalization ──
  if (context.timeOfDay === "morning") {
    personalizedSub = personalizedSub.replace(/\.$/, "") + " — start your day with a decision that changes everything.";
  } else if (context.timeOfDay === "night") {
    personalizedSub = personalizedSub.replace(/\.$/, "") + " — imagine waking up tomorrow having already started.";
  }

  // ── Mobile personalization ──
  if (context.isMobile) {
    // Shorter copy on mobile
    if (personalizedHeadline.length > 50) {
      personalizedHeadline = personalizedHeadline.split("—")[0]?.trim() ?? personalizedHeadline.slice(0, 50);
    }
    personalizedCTA = personalizedCTA.length > 25 ? personalizedCTA.split("—")[0]?.trim() ?? "Get Started" : personalizedCTA;
  }

  return {
    headline: personalizedHeadline,
    subheadline: personalizedSub,
    ctaText: personalizedCTA,
    urgencyBar,
    socialProofText,
    testimonialIndex,
    showPricing,
    showGuarantee,
    popupDelay,
    popupMessage,
  };
}

/** Generate the client-side personalization script for public sites */
export function generatePersonalizationScript(siteId: string, defaults: {
  headline: string; subheadline: string; ctaText: string;
  niche: string; painPoint: string; outcome: string;
}): string {
  return `
<script>
(function(){
  var d=${JSON.stringify(defaults)};
  var params=new URLSearchParams(location.search);
  var ctx={
    utmSource:params.get('utm_source')||'',
    utmMedium:params.get('utm_medium')||'',
    utmCampaign:params.get('utm_campaign')||'',
    utmContent:params.get('utm_content')||'',
    referrer:document.referrer||'',
    isReturnVisitor:!!localStorage.getItem('h_lv_${siteId}'),
    visitCount:parseInt(localStorage.getItem('h_vc_${siteId}')||'0')+1,
    isMobile:window.innerWidth<768,
    timeOfDay:new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':new Date().getHours()<21?'evening':'night',
    intentScore:parseInt(localStorage.getItem('h_intent_${siteId}')||'0')
  };
  localStorage.setItem('h_vc_${siteId}',ctx.visitCount.toString());

  // Apply personalization to hero
  var hero=document.querySelector('[class*=hero] h1, section:first-of-type h1, h1');
  var sub=document.querySelector('[class*=hero] p, section:first-of-type p');
  var cta=document.querySelector('[class*=hero] a, section:first-of-type a[href]');

  if(ctx.isReturnVisitor && ctx.visitCount>=3 && hero){
    hero.textContent='Welcome Back — '+d.outcome+' Is Waiting';
  }
  if(ctx.utmSource==='tiktok' && cta){
    cta.textContent='Get It Before It\\'s Gone';
  }
  if(ctx.utmSource==='google' && hero){
    hero.textContent='The '+d.niche+' Solution You\\'ve Been Searching For';
  }
  if(ctx.utmSource==='email' && hero){
    hero.textContent='Welcome Back — Ready to Get '+d.outcome+'?';
  }

  // Intent-based popup
  if(ctx.intentScore>=50 && ctx.isReturnVisitor){
    setTimeout(function(){
      var popup=document.createElement('div');
      popup.style.cssText='position:fixed;bottom:20px;left:20px;max-width:320px;background:#fff;border-radius:16px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:9998;font-family:system-ui';
      popup.innerHTML='<p style="font-size:14px;font-weight:700;color:#111;margin:0 0 8px">Still deciding?</p><p style="font-size:12px;color:#666;margin:0 0 12px">You\\'ve visited '+ctx.visitCount+' times. Here\\'s why people just like you chose us.</p><button onclick="this.parentElement.remove()" style="background:#06b6d4;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Show Me</button><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#999;font-size:11px;cursor:pointer;margin-left:8px">Not now</button>';
      document.body.appendChild(popup);
    },5000);
  }
})();
</script>`;
}
