import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ABTestType =
  | "subject"
  | "content"
  | "from_name"
  | "send_time"
  | "full_variant";

export type ABTestStatus = "draft" | "running" | "completed" | "winner_selected";

export type WinnerCriteria =
  | "open_rate"
  | "click_rate"
  | "conversion_rate"
  | "revenue";

export type ABVariantEvent = "open" | "click" | "conversion";

export interface ABVariant {
  id: string;
  name: string;
  subject: string;
  body: string;
  fromName?: string;
  sendAt?: Date;
  /** The broadcast ID created when the test is started */
  broadcastId?: string;
  recipients: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface ABTest {
  id: string;
  userId: string;
  name: string;
  type: ABTestType;
  status: ABTestStatus;
  variants: ABVariant[];
  /** Segment tags used to pull the audience */
  segmentTags: string[];
  /** Percentage of audience reserved for the test phase (e.g. 20) */
  testSize: number;
  winnerCriteria: WinnerCriteria;
  autoSelectWinner: boolean;
  /** Hours to wait before auto-selecting the winner */
  autoSelectAfterHours: number;
  winnerVariantId?: string;
  startedAt?: Date;
  createdAt: Date;
}

export interface ABTestConfig {
  name: string;
  type: ABTestType;
  variants: Omit<ABVariant, "id" | "recipients" | "opens" | "clicks" | "conversions" | "revenue">[];
  segmentTags: string[];
  testSize: number;
  winnerCriteria: WinnerCriteria;
  autoSelectWinner: boolean;
  autoSelectAfterHours: number;
}

export interface VariantResult {
  variantId: string;
  name: string;
  recipients: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenuePerRecipient: number;
}

export interface SignificanceResult {
  /** Whether there is a statistically significant difference (>95% confidence) */
  significant: boolean;
  /** Confidence level as a percentage (0-100) */
  confidence: number;
  /** Z-score from the two-proportion Z-test */
  zScore: number;
  /** p-value (two-tailed) */
  pValue: number;
  /** Lift of variant B over variant A as a percentage */
  liftPercent: number;
}

export interface TestResults {
  test: ABTest;
  variants: VariantResult[];
  /** Pairwise significance for the winner-criteria metric between each pair of variants */
  significance: Record<string, SignificanceResult>;
  /** The variant currently leading */
  leadingVariantId: string;
  /** Recommended minimum sample size per variant to detect a 10% relative lift */
  recommendedSampleSize: number;
  /** Whether auto-select conditions have been met */
  autoSelectReady: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Tag prefix used to mark broadcasts belonging to an A/B test */
const AB_TAG_PREFIX = "ab_test:";
/** Tag prefix for variant identification */
const VARIANT_TAG_PREFIX = "ab_variant:";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers — Storage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * We store the full ABTest object as a JSON blob inside a dedicated
 * EmailBroadcast row whose `name` follows the pattern `[AB_TEST]:<testId>`.
 * The `body` field holds the JSON-encoded ABTest.  This lets us persist
 * arbitrary test metadata without needing a dedicated table.
 */

function testBroadcastName(testId: string): string {
  return `[AB_TEST]:${testId}`;
}

function generateId(): string {
  return `abt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateVariantId(): string {
  return `abv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function persistTest(test: ABTest): Promise<void> {
  const name = testBroadcastName(test.id);
  const existing = await prisma.emailBroadcast.findFirst({
    where: { name, userId: test.userId },
  });

  const payload = {
    name,
    userId: test.userId,
    subject: `A/B Test: ${test.name}`,
    body: JSON.stringify(test),
    status: `ab_${test.status}`,
    segmentTags: [
      `${AB_TAG_PREFIX}${test.id}`,
      ...test.segmentTags,
    ],
  };

  if (existing) {
    await prisma.emailBroadcast.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.emailBroadcast.create({ data: payload });
  }
}

async function loadTest(testId: string): Promise<ABTest | null> {
  const name = testBroadcastName(testId);
  const row = await prisma.emailBroadcast.findFirst({
    where: { name },
  });
  if (!row) return null;
  try {
    return JSON.parse(row.body) as ABTest;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistical helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cumulative distribution function for the standard normal distribution.
 * Uses the Abramowitz & Stegun rational approximation (error < 7.5e-8).
 */
function normalCDF(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Two-proportion Z-test.
 * Returns a SignificanceResult comparing variant B against variant A.
 */
function twoProportionZTest(
  successA: number,
  totalA: number,
  successB: number,
  totalB: number,
): SignificanceResult {
  if (totalA === 0 || totalB === 0) {
    return {
      significant: false,
      confidence: 0,
      zScore: 0,
      pValue: 1,
      liftPercent: 0,
    };
  }

  const pA = successA / totalA;
  const pB = successB / totalB;

  // Pooled proportion
  const pPool = (successA + successB) / (totalA + totalB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / totalA + 1 / totalB));

  if (se === 0) {
    return {
      significant: false,
      confidence: 0,
      zScore: 0,
      pValue: 1,
      liftPercent: 0,
    };
  }

  const zScore = (pB - pA) / se;
  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  const confidence = (1 - pValue) * 100;
  const liftPercent = pA === 0 ? (pB > 0 ? Infinity : 0) : ((pB - pA) / pA) * 100;

  return {
    significant: confidence >= 95,
    confidence: Math.round(confidence * 100) / 100,
    zScore: Math.round(zScore * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    liftPercent: Math.round(liftPercent * 100) / 100,
  };
}

/**
 * For revenue comparison we use a two-proportion test on "has revenue" vs not,
 * combined with average revenue lift.  A more rigorous approach would use a
 * t-test on revenue values, but we lack per-recipient revenue distributions
 * in our schema.  This is a reasonable proxy for the dashboard.
 */
function revenueSignificance(
  varA: ABVariant,
  varB: ABVariant,
): SignificanceResult {
  // Treat "conversion with revenue" as the success event
  return twoProportionZTest(
    varA.conversions,
    varA.recipients,
    varB.conversions,
    varB.recipients,
  );
}

/**
 * Minimum sample size per variant to detect a given relative lift (default 10%)
 * at 95% confidence and 80% power.
 *
 * Formula: n = (Z_alpha/2 + Z_beta)^2 * (p*(1-p)) / (delta^2)
 * where delta = p * relativeLift, Z_alpha/2 = 1.96, Z_beta = 0.84
 */
function recommendedSampleSize(baselineRate: number, relativeLift = 0.1): number {
  if (baselineRate <= 0 || baselineRate >= 1) return 1000; // safe fallback
  const zAlpha = 1.96; // 95% confidence
  const zBeta = 0.84; // 80% power
  const delta = baselineRate * relativeLift;
  const n = Math.pow(zAlpha + zBeta, 2) * (baselineRate * (1 - baselineRate)) / (delta * delta);
  return Math.ceil(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric extraction helper
// ─────────────────────────────────────────────────────────────────────────────

function getMetricValues(
  variant: ABVariant,
  criteria: WinnerCriteria,
): { successes: number; total: number; rate: number } {
  const total = variant.recipients || 1;
  switch (criteria) {
    case "open_rate":
      return { successes: variant.opens, total, rate: variant.opens / total };
    case "click_rate":
      return { successes: variant.clicks, total, rate: variant.clicks / total };
    case "conversion_rate":
      return { successes: variant.conversions, total, rate: variant.conversions / total };
    case "revenue":
      return { successes: variant.conversions, total, rate: variant.revenue / total };
  }
}

function variantScore(variant: ABVariant, criteria: WinnerCriteria): number {
  const { rate } = getMetricValues(variant, criteria);
  return rate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new A/B test in draft status.
 */
export async function createABTest(
  userId: string,
  config: ABTestConfig,
): Promise<ABTest> {
  if (config.variants.length < 2) {
    throw new Error("A/B test requires at least 2 variants");
  }
  if (config.testSize < 1 || config.testSize > 100) {
    throw new Error("testSize must be between 1 and 100");
  }

  const test: ABTest = {
    id: generateId(),
    userId,
    name: config.name,
    type: config.type,
    status: "draft",
    variants: config.variants.map((v, i) => ({
      ...v,
      id: generateVariantId(),
      name: v.name || `Variant ${String.fromCharCode(65 + i)}`, // A, B, C...
      recipients: 0,
      opens: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
    })),
    segmentTags: config.segmentTags,
    testSize: config.testSize,
    winnerCriteria: config.winnerCriteria,
    autoSelectWinner: config.autoSelectWinner,
    autoSelectAfterHours: config.autoSelectAfterHours,
    createdAt: new Date(),
  };

  await persistTest(test);
  return test;
}

/**
 * Start an A/B test: split the audience into groups and create one
 * EmailBroadcast per variant.  The actual send is delegated to the caller's
 * email infrastructure — this function creates the broadcast records with
 * status "sending" so they can be picked up by the send pipeline.
 */
export async function startABTest(testId: string): Promise<ABTest> {
  const test = await loadTest(testId);
  if (!test) throw new Error(`Test ${testId} not found`);
  if (test.status !== "draft") throw new Error(`Test is already ${test.status}`);

  // Pull audience contacts
  const contacts = await prisma.emailContact.findMany({
    where: {
      userId: test.userId,
      status: "subscribed",
      ...(test.segmentTags.length > 0
        ? { tags: { hasSome: test.segmentTags } }
        : {}),
    },
    select: { id: true, email: true },
  });

  if (contacts.length < test.variants.length * 2) {
    throw new Error(
      `Not enough contacts (${contacts.length}) for ${test.variants.length} variants. Need at least ${test.variants.length * 2}.`,
    );
  }

  // Shuffle contacts (Fisher-Yates)
  const shuffled = [...contacts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Split: testSize% goes to test groups, rest is held for the winner
  const testPoolSize = Math.floor(shuffled.length * (test.testSize / 100));
  const testContacts = shuffled.slice(0, testPoolSize);
  // Remaining contacts will receive the winner later

  // Distribute test contacts evenly across variants
  const perVariant = Math.floor(testContacts.length / test.variants.length);

  for (let i = 0; i < test.variants.length; i++) {
    const variant = test.variants[i];
    const start = i * perVariant;
    const end = i === test.variants.length - 1 ? testContacts.length : start + perVariant;
    const variantContacts = testContacts.slice(start, end);
    variant.recipients = variantContacts.length;

    // Create a real EmailBroadcast for this variant
    const broadcast = await prisma.emailBroadcast.create({
      data: {
        userId: test.userId,
        name: `${test.name} — ${variant.name}`,
        subject: variant.subject,
        body: variant.body,
        fromName: variant.fromName ?? null,
        status: "sending",
        segmentTags: [
          `${AB_TAG_PREFIX}${test.id}`,
          `${VARIANT_TAG_PREFIX}${variant.id}`,
        ],
        scheduledAt: variant.sendAt ?? null,
        recipients: variantContacts.length,
      },
    });

    variant.broadcastId = broadcast.id;

    // Tag contacts so downstream send pipeline knows which variant they belong to
    await prisma.emailContact.updateMany({
      where: {
        id: { in: variantContacts.map((c) => c.id) },
      },
      data: {
        tags: {
          push: `${VARIANT_TAG_PREFIX}${variant.id}`,
        },
      },
    });
  }

  test.status = "running";
  test.startedAt = new Date();
  await persistTest(test);
  return test;
}

/**
 * Record an event (open, click, conversion) for a specific variant.
 * Revenue is only applicable for conversion events.
 */
export async function recordEvent(
  testId: string,
  variantId: string,
  event: ABVariantEvent,
  revenue?: number,
): Promise<void> {
  const test = await loadTest(testId);
  if (!test) throw new Error(`Test ${testId} not found`);

  const variant = test.variants.find((v) => v.id === variantId);
  if (!variant) throw new Error(`Variant ${variantId} not found in test ${testId}`);

  switch (event) {
    case "open":
      variant.opens += 1;
      break;
    case "click":
      variant.clicks += 1;
      break;
    case "conversion":
      variant.conversions += 1;
      if (revenue !== undefined) {
        variant.revenue += revenue;
      }
      break;
  }

  // Also update the variant's broadcast row for dashboard consistency
  if (variant.broadcastId) {
    const broadcastUpdate: Record<string, unknown> = {};
    if (event === "open") broadcastUpdate.opens = { increment: 1 };
    if (event === "click") broadcastUpdate.clicks = { increment: 1 };

    if (Object.keys(broadcastUpdate).length > 0) {
      await prisma.emailBroadcast.update({
        where: { id: variant.broadcastId },
        data: broadcastUpdate,
      });
    }
  }

  await persistTest(test);

  // Check auto-select after recording
  if (test.autoSelectWinner && test.status === "running") {
    await checkAutoSelect(testId);
  }
}

/**
 * Batch record multiple events at once (reduces DB round-trips).
 */
export async function recordEvents(
  testId: string,
  events: Array<{ variantId: string; event: ABVariantEvent; revenue?: number }>,
): Promise<void> {
  const test = await loadTest(testId);
  if (!test) throw new Error(`Test ${testId} not found`);

  for (const { variantId, event, revenue } of events) {
    const variant = test.variants.find((v) => v.id === variantId);
    if (!variant) continue;

    switch (event) {
      case "open":
        variant.opens += 1;
        break;
      case "click":
        variant.clicks += 1;
        break;
      case "conversion":
        variant.conversions += 1;
        if (revenue !== undefined) variant.revenue += revenue;
        break;
    }
  }

  await persistTest(test);

  if (test.autoSelectWinner && test.status === "running") {
    await checkAutoSelect(testId);
  }
}

/**
 * Get full test results with per-variant metrics and statistical significance.
 */
export async function getTestResults(testId: string): Promise<TestResults> {
  const test = await loadTest(testId);
  if (!test) throw new Error(`Test ${testId} not found`);

  const variantResults: VariantResult[] = test.variants.map((v) => {
    const recip = v.recipients || 1;
    return {
      variantId: v.id,
      name: v.name,
      recipients: v.recipients,
      opens: v.opens,
      clicks: v.clicks,
      conversions: v.conversions,
      revenue: v.revenue,
      openRate: Math.round((v.opens / recip) * 10000) / 100,
      clickRate: Math.round((v.clicks / recip) * 10000) / 100,
      conversionRate: Math.round((v.conversions / recip) * 10000) / 100,
      revenuePerRecipient: Math.round((v.revenue / recip) * 100) / 100,
    };
  });

  // Pairwise significance
  const significance: Record<string, SignificanceResult> = {};
  for (let i = 0; i < test.variants.length; i++) {
    for (let j = i + 1; j < test.variants.length; j++) {
      const a = test.variants[i];
      const b = test.variants[j];
      const key = `${a.id}_vs_${b.id}`;

      if (test.winnerCriteria === "revenue") {
        significance[key] = revenueSignificance(a, b);
      } else {
        const mA = getMetricValues(a, test.winnerCriteria);
        const mB = getMetricValues(b, test.winnerCriteria);
        significance[key] = twoProportionZTest(
          mA.successes,
          mA.total,
          mB.successes,
          mB.total,
        );
      }
    }
  }

  // Leading variant
  const sorted = [...test.variants].sort(
    (a, b) => variantScore(b, test.winnerCriteria) - variantScore(a, test.winnerCriteria),
  );
  const leadingVariantId = sorted[0]?.id ?? test.variants[0].id;

  // Baseline rate for sample size recommendation
  const baselineRate =
    test.winnerCriteria === "revenue"
      ? (test.variants[0]?.conversions ?? 0) / (test.variants[0]?.recipients || 1)
      : getMetricValues(test.variants[0], test.winnerCriteria).rate;

  const recSampleSize = recommendedSampleSize(
    baselineRate > 0 ? baselineRate : 0.2, // fallback to 20% if no data yet
  );

  // Auto-select readiness
  const autoSelectReady = isAutoSelectReady(test);

  return {
    test,
    variants: variantResults,
    significance,
    leadingVariantId,
    recommendedSampleSize: recSampleSize,
    autoSelectReady,
  };
}

/**
 * Select a winner — either manually by providing a variantId, or automatically
 * by picking the best-performing variant.
 */
export async function selectWinner(
  testId: string,
  variantId?: string,
): Promise<ABTest> {
  const test = await loadTest(testId);
  if (!test) throw new Error(`Test ${testId} not found`);
  if (test.status === "winner_selected") {
    throw new Error("Winner has already been selected for this test");
  }

  let winnerId: string;

  if (variantId) {
    const exists = test.variants.find((v) => v.id === variantId);
    if (!exists) throw new Error(`Variant ${variantId} not found`);
    winnerId = variantId;
  } else {
    // Auto-select: pick variant with highest score for the winner criteria
    const sorted = [...test.variants].sort(
      (a, b) => variantScore(b, test.winnerCriteria) - variantScore(a, test.winnerCriteria),
    );
    winnerId = sorted[0].id;
  }

  test.winnerVariantId = winnerId;
  test.status = "winner_selected";

  // Mark variant broadcasts as completed
  for (const v of test.variants) {
    if (v.broadcastId) {
      await prisma.emailBroadcast.update({
        where: { id: v.broadcastId },
        data: { status: v.id === winnerId ? "sent" : "ab_loser" },
      });
    }
  }

  await persistTest(test);
  return test;
}

/**
 * Send the winning variant to the remaining audience (those not in the test pool).
 * Creates a new EmailBroadcast with status "sending" for the remainder segment.
 */
export async function sendToRemainder(testId: string): Promise<{ broadcastId: string; recipientCount: number }> {
  const test = await loadTest(testId);
  if (!test) throw new Error(`Test ${testId} not found`);
  if (test.status !== "winner_selected") {
    throw new Error("Must select a winner before sending to remainder");
  }
  if (!test.winnerVariantId) {
    throw new Error("No winner variant set");
  }

  const winner = test.variants.find((v) => v.id === test.winnerVariantId);
  if (!winner) throw new Error("Winner variant not found");

  // Find all variant tags to exclude contacts already in the test
  const variantTags = test.variants.map((v) => `${VARIANT_TAG_PREFIX}${v.id}`);

  // Get subscribed contacts in the segment who were NOT part of the test
  const remainderContacts = await prisma.emailContact.findMany({
    where: {
      userId: test.userId,
      status: "subscribed",
      ...(test.segmentTags.length > 0
        ? { tags: { hasSome: test.segmentTags } }
        : {}),
      NOT: {
        tags: { hasSome: variantTags },
      },
    },
    select: { id: true },
  });

  if (remainderContacts.length === 0) {
    throw new Error("No remaining contacts to send to (test may have used 100% of audience)");
  }

  // Create broadcast for remainder
  const broadcast = await prisma.emailBroadcast.create({
    data: {
      userId: test.userId,
      name: `${test.name} — Winner (${winner.name}) → Remainder`,
      subject: winner.subject,
      body: winner.body,
      fromName: winner.fromName ?? null,
      status: "sending",
      segmentTags: [
        `${AB_TAG_PREFIX}${test.id}`,
        "ab_remainder",
      ],
      recipients: remainderContacts.length,
    },
  });

  // Tag remainder contacts
  await prisma.emailContact.updateMany({
    where: {
      id: { in: remainderContacts.map((c) => c.id) },
    },
    data: {
      tags: {
        push: `ab_remainder:${test.id}`,
      },
    },
  });

  test.status = "completed";
  await persistTest(test);

  return { broadcastId: broadcast.id, recipientCount: remainderContacts.length };
}

/**
 * Check if auto-select conditions are met (time elapsed AND optionally significance).
 * If conditions are met, automatically selects the winner.
 */
export async function checkAutoSelect(testId: string): Promise<boolean> {
  const test = await loadTest(testId);
  if (!test) return false;
  if (test.status !== "running") return false;
  if (!test.autoSelectWinner) return false;

  if (!isAutoSelectReady(test)) return false;

  // Auto-select the best variant
  await selectWinner(testId);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all A/B tests for a user.
 */
export async function listABTests(userId: string): Promise<ABTest[]> {
  const rows = await prisma.emailBroadcast.findMany({
    where: {
      userId,
      name: { startsWith: "[AB_TEST]:" },
    },
    orderBy: { createdAt: "desc" },
  });

  const tests: ABTest[] = [];
  for (const row of rows) {
    try {
      tests.push(JSON.parse(row.body) as ABTest);
    } catch {
      // skip corrupt rows
    }
  }
  return tests;
}

/**
 * Delete an A/B test and its associated variant broadcasts.
 * Only allowed for draft or completed tests.
 */
export async function deleteABTest(testId: string): Promise<void> {
  const test = await loadTest(testId);
  if (!test) throw new Error(`Test ${testId} not found`);
  if (test.status === "running") {
    throw new Error("Cannot delete a running test. Select a winner or wait for completion first.");
  }

  // Delete variant broadcasts
  for (const v of test.variants) {
    if (v.broadcastId) {
      await prisma.emailBroadcast.delete({
        where: { id: v.broadcastId },
      }).catch(() => {
        // Variant broadcast may have been deleted already
      });
    }
  }

  // Delete the test metadata broadcast
  const name = testBroadcastName(testId);
  const meta = await prisma.emailBroadcast.findFirst({
    where: { name, userId: test.userId },
  });
  if (meta) {
    await prisma.emailBroadcast.delete({ where: { id: meta.id } });
  }

  // Clean up variant tags from contacts
  // Note: Prisma doesn't support array element removal in updateMany,
  // so we leave the tags in place. They are inert once the test is deleted.
}

/**
 * Resolve a variant ID from a broadcast ID (useful for webhook handlers that
 * receive broadcast-level events and need to route them to the right variant).
 */
export async function resolveVariantFromBroadcast(
  broadcastId: string,
): Promise<{ testId: string; variantId: string } | null> {
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
  });
  if (!broadcast) return null;

  // Find the AB test tag
  const testTag = broadcast.segmentTags.find((t) => t.startsWith(AB_TAG_PREFIX));
  const variantTag = broadcast.segmentTags.find((t) => t.startsWith(VARIANT_TAG_PREFIX));
  if (!testTag || !variantTag) return null;

  return {
    testId: testTag.replace(AB_TAG_PREFIX, ""),
    variantId: variantTag.replace(VARIANT_TAG_PREFIX, ""),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function isAutoSelectReady(test: ABTest): boolean {
  if (!test.startedAt) return false;

  const elapsedMs = Date.now() - new Date(test.startedAt).getTime();
  const requiredMs = test.autoSelectAfterHours * 60 * 60 * 1000;

  return elapsedMs >= requiredMs;
}
