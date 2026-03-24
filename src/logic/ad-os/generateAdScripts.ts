import type { DecisionPacket } from "./buildDecisionPacket";
import type { AnalysisMode } from "./normalizeInput";

export type AdScript = {
  title: string;
  duration: string;
  sections: { timestamp: string; direction: string; copy: string }[];
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
  return "a result most people never reach";
}

export function generateAdScripts(
  packet: DecisionPacket,
  mode: AnalysisMode
): AdScript[] {
  const pain = clean(extractPain(packet));
  const outcome = clean(extractOutcome(packet));
  const audience = clean(packet.audience.split(",")[0]);
  const angle = clean(packet.angle.split("(")[0].trim());
  const strPairs = packet.strengths.slice(0, 2).join(" and ").toLowerCase();

  /**
   * Script 1 — "The Ugly Truth VSL" (30–45 sec)
   * Used by the top 1% of DTC brands. Opens with counter-intuitive truth,
   * agitates the identity ("you've been told wrong"), demonstrates the 
   * solution as the ONLY logical answer, uses micro-social proof mid-video,
   * ends with identity-based CTA (not product-based).
   */
  const script1: AdScript = {
    title: "Script 1 — Ugly Truth VSL (30–45 sec)",
    duration: "30–45 seconds",
    sections: [
      {
        timestamp: "0–3s",
        direction: "NO intro. Start in the middle of a real moment. High-energy, direct eye contact. Hook on screen as text overlay.",
        copy: clean(
          mode === "consultant"
            ? `"Here's the real reason your ${audience} business isn't growing — and it has nothing to do with your product or your team."`
            : `"Stop doing what every guru told you to do about ${pain}. It's making it worse."`
        ),
      },
      {
        timestamp: "3–10s",
        direction: "Agitate with specificity — name the exact wrong belief. Make the viewer feel seen and slightly defensive. This discomfort is intentional.",
        copy: clean(
          `"Most ${audience} dealing with ${pain} try [common wrong solution]. They keep failing because that approach addresses the symptom — not the root cause. And the people selling that approach know it."`
        ),
      },
      {
        timestamp: "10–22s",
        direction: "The reframe AND live demonstration simultaneously. Show product working or transformation happening in real time. Spoken copy is secondary to what they SEE.",
        copy: clean(
          `"Here's what actually works — [Show product or transformation in action].` +
          ` This is ${angle}. What you're seeing right now is ${strPairs || outcome}.` +
          ` Look at this. [Pause for 2 seconds to let the visual land.]` +
          ` Thousands of ${audience} hit ${outcome} once they made this one shift."`
        ),
      },
      {
        timestamp: "22–30s",
        direction: "Micro proof stack — 2 real results with names and specifics. No stock photos. Real people. Real numbers. Even text screenshots convert.",
        copy: clean(
          `"[Name] went from ${pain} to ${outcome} in [specific timeframe].` +
          ` [Name 2] did it in [shorter timeframe].` +
          ` [Show screenshots or clips of both]."`
        ),
      },
      {
        timestamp: "30–40s",
        direction: "Identity-based CTA, not product-based. Tell them who they're becoming, not what they're buying. Final line creates FOMO via specificity, not fake urgency.",
        copy: clean(
          mode === "consultant"
            ? `"If you're the kind of ${audience} business owner who's done guessing and ready to fix this properly — I have 3 spots this month. Book your free audit below. This closes [specific date]."`
            : `"Link in bio. We're at [X units] of [Y limit] — once those are gone, they're gone. Don't be the person who waits and pays a higher price on Amazon next week."`
        ),
      },
    ],
  };

  /**
   * Script 2 — "The Diagnostic Story" (60–90 sec, long-form for warming cold traffic)
   * Structure used by Hormozi, Cardone, Brunson media teams. Opens with setup
   * of a real situation (non-product), builds to a discovery, product is the 
   * *vehicle* not the *hero*. The viewer is the hero.
   */
  const script2: AdScript = {
    title: "Script 2 — Diagnostic Story Arc (60–90 sec, warm traffic)",
    duration: "60–90 seconds",
    sections: [
      {
        timestamp: "0–5s",
        direction: "Start in the middle of a story. You are NOT talking about the product yet. Set the scene emotionally. Show the before state.",
        copy: clean(
          mode === "consultant"
            ? `"Six months ago I walked into a ${audience} business doing $500K a year that should have been doing $2M. I couldn't figure out why — until I looked at one thing."`
            : `"I was exactly where you are right now. ${pain}. Every. Single. Day. I'd tried everything people recommended. Spent money on things that promised results and delivered nothing."`
        ),
      },
      {
        timestamp: "5–20s",
        direction: "Deepen the emotional context. The pain should feel real and shared. Add specificity — 'three months', '$2,000', 'called my friend at midnight' — real details build credibility.",
        copy: clean(
          `"This wasn't some minor inconvenience. ${pain} was genuinely affecting my [life area]. I remember [specific moment of failure/frustration] and thinking — maybe I'm just not cut out for this.` +
          ` That's the moment most ${audience} quit. I almost did too."`
        ),
      },
      {
        timestamp: "20–40s",
        direction: "The discovery moment. This is the reframe. What did they realize was WRONG about their old approach? The product is revealed here as the logical conclusion of the insight — not a magic fix.",
        copy: clean(
          `"Then I found out the real reason it wasn't working. It wasn't what most people say — it was [core insight tied to angle].` +
          ` Once I understood that, everything changed. I found this — [introduce product/solution naturally].` +
          ` Within [timeframe], [specific outcome]. Here's what it looks like: [DEMONSTRATION — 5 seconds of real visual]."`
        ),
      },
      {
        timestamp: "40–65s",
        direction: "Social proof expansion. Now that you've delivered insight AND demonstration, layer on proof from OTHER people. This sequence — insight → your result → others' results — is the exact structure used in 8-figure VSLs.",
        copy: clean(
          `"I shared this with [number] people in the ${audience} community I'm part of. Here's what happened:` +
          ` [Name] — ${outcome} in [timeframe]. [Name 2] — [specific result]. [Name 3] — [third result].` +
          ` These are real people. You can look them up. This is what happens when you stop doing what everyone else is doing and do what actually works."`
        ),
      },
      {
        timestamp: "65–80s",
        direction: "Objection neutralization. Name the top 3 reasons they won't buy right now and answer them INSIDE the script before they think them. This is called 'pre-handling' and it's what separates 3% CVR from 8% CVR.",
        copy: clean(
          `"Now — before you click away — I know what you're thinking.` +
          ` First: 'This won't work for my specific situation.' [Answer: it's designed specifically for ${audience} dealing with ${pain}.]` +
          ` Second: 'I've tried things like this before.' [Answer: that's because everything else addresses symptoms, not ${angle}.]` +
          ` Third: 'What if it doesn't work?' [Answer: full refund, 30 days, zero questions.]"`
        ),
      },
      {
        timestamp: "80–90s",
        direction: "Final CTA — name a specific positive outcome that happens IMMEDIATELY after they take action. Remove all friction from the decision. End with identity confirmation.",
        copy: clean(
          mode === "consultant"
            ? `"Book a 30-minute call below. You'll get a full audit of your specific business — what's holding you back, what to fix first, and what it's worth. No obligation. Zero sales pressure. Just clarity. Book now while the slot is open."`
            : `"Click the link below. Order takes 60 seconds. Your order ships within 24 hours. And if ${outcome} doesn't happen for you — full refund, no questions, no hassle. You've got nothing to lose and ${outcome} to gain. The only bad decision is doing nothing."`
        ),
      },
    ],
  };

  /**
   * Script 3 — "The Comparison Killer" (15 sec, top performing paid social format)
   * Built for TikTok/Reels. Interrupts with a direct comparison, names a 
   * clearly inferior alternative, and positions the product as the evolved choice.
   * Used by Pilothouse, Common Thread Collective, and top 8-figure media buyers.
   */
  const script3: AdScript = {
    title: "Script 3 — Comparison Killer (15 sec, TikTok/Reels)",
    duration: "15 seconds",
    sections: [
      {
        timestamp: "0–2s",
        direction: "Split-screen OR rapid-fire cuts. On screen text: 'OLD WAY' vs 'NEW WAY'. Energy is high. No warm-up.",
        copy: clean(`"Old way: [common wrong solution for ${pain}] — slow, expensive, doesn't last."`),
      },
      {
        timestamp: "2–8s",
        direction: "Show the product in use. Real hands. Real environment. No studio lighting. UGC style converts 40% better than polished ads in this format.",
        copy: clean(`"New way: [Show product]. ${angle}. ${outcome} — in [specific short timeframe]. No guesswork. No wasted money."`),
      },
      {
        timestamp: "8–13s",
        direction: "One data point or quote. On-screen text with a real customer name. Visual proof > text proof.",
        copy: clean(`"[Customer name]: '${outcome} in [timeframe].' That's what this does."`),
      },
      {
        timestamp: "13–15s",
        direction: "Direct CTA — one word, one action. Text overlay matches speech exactly.",
        copy: clean(
          mode === "consultant"
            ? `"Free audit — link below."`
            : `"Link in bio — grab yours."`
        ),
      },
    ],
  };

  return [script1, script2, script3];
}
