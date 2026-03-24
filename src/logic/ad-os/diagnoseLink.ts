import type { ExtractedSignals } from "./extractSignals";
import type { LinkType } from "./classifyLink";

export type Diagnosis = {
  whatIsBeingSold: string;
  likelyAudience: string;
  corePainOrDesire: string;
  currentAngle: string;
  strengths: string[];
  weaknesses: string[];
};

function inferAngle(signals: ExtractedSignals): string {
  const { painLanguage, benefits, headline, offerComponents } = signals;

  if (painLanguage.length >= 3) return "Problem-Solution (leading with pain)";
  if (benefits.some((b) => ["transform", "results", "achieve"].includes(b))) return "Before/After Transformation";
  if (offerComponents.includes("free") || offerComponents.includes("bonus")) return "Value Stack / Offer-Led";
  if (headline.toLowerCase().includes("how to")) return "Education / How-To";
  if (benefits.some((b) => ["freedom", "confidence", "success"].includes(b))) return "Identity / Status";
  if (benefits.includes("fast") || benefits.includes("easy")) return "Convenience / Shortcut";
  return "Unclear — angle needs refinement";
}

function inferAudience(signals: ExtractedSignals): string {
  if (signals.audienceHints.length > 0) return signals.audienceHints.join(", ");
  if (signals.painLanguage.length > 0) return `People experiencing: ${signals.painLanguage.slice(0, 2).join(", ")}`;
  return "Broad / unclear — audience not well defined";
}

function inferPainOrDesire(signals: ExtractedSignals): string {
  if (signals.painLanguage.length > 0 && signals.benefits.length > 0) {
    return `Escape from ${signals.painLanguage[0]} → achieve ${signals.benefits[0]}`;
  }
  if (signals.painLanguage.length > 0) return `Pain: ${signals.painLanguage[0]}`;
  if (signals.benefits.length > 0) return `Desire: ${signals.benefits[0]}`;
  return "Not clearly communicated";
}

export function diagnoseLink(signals: ExtractedSignals, linkType: LinkType): Diagnosis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (signals.headline) strengths.push("Has a visible headline");
  else weaknesses.push("No clear headline detected");

  if (signals.trustSignals.length >= 2) strengths.push("Multiple trust signals present");
  else if (signals.trustSignals.length === 1) strengths.push("At least one trust signal present");
  else weaknesses.push("No trust signals detected (no reviews, guarantees, or social proof)");

  if (signals.ctaText) strengths.push(`Clear CTA: "${signals.ctaText}"`);
  else weaknesses.push("No clear call-to-action found");

  if (signals.price) strengths.push(`Price visible: ${signals.price}`);
  else if (linkType === "product") weaknesses.push("Price not clearly visible");

  if (signals.benefits.length >= 3) strengths.push("Strong benefit language present");
  else weaknesses.push("Weak or missing benefit language");

  if (signals.painLanguage.length >= 2) strengths.push("Pain-aware messaging detected");
  else weaknesses.push("Little to no pain/problem language — offer may feel generic");

  if (signals.offerComponents.length >= 2) strengths.push("Offer components present (bonus, discount, etc.)");

  if (signals.audienceHints.length === 0) weaknesses.push("Audience not clearly defined");

  const whatIsBeingSold =
    signals.productName
      ? `${signals.productName}${signals.price ? ` at ${signals.price}` : ""}`
      : "Product or service (details unclear from page content)";

  return {
    whatIsBeingSold,
    likelyAudience: inferAudience(signals),
    corePainOrDesire: inferPainOrDesire(signals),
    currentAngle: inferAngle(signals),
    strengths,
    weaknesses,
  };
}
