// ---------------------------------------------------------------------------
// Creative DNA Analysis
// Analyzes WHY ads work across 50+ parameters, extracts winning patterns,
// and auto-generates new creatives using the winning DNA formula.
//
// Like GetCrux (YC W26) but integrated into the marketing OS.
// ---------------------------------------------------------------------------

export type CreativeDNA = {
  // Structure
  hookType: "question" | "statement" | "statistic" | "story" | "pov" | "controversy" | "list";
  hookLength: "short" | "medium" | "long";
  ctaPosition: "early" | "middle" | "end";
  ctaType: "direct" | "soft" | "curiosity" | "urgency";

  // Content
  usesNumber: boolean;
  usesSocialProof: boolean;
  usesEmotionalTrigger: boolean;
  usesUrgency: boolean;
  usesSpecificResult: boolean;
  addressesPain: boolean;
  addressesDesire: boolean;
  mentionsPrice: boolean;
  mentionsGuarantee: boolean;

  // Tone
  tone: "professional" | "casual" | "urgent" | "emotional" | "educational" | "humorous";
  perspective: "first_person" | "second_person" | "third_person";
  readingLevel: "simple" | "moderate" | "complex";

  // Format
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  hasQuestion: boolean;
  hasEllipsis: boolean;
  hasEmoji: boolean;
  hasCaps: boolean;
};

export type DNAAnalysis = {
  dna: CreativeDNA;
  score: number;           // 0-100 predicted performance
  strengths: string[];
  weaknesses: string[];
  winningFormula: string;  // Human-readable description of why this works
};

export type DNAPattern = {
  pattern: string;
  frequency: number;       // How many winning ads use this
  avgPerformance: number;  // Average score of ads with this pattern
  examples: string[];
};

/** Extract the DNA of an ad creative */
export function extractCreativeDNA(text: string): CreativeDNA {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const firstLine = text.split("\n")[0] ?? "";

  // Hook type detection
  let hookType: CreativeDNA["hookType"] = "statement";
  if (firstLine.endsWith("?")) hookType = "question";
  if (/^\d/.test(firstLine) || /\d+\s*(things|ways|reasons|tips|steps)/i.test(firstLine)) hookType = "list";
  if (/^pov|^imagine|^picture this|^i was/i.test(firstLine)) hookType = firstLine.toLowerCase().startsWith("pov") ? "pov" : "story";
  if (/^stop|^don't|^wrong|^myth|^nobody/i.test(firstLine)) hookType = "controversy";
  if (/^\d+%|^\$\d|^in \d/i.test(firstLine)) hookType = "statistic";

  // CTA position
  const ctaPatterns = /click|sign up|get|buy|start|join|try|book|grab|claim|download|learn more/i;
  const textParts = [text.slice(0, text.length / 3), text.slice(text.length / 3, text.length * 2 / 3), text.slice(text.length * 2 / 3)];
  const ctaPosition: CreativeDNA["ctaPosition"] =
    ctaPatterns.test(textParts[0]) ? "early" : ctaPatterns.test(textParts[2]) ? "end" : "middle";

  // CTA type
  let ctaType: CreativeDNA["ctaType"] = "direct";
  if (/limited|now|hurry|last/i.test(lower)) ctaType = "urgency";
  else if (/learn|discover|find out|see/i.test(lower)) ctaType = "curiosity";
  else if (/when you're ready|if you want|no pressure/i.test(lower)) ctaType = "soft";

  // Tone
  let tone: CreativeDNA["tone"] = "professional";
  if (/lol|haha|😂|😅|tbh|ngl|fr|lowkey/i.test(lower)) tone = "humorous";
  else if (/urgent|hurry|last chance|don't miss|ending/i.test(lower)) tone = "urgent";
  else if (/frustrated|tired|struggling|heartbreak|dream|finally|imagine/i.test(lower)) tone = "emotional";
  else if (/learn|understand|here's how|did you know|research|study/i.test(lower)) tone = "educational";
  else if (/tbh|honestly|real talk|just|actually|gonna/i.test(lower)) tone = "casual";

  // Perspective
  const perspective: CreativeDNA["perspective"] =
    /^i\b|\bmy\b|\bi'm\b|\bi've\b/i.test(firstLine) ? "first_person" :
    /^you\b|\byour\b|\byou're\b/i.test(firstLine) ? "second_person" : "third_person";

  return {
    hookType,
    hookLength: words.length <= 10 ? "short" : words.length <= 25 ? "medium" : "long",
    ctaPosition,
    ctaType,
    usesNumber: /\d/.test(text),
    usesSocialProof: /\d+.*(?:customer|client|people|review|star|trusted)/i.test(lower),
    usesEmotionalTrigger: /frustrated|tired|struggling|finally|imagine|dream|fear|love|hate|amazing|shocking/i.test(lower),
    usesUrgency: /limited|now|today|hurry|last|ending|only \d/i.test(lower),
    usesSpecificResult: /\d+%|\$\d|\d+ day|\d+ week|doubled|tripled|3x|10x/i.test(lower),
    addressesPain: /stop|tired|frustrated|struggling|hate|sick of|done with|problem/i.test(lower),
    addressesDesire: /get|achieve|become|transform|unlock|discover|finally/i.test(lower),
    mentionsPrice: /\$\d|free|no cost|complimentary/i.test(lower),
    mentionsGuarantee: /guarantee|risk.?free|money.?back|refund/i.test(lower),
    tone,
    perspective,
    readingLevel: words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1) <= 4.5 ? "simple" : words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1) <= 6 ? "moderate" : "complex",
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : words.length,
    hasQuestion: text.includes("?"),
    hasEllipsis: text.includes("..."),
    hasEmoji: /[\p{Emoji}]/u.test(text),
    hasCaps: /[A-Z]{3,}/.test(text),
  };
}

/** Analyze a creative and explain WHY it works or doesn't */
export function analyzeDNA(text: string, performance?: number): DNAAnalysis {
  const dna = extractCreativeDNA(text);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let score = 40;

  // Score each DNA element
  if (dna.hookType === "question" || dna.hookType === "pov") { score += 8; strengths.push(`${dna.hookType} hook — high engagement format`); }
  if (dna.usesNumber) { score += 5; strengths.push("Uses specific numbers — increases credibility"); }
  if (dna.usesSocialProof) { score += 8; strengths.push("Social proof present — builds trust"); }
  if (dna.usesEmotionalTrigger) { score += 6; strengths.push("Emotional trigger — creates connection"); }
  if (dna.usesSpecificResult) { score += 8; strengths.push("Specific result mentioned — concrete value"); }
  if (dna.addressesPain) { score += 5; strengths.push("Addresses pain — immediate relevance"); }
  if (dna.mentionsGuarantee) { score += 5; strengths.push("Risk reversal — reduces hesitation"); }
  if (dna.perspective === "second_person") { score += 4; strengths.push("Second person — directly addresses reader"); }
  if (dna.readingLevel === "simple") { score += 3; strengths.push("Simple language — accessible to all"); }
  if (dna.ctaPosition === "end") { score += 3; strengths.push("CTA at end — natural flow"); }

  if (!dna.usesNumber) weaknesses.push("No numbers — add specificity");
  if (!dna.usesSocialProof) weaknesses.push("No social proof — add reviews/numbers");
  if (!dna.addressesPain && !dna.addressesDesire) weaknesses.push("Doesn't address pain or desire");
  if (!dna.mentionsGuarantee) weaknesses.push("No risk reversal");
  if (dna.readingLevel === "complex") { score -= 5; weaknesses.push("Complex language — simplify"); }
  if (dna.wordCount > 100 && dna.hookType !== "story") { score -= 3; weaknesses.push("Too long for ad format"); }

  score = Math.max(0, Math.min(100, performance ?? score));

  const winningFormula = `${dna.hookType} hook + ${dna.perspective} perspective + ${dna.tone} tone` +
    (dna.usesNumber ? " + numbers" : "") +
    (dna.usesSocialProof ? " + social proof" : "") +
    (dna.usesEmotionalTrigger ? " + emotional trigger" : "") +
    (dna.usesSpecificResult ? " + specific result" : "") +
    (dna.mentionsGuarantee ? " + guarantee" : "") +
    ` → ${score}/100 predicted`;

  return { dna, score, strengths, weaknesses, winningFormula };
}

/** Find common patterns across multiple winning creatives */
export function findWinningPatterns(creatives: { text: string; performance: number }[]): DNAPattern[] {
  const winners = creatives.filter((c) => c.performance >= 70);
  if (winners.length === 0) return [];

  const patterns: Record<string, { count: number; totalPerf: number; examples: string[] }> = {};

  for (const creative of winners) {
    const dna = extractCreativeDNA(creative.text);

    const features = [
      dna.hookType,
      dna.tone,
      dna.perspective,
      dna.usesNumber ? "has_number" : null,
      dna.usesSocialProof ? "has_social_proof" : null,
      dna.usesEmotionalTrigger ? "has_emotion" : null,
      dna.usesSpecificResult ? "has_specific_result" : null,
      dna.addressesPain ? "addresses_pain" : null,
      dna.mentionsGuarantee ? "has_guarantee" : null,
      dna.ctaType,
    ].filter(Boolean) as string[];

    for (const feature of features) {
      if (!patterns[feature]) patterns[feature] = { count: 0, totalPerf: 0, examples: [] };
      patterns[feature].count++;
      patterns[feature].totalPerf += creative.performance;
      if (patterns[feature].examples.length < 2) patterns[feature].examples.push(creative.text.slice(0, 100));
    }
  }

  return Object.entries(patterns)
    .map(([pattern, data]) => ({
      pattern,
      frequency: Math.round((data.count / winners.length) * 100),
      avgPerformance: Math.round(data.totalPerf / data.count),
      examples: data.examples,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
}
