// ---------------------------------------------------------------------------
// Competitor Monitor — track competitor changes over time
// Stores snapshots and diffs of competitor websites
// ---------------------------------------------------------------------------

export type CompetitorSnapshot = {
  url: string;
  scannedAt: string;
  title: string;
  headline: string;
  ctas: string[];
  pricing: string | null;
  trustSignals: string[];
  benefits: string[];
  weaknesses: string[];
};

export type CompetitorDiff = {
  url: string;
  changes: CompetitorChange[];
  scannedAt: string;
  previousScannedAt: string;
};

export type CompetitorChange = {
  field: string;
  before: string;
  after: string;
  significance: "high" | "medium" | "low";
};

/** Compare two snapshots and return the differences */
export function diffSnapshots(
  previous: CompetitorSnapshot,
  current: CompetitorSnapshot
): CompetitorChange[] {
  const changes: CompetitorChange[] = [];

  if (previous.headline !== current.headline) {
    changes.push({
      field: "headline",
      before: previous.headline,
      after: current.headline,
      significance: "high",
    });
  }

  if (previous.title !== current.title) {
    changes.push({
      field: "page title",
      before: previous.title,
      after: current.title,
      significance: "medium",
    });
  }

  if (previous.pricing !== current.pricing && (previous.pricing || current.pricing)) {
    changes.push({
      field: "pricing",
      before: previous.pricing ?? "(none)",
      after: current.pricing ?? "(removed)",
      significance: "high",
    });
  }

  // CTA changes
  const newCtas = current.ctas.filter((c) => !previous.ctas.includes(c));
  const removedCtas = previous.ctas.filter((c) => !current.ctas.includes(c));
  if (newCtas.length > 0 || removedCtas.length > 0) {
    changes.push({
      field: "CTAs",
      before: previous.ctas.join(", ") || "(none)",
      after: current.ctas.join(", ") || "(none)",
      significance: "medium",
    });
  }

  // Trust signal changes
  const newTrust = current.trustSignals.filter((t) => !previous.trustSignals.includes(t));
  if (newTrust.length > 0) {
    changes.push({
      field: "trust signals",
      before: `${previous.trustSignals.length} signals`,
      after: `${current.trustSignals.length} signals (+${newTrust.join(", ")})`,
      significance: "low",
    });
  }

  // Benefit changes
  const newBenefits = current.benefits.filter((b) => !previous.benefits.includes(b));
  if (newBenefits.length > 0) {
    changes.push({
      field: "benefits",
      before: `${previous.benefits.length} listed`,
      after: `${current.benefits.length} listed (+${newBenefits.join(", ")})`,
      significance: "medium",
    });
  }

  return changes;
}

/** Generate a summary of changes for notification */
export function summarizeChanges(diff: CompetitorDiff): string {
  if (diff.changes.length === 0) return "No significant changes detected.";

  const highChanges = diff.changes.filter((c) => c.significance === "high");
  const parts: string[] = [];

  if (highChanges.length > 0) {
    parts.push(`${highChanges.length} major change${highChanges.length > 1 ? "s" : ""}`);
    for (const c of highChanges) {
      parts.push(`${c.field}: "${c.before}" → "${c.after}"`);
    }
  }

  const otherCount = diff.changes.length - highChanges.length;
  if (otherCount > 0) {
    parts.push(`+ ${otherCount} minor update${otherCount > 1 ? "s" : ""}`);
  }

  return parts.join(". ");
}
