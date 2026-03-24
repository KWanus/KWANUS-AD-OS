import type { DecisionPacket } from "./buildDecisionPacket";
import type { AnalysisMode } from "./normalizeInput";

export type AdHook = {
  format: string;
  hook: string;
};

function clean(text: string): string {
  return text.replace(/undefined|null/gi, "").trim();
}

function extractCorePain(packet: DecisionPacket): string {
  const pain = packet.painDesire;
  if (pain.toLowerCase().includes("pain:")) return pain.replace(/pain:/i, "").trim();
  if (pain.includes("→")) return pain.split("→")[0].replace(/escape from/i, "").trim();
  return pain.split(".")[0].trim();
}

function extractDesiredOutcome(packet: DecisionPacket): string {
  const pain = packet.painDesire;
  if (pain.includes("→")) return pain.split("→")[1].trim();
  const benefits = (packet as { strengths?: string[] }).strengths ?? [];
  if (benefits.length > 0) return benefits[0].replace(/strong|clear|good|has a/gi, "").trim();
  return "a result most people never reach";
}

export function generateAdHooks(
  packet: DecisionPacket,
  mode: AnalysisMode
): AdHook[] {
  const pain = clean(extractCorePain(packet));
  const outcome = clean(extractDesiredOutcome(packet));
  const audience = clean(packet.audience.split(",")[0]);
  const angle = clean(packet.angle.split("(")[0].trim());

  const hooks: AdHook[] = [
    /**
     * 1. Ugly Truth Open — used by top DTC operators. Leads with a contrarian
     *    observation that stops the scroll. The "1% know this, 99% don't" frame.
     */
    {
      format: "Ugly Truth (Pattern Interrupt)",
      hook: clean(
        mode === "consultant"
          ? `Nobody wants to tell you this, but the reason your ${audience} business isn't scaling isn't your product — it's your positioning. Here's the exact gap costing you revenue every single day.`
          : `Everyone selling you solutions for ${pain} is lying to you. The real problem is something else entirely — and once you see it, it changes everything.`
      ),
    },

    /**
     * 2. Identity Shift Frame — emotion research shows identity-based appeals
     *    outperform benefit-based by 3x in top-of-funnel. Used by the top 1%
     *    because it creates tribal belonging before the pitch even starts.
     */
    {
      format: "Identity-Frame (Status Shift)",
      hook: clean(
        mode === "consultant"
          ? `The ${audience} businesses generating $1M+ don't do what the rest do. They use a completely different playbook. This is what it actually looks like.`
          : `There are two types of ${audience}: those who still deal with ${pain}, and those who found ${angle.toLowerCase()}. I was the first type. Here's how I became the second.`
      ),
    },

    /**
     * 3. Proof Stack Open — used by Alex Hormozi, Myron Golden etc. Start with
     *    the MAX social proof number, then attach the pain/outcome. 
     */
    {
      format: "Proof Stack (Authority + Social)",
      hook: clean(
        `We've helped over 10,000 ${audience} go from ${pain} to ${outcome} — and it doesn't take what you think. Watch until the end.`
      ),
    },

    /**
     * 4. Future Pace Open — top VSL producers use this to let the viewer "feel"
     *    the outcome before the buy. Neurologically bypasses skepticism.
     */
    {
      format: "Future Pace (Visualization)",
      hook: clean(
        mode === "consultant"
          ? `Imagine waking up to a calendar full of qualified calls from ${audience} clients who already trust you — before you even say a word. That's what happens after you fix just one thing.`
          : `Imagine waking up tomorrow with ${outcome} — no more ${pain}, no more wasted time, no more dead ends. I want to show you exactly how that happens.`
      ),
    },

    /**
     * 5. "Whose Fault Is It" Redirect — reframes blame away from viewer and
     *    onto the system/market, which instantly builds rapport. Top-tier
     *    copywriters use this to kill buyer resistance in the first 5 seconds.
     */
    {
      format: "Blame Redirect (Empathy-Led)",
      hook: clean(
        `It's not your fault you've been dealing with ${pain}. The real problem is that the mainstream advice on this is completely backwards. Here's what actually works.`
      ),
    },

    /**
     * 6. Demonstration Cold Open — no intro, no preamble. Goes straight to
     *    the most jaw-dropping result. Used by top performing TikTok & Reels ads.
     */
    {
      format: "Cold Demo (No Context, Maximum Curiosity)",
      hook: clean(
        `[START RECORDING — No intro] You're looking at ${outcome}. Before I had this, I was dealing with ${pain} every single day. This is the exact thing that changed it.`
      ),
    },

    /**
     * 7. "Specific Number" Hook — specificity dramatically increases perceived
     *    credibility. Top media buyers know that "127 days" beats "a few months."
     */
    {
      format: "Specificity (Data-Driven Credibility)",
      hook: clean(
        mode === "consultant"
          ? `I audited 47 ${audience} businesses this year. Every single one had the same 3 gaps. Here's the breakdown — and how to fix all 3 in the next 14 days.`
          : `In 23 days, I went from ${pain} to ${outcome}. Not with some complicated system — with one simple change. Here's exactly what it was.`
      ),
    },
  ];

  return hooks;
}
