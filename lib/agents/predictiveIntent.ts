// ---------------------------------------------------------------------------
// Predictive Intent Detection
// Tracks visitor behavior → detects purchase signals → triggers actions
// BEFORE the customer explicitly asks
//
// Signals: page visits, time on page, scroll depth, return visits,
// pricing page views, comparison behavior, cart abandonment
//
// Actions: trigger urgency email, show popup, auto-chat, retarget
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type IntentSignal = {
  type: "page_view" | "return_visit" | "pricing_view" | "comparison" | "cart_abandon" | "high_engagement" | "form_start";
  weight: number;          // 0-100 contribution to intent score
  timestamp: string;
};

export type VisitorIntent = {
  visitorId: string;
  siteId: string;
  intentScore: number;     // 0-100
  signals: IntentSignal[];
  stage: "browsing" | "considering" | "evaluating" | "ready_to_buy" | "hesitating";
  recommendedAction: IntentAction;
};

export type IntentAction = {
  type: "none" | "show_urgency" | "trigger_email" | "show_popup" | "auto_chat" | "retarget_ad" | "voice_call";
  message?: string;
  urgency: "low" | "medium" | "high" | "critical";
};

/** Score intent from behavioral signals */
export function scoreIntent(signals: IntentSignal[]): VisitorIntent["stage"] {
  const total = signals.reduce((s, sig) => s + sig.weight, 0);

  if (total >= 80) return "ready_to_buy";
  if (total >= 60) return "evaluating";
  if (total >= 40) return "considering";
  if (total >= 20) return "browsing";
  return "browsing";
}

/** Determine what action to take based on intent */
export function getRecommendedAction(stage: VisitorIntent["stage"], signals: IntentSignal[]): IntentAction {
  const hasPricingView = signals.some((s) => s.type === "pricing_view");
  const hasReturnVisit = signals.some((s) => s.type === "return_visit");
  const hasCartAbandon = signals.some((s) => s.type === "cart_abandon");
  const hasFormStart = signals.some((s) => s.type === "form_start");

  switch (stage) {
    case "ready_to_buy":
      if (hasCartAbandon) return { type: "trigger_email", message: "Cart recovery — they were about to buy", urgency: "critical" };
      return { type: "show_urgency", message: "Show urgency/scarcity — they're ready", urgency: "high" };

    case "evaluating":
      if (hasPricingView && hasReturnVisit) return { type: "show_popup", message: "Show limited-time offer — they keep coming back to pricing", urgency: "high" };
      if (hasPricingView) return { type: "auto_chat", message: "Proactive chat: 'Have questions about pricing?'", urgency: "medium" };
      return { type: "retarget_ad", message: "Retarget with testimonial/proof ad", urgency: "medium" };

    case "considering":
      if (hasFormStart) return { type: "trigger_email", message: "Abandoned form recovery — they started but didn't finish", urgency: "medium" };
      return { type: "retarget_ad", message: "Retarget with educational content", urgency: "low" };

    case "hesitating":
      return { type: "trigger_email", message: "Send objection-handling email", urgency: "medium" };

    default:
      return { type: "none", urgency: "low" };
  }
}

/** Process a visitor event and update their intent profile */
export async function processVisitorEvent(input: {
  siteId: string;
  visitorId: string;
  eventType: IntentSignal["type"];
  metadata?: Record<string, unknown>;
}): Promise<VisitorIntent> {
  // Load existing signals for this visitor
  const existing = await prisma.himalayaFunnelEvent.findMany({
    where: {
      event: "visitor_intent_signal",
      metadata: { path: ["visitorId"], equals: input.visitorId },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const signals: IntentSignal[] = existing.map((e) => {
    const meta = e.metadata as Record<string, unknown>;
    return {
      type: (meta.signalType as IntentSignal["type"]) ?? "page_view",
      weight: (meta.weight as number) ?? 5,
      timestamp: e.createdAt.toISOString(),
    };
  });

  // Add new signal
  const weightMap: Record<string, number> = {
    page_view: 5,
    return_visit: 15,
    pricing_view: 25,
    comparison: 20,
    cart_abandon: 30,
    high_engagement: 15,
    form_start: 20,
  };

  const newSignal: IntentSignal = {
    type: input.eventType,
    weight: weightMap[input.eventType] ?? 5,
    timestamp: new Date().toISOString(),
  };
  signals.push(newSignal);

  // Save signal
  await prisma.himalayaFunnelEvent.create({
    data: {
      event: "visitor_intent_signal",
      metadata: {
        siteId: input.siteId,
        visitorId: input.visitorId,
        signalType: input.eventType,
        weight: newSignal.weight,
        ...input.metadata,
      },
    },
  }).catch(() => {});

  const intentScore = Math.min(100, signals.reduce((s, sig) => s + sig.weight, 0));
  const stage = scoreIntent(signals);
  const recommendedAction = getRecommendedAction(stage, signals);

  return {
    visitorId: input.visitorId,
    siteId: input.siteId,
    intentScore,
    signals,
    stage,
    recommendedAction,
  };
}

/** Generate intent tracking script to inject into public sites */
export function generateIntentTrackingScript(siteId: string): string {
  return `
<script>
(function(){
  var siteId='${siteId}';
  var vid=localStorage.getItem('h_visitor')||(function(){var id=Math.random().toString(36).slice(2,10);localStorage.setItem('h_visitor',id);return id})();
  var tracked={};

  function signal(type,meta){
    if(tracked[type+JSON.stringify(meta||{})])return;
    tracked[type+JSON.stringify(meta||{})]=1;
    fetch('/api/intent/signal',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({siteId:siteId,visitorId:vid,eventType:type,metadata:meta||{}})
    }).catch(function(){});
  }

  // Track page views
  signal('page_view',{path:location.pathname});

  // Detect return visit
  var lastVisit=localStorage.getItem('h_last_visit_'+siteId);
  if(lastVisit && Date.now()-parseInt(lastVisit)>3600000) signal('return_visit');
  localStorage.setItem('h_last_visit_'+siteId,Date.now().toString());

  // Detect pricing page view
  if(location.pathname.includes('pric')||location.hash.includes('pric')||document.querySelector('[class*=pricing],[id*=pricing]'))
    signal('pricing_view');

  // Detect high engagement (60+ seconds on page)
  setTimeout(function(){signal('high_engagement',{duration:60})},60000);

  // Detect form start
  document.addEventListener('focus',function(e){
    if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))
      signal('form_start',{field:e.target.name||e.target.type});
  },true);
})();
</script>`;
}
