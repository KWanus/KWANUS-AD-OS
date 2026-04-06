// ---------------------------------------------------------------------------
// Content Scoring Engine — scores any piece of copy for conversion potential
// Used across ads, emails, landing pages, social posts
// ---------------------------------------------------------------------------

export type ContentScore = {
  overall: number;          // 0-100
  dimensions: ContentDimension[];
  grade: "A" | "B" | "C" | "D" | "F";
  topIssue: string | null;
  topStrength: string | null;
};

export type ContentDimension = {
  name: string;
  score: number;            // 0-100
  weight: number;           // how much this matters
  detail: string;
};

const POWER_WORDS = new Set(["free", "proven", "guaranteed", "instant", "exclusive", "secret", "limited", "discover", "ultimate", "breakthrough", "transform", "unlock", "master", "eliminate", "maximize", "effortless", "powerful", "urgent", "new", "now", "easy", "fast", "simple"]);
const EMOTIONAL_WORDS = new Set(["amazing", "shocking", "terrifying", "beautiful", "heartbreaking", "incredible", "unbelievable", "brilliant", "devastating", "inspiring", "jaw-dropping", "life-changing", "mind-blowing", "stunning", "frustrated", "struggling", "tired", "finally", "imagine", "dreaming"]);

export function scoreContent(text: string, type: "ad" | "email" | "landing" | "social" = "ad"): ContentScore {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const wordCount = words.length;

  const dimensions: ContentDimension[] = [];

  // 1. Hook strength (first line)
  const firstLine = text.split("\n")[0] ?? "";
  let hookScore = 50;
  if (firstLine.length >= 10 && firstLine.length <= 80) hookScore += 15;
  if (/\d/.test(firstLine)) hookScore += 10;
  if (firstLine.endsWith("?") || firstLine.endsWith("...")) hookScore += 10;
  if (/you|your/i.test(firstLine)) hookScore += 10;
  hookScore = Math.min(100, hookScore);
  dimensions.push({ name: "Hook Strength", score: hookScore, weight: 0.25, detail: hookScore >= 70 ? "Strong opening" : "Weak first line — needs a hook" });

  // 2. Clarity
  const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : words.length;
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1);
  let clarityScore = 70;
  if (avgSentenceLen <= 15) clarityScore += 15;
  else if (avgSentenceLen > 25) clarityScore -= 20;
  if (avgWordLen <= 5) clarityScore += 10;
  else if (avgWordLen > 7) clarityScore -= 15;
  clarityScore = Math.max(0, Math.min(100, clarityScore));
  dimensions.push({ name: "Clarity", score: clarityScore, weight: 0.15, detail: clarityScore >= 70 ? "Clear and readable" : "Too complex — simplify" });

  // 3. Emotional impact
  const emotionalCount = words.filter((w) => EMOTIONAL_WORDS.has(w.toLowerCase().replace(/[^a-z]/g, ""))).length;
  const powerCount = words.filter((w) => POWER_WORDS.has(w.toLowerCase().replace(/[^a-z]/g, ""))).length;
  let emotionScore = 30 + Math.min(emotionalCount * 15, 40) + Math.min(powerCount * 10, 30);
  emotionScore = Math.min(100, emotionScore);
  dimensions.push({ name: "Emotional Impact", score: emotionScore, weight: 0.20, detail: emotionScore >= 60 ? "Uses emotional language" : "Add power/emotional words" });

  // 4. CTA presence
  const hasCta = /click|sign up|get|grab|start|join|try|buy|order|learn more|shop|book|schedule|claim|download|subscribe/i.test(lower);
  const ctaScore = hasCta ? 90 : 20;
  dimensions.push({ name: "Call to Action", score: ctaScore, weight: 0.20, detail: hasCta ? "CTA present" : "Missing clear CTA" });

  // 5. Social proof / specificity
  const hasNumbers = /\d+[k+]?.*(?:customer|client|user|people|result|star|review)/i.test(lower);
  const hasSpecifics = /\d+%|\$\d|within \d|in \d+ day/i.test(lower);
  let proofScore = 30;
  if (hasNumbers) proofScore += 35;
  if (hasSpecifics) proofScore += 25;
  if (/testimonial|review|case study|proven/i.test(lower)) proofScore += 10;
  proofScore = Math.min(100, proofScore);
  dimensions.push({ name: "Proof & Specificity", score: proofScore, weight: 0.20, detail: proofScore >= 60 ? "Includes proof elements" : "Add numbers, results, or testimonials" });

  // Calculate weighted overall
  const overall = Math.round(
    dimensions.reduce((s, d) => s + d.score * d.weight, 0)
  );

  const grade: ContentScore["grade"] =
    overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F";

  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const topIssue = sorted[0].score < 60 ? sorted[0].detail : null;
  const topStrength = sorted[sorted.length - 1].score >= 70 ? sorted[sorted.length - 1].detail : null;

  return { overall, dimensions, grade, topIssue, topStrength };
}
