/**
 * Predictive Analytics Engine for Email Marketing
 *
 * Implements Klaviyo-level customer scoring:
 *   - Customer Lifetime Value (CLV) prediction (BG/NBD-inspired)
 *   - Churn risk scoring
 *   - Next purchase prediction
 *   - RFM segmentation
 *   - Engagement scoring with time decay
 *   - Batch analysis with audience insights
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CLVTier = "VIP" | "High" | "Medium" | "Low" | "At-Risk";

export interface CLVResult {
  historicalCLV: number;
  predictedCLV: number;
  totalCLV: number;
  tier: CLVTier;
  averageOrderValue: number;
  orderCount: number;
  daysSinceFirstOrder: number;
  purchaseFrequencyDays: number;
  /** Probability the customer is still "alive" (BG/NBD-like) */
  aliveProb: number;
  expectedPurchases12m: number;
}

export type ChurnClass = "Safe" | "Watch" | "At-Risk" | "Churning" | "Lost";

export interface ChurnResult {
  score: number; // 0-100, higher = more likely to churn
  classification: ChurnClass;
  factors: {
    recencyScore: number;
    frequencyDecline: number;
    engagementDrop: number;
    orderValueTrend: number;
  };
  recommendedActions: string[];
}

export interface NextPurchasePrediction {
  averageIntervalDays: number;
  predictedNextDate: Date | null;
  daysUntilPredicted: number | null;
  confidence: number; // 0-1
  isInPurchaseWindow: boolean;
  windowStartDate: Date | null;
  windowEndDate: Date | null;
}

export type RFMSegment =
  | "Champions"
  | "Loyal"
  | "Potential Loyalist"
  | "New"
  | "Promising"
  | "Need Attention"
  | "About to Sleep"
  | "At Risk"
  | "Can't Lose"
  | "Hibernating"
  | "Lost";

export interface RFMResult {
  recency: number; // 1-5
  frequency: number; // 1-5
  monetary: number; // 1-5
  combinedScore: number; // 3-15
  segment: RFMSegment;
}

export type EngagementClass =
  | "Highly Engaged"
  | "Engaged"
  | "Passive"
  | "Disengaged"
  | "Inactive";

export interface EngagementResult {
  score: number; // 0-100
  classification: EngagementClass;
  breakdown: {
    emailOpens: number;
    emailClicks: number;
    purchases: number;
    flowEnrollments: number;
  };
}

export interface ContactAnalysis {
  email: string;
  clv: CLVResult;
  churn: ChurnResult;
  nextPurchase: NextPurchasePrediction;
  rfm: RFMResult;
  engagement: EngagementResult;
  analyzedAt: string;
}

export interface AudienceInsights {
  totalContacts: number;
  totalWithOrders: number;
  clvDistribution: Record<CLVTier, number>;
  churnDistribution: Record<ChurnClass, number>;
  rfmDistribution: Record<RFMSegment, number>;
  engagementDistribution: Record<EngagementClass, number>;
  averageCLV: number;
  medianOrderValue: number;
  averageChurnScore: number;
  atRiskRevenue: number;
  topCustomerEmails: string[];
  analyzedAt: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Days between two dates. */
function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 86_400_000;
}

/** Clamp a number between min and max. */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Assign a percentile-based quintile (1-5) given a value and an array of all values. */
function quintile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 3;
  const sorted = [...allValues].sort((a, b) => a - b);
  const rank = sorted.filter((v) => v <= value).length / sorted.length;
  if (rank <= 0.2) return 1;
  if (rank <= 0.4) return 2;
  if (rank <= 0.6) return 3;
  if (rank <= 0.8) return 4;
  return 5;
}

/** Inverse quintile (lower value = higher score, used for recency where fewer days is better). */
function quintileInverse(value: number, allValues: number[]): number {
  return 6 - quintile(value, allValues);
}

/**
 * Simplified BG/NBD alive probability.
 *
 * P(alive) ~ 1 / (1 + (daysSinceLastPurchase / avgInterval)^shape)
 *
 * shape controls how quickly probability drops; we derive it from the
 * coefficient of variation of inter-purchase intervals.
 */
function aliveProb(
  daysSinceLastPurchase: number,
  avgIntervalDays: number,
  intervalCV: number,
): number {
  if (avgIntervalDays <= 0) return 0.5;
  const shape = 1 + intervalCV; // more irregular = steeper drop
  const ratio = daysSinceLastPurchase / avgIntervalDays;
  return 1 / (1 + Math.pow(ratio, shape));
}

/**
 * Expected number of purchases in the next `horizonDays` given the
 * customer is alive and has a known purchase rate.
 */
function expectedPurchases(
  purchaseRate: number, // purchases per day
  aliveProbability: number,
  horizonDays: number,
): number {
  return purchaseRate * aliveProbability * horizonDays;
}

/** Compute coefficient of variation (std / mean). */
function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

/** Time-decayed score: recent events weight more (exponential decay with half-life in days). */
function decayedScore(
  eventDates: Date[],
  now: Date,
  halfLifeDays: number,
  pointsPerEvent: number,
): number {
  const lambda = Math.LN2 / halfLifeDays;
  return eventDates.reduce((sum, d) => {
    const age = daysBetween(d, now);
    return sum + pointsPerEvent * Math.exp(-lambda * age);
  }, 0);
}

/** Linear trend slope using simple least-squares regression. Returns slope per unit index. */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface OrderRecord {
  amountCents: number;
  createdAt: Date;
  status: string;
}

async function fetchOrders(
  userId: string,
  contactEmail: string,
): Promise<OrderRecord[]> {
  // SiteOrder doesn't have userId directly; we join through Site belonging to user.
  // But the schema doesn't have an explicit relation. We find by customerEmail
  // across the user's sites.
  const sites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  const siteIds = sites.map((s) => s.id);
  if (siteIds.length === 0) return [];

  const orders = await prisma.siteOrder.findMany({
    where: {
      siteId: { in: siteIds },
      customerEmail: contactEmail,
      status: { not: "refunded" },
    },
    orderBy: { createdAt: "asc" },
    select: { amountCents: true, createdAt: true, status: true },
  });
  return orders;
}

interface FlowEngagementData {
  totalEnrollments: number;
  totalEmailsSent: number;
  totalOpens: number;
  totalClicks: number;
  enrollmentDates: Date[];
}

async function fetchFlowEngagement(
  userId: string,
  contactEmail: string,
): Promise<FlowEngagementData> {
  const enrollments = await prisma.emailFlowEnrollment.findMany({
    where: { userId, contactEmail },
    select: { emailsSent: true, createdAt: true, flow: { select: { opens: true, clicks: true, enrolled: true, sent: true } } },
  });

  let totalOpens = 0;
  let totalClicks = 0;
  let totalEmailsSent = 0;
  const enrollmentDates: Date[] = [];

  for (const e of enrollments) {
    totalEmailsSent += e.emailsSent;
    enrollmentDates.push(e.createdAt);
    // Attribute a proportional share of the flow's opens/clicks to this contact
    const enrolled = e.flow.enrolled || 1;
    totalOpens += Math.round((e.flow.opens / enrolled) * (e.emailsSent > 0 ? 1 : 0));
    totalClicks += Math.round((e.flow.clicks / enrolled) * (e.emailsSent > 0 ? 1 : 0));
  }

  return {
    totalEnrollments: enrollments.length,
    totalEmailsSent,
    totalOpens,
    totalClicks,
    enrollmentDates,
  };
}

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

export function computeCLV(
  orders: OrderRecord[],
  now: Date = new Date(),
): CLVResult {
  const completedOrders = orders.filter((o) => o.status !== "pending");
  const n = completedOrders.length;

  if (n === 0) {
    return {
      historicalCLV: 0,
      predictedCLV: 0,
      totalCLV: 0,
      tier: "Low",
      averageOrderValue: 0,
      orderCount: 0,
      daysSinceFirstOrder: 0,
      purchaseFrequencyDays: 0,
      aliveProb: 0.5,
      expectedPurchases12m: 0,
    };
  }

  const historicalCLV = completedOrders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const aov = historicalCLV / n;
  const firstDate = completedOrders[0].createdAt;
  const lastDate = completedOrders[n - 1].createdAt;
  const daysSinceFirst = daysBetween(firstDate, now);
  const daysSinceLast = daysBetween(lastDate, now);

  // Inter-purchase intervals
  const intervals: number[] = [];
  for (let i = 1; i < n; i++) {
    intervals.push(daysBetween(completedOrders[i - 1].createdAt, completedOrders[i].createdAt));
  }
  const avgInterval = intervals.length > 0
    ? intervals.reduce((s, v) => s + v, 0) / intervals.length
    : daysSinceFirst || 365;

  const cv = coefficientOfVariation(intervals);
  const pAlive = n === 1 ? 0.6 : aliveProb(daysSinceLast, avgInterval, cv);
  const purchaseRate = daysSinceFirst > 0 ? n / daysSinceFirst : n / 365;
  const expected12m = expectedPurchases(purchaseRate, pAlive, 365);
  const predictedCLV = expected12m * aov;
  const totalCLV = historicalCLV + predictedCLV;

  let tier: CLVTier;
  if (pAlive < 0.3 && n >= 2) tier = "At-Risk";
  else if (totalCLV >= 500) tier = "VIP";
  else if (totalCLV >= 200) tier = "High";
  else if (totalCLV >= 50) tier = "Medium";
  else tier = "Low";

  return {
    historicalCLV: Math.round(historicalCLV * 100) / 100,
    predictedCLV: Math.round(predictedCLV * 100) / 100,
    totalCLV: Math.round(totalCLV * 100) / 100,
    tier,
    averageOrderValue: Math.round(aov * 100) / 100,
    orderCount: n,
    daysSinceFirstOrder: Math.round(daysSinceFirst),
    purchaseFrequencyDays: Math.round(avgInterval),
    aliveProb: Math.round(pAlive * 1000) / 1000,
    expectedPurchases12m: Math.round(expected12m * 10) / 10,
  };
}

export function computeChurn(
  orders: OrderRecord[],
  engagement: FlowEngagementData,
  now: Date = new Date(),
): ChurnResult {
  const completed = orders.filter((o) => o.status !== "pending");
  const n = completed.length;

  if (n === 0) {
    return {
      score: 50,
      classification: "Watch",
      factors: { recencyScore: 50, frequencyDecline: 0, engagementDrop: 50, orderValueTrend: 0 },
      recommendedActions: ["Send welcome/activation email sequence", "Offer first-purchase incentive"],
    };
  }

  const lastDate = completed[n - 1].createdAt;
  const daysSinceLast = daysBetween(lastDate, now);

  // 1. Recency score (0-100): higher = worse
  const intervals: number[] = [];
  for (let i = 1; i < n; i++) {
    intervals.push(daysBetween(completed[i - 1].createdAt, completed[i].createdAt));
  }
  const avgInterval = intervals.length > 0
    ? intervals.reduce((s, v) => s + v, 0) / intervals.length
    : 90;
  const recencyRatio = daysSinceLast / Math.max(avgInterval, 1);
  const recencyScore = clamp(Math.round((1 - Math.exp(-0.5 * recencyRatio)) * 100), 0, 100);

  // 2. Frequency decline: compare first-half vs second-half interval
  let frequencyDecline = 0;
  if (intervals.length >= 4) {
    const mid = Math.floor(intervals.length / 2);
    const firstHalfAvg = intervals.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
    const secondHalfAvg = intervals.slice(mid).reduce((s, v) => s + v, 0) / (intervals.length - mid);
    if (firstHalfAvg > 0) {
      frequencyDecline = clamp(Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100), -100, 100);
    }
  }

  // 3. Engagement drop (0-100): less engagement = higher score
  const emailsReceived = engagement.totalEmailsSent || 1;
  const engagementRate = (engagement.totalOpens + engagement.totalClicks * 2) / emailsReceived;
  const engagementDrop = clamp(Math.round((1 - Math.min(engagementRate, 1)) * 100), 0, 100);

  // 4. Order value trend
  const amounts = completed.map((o) => o.amountCents);
  const slope = linearSlope(amounts);
  const meanAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const orderValueTrend = meanAmount > 0 ? clamp(Math.round((-slope / meanAmount) * 100), -100, 100) : 0;

  // Composite score: weighted average
  const score = clamp(
    Math.round(
      recencyScore * 0.40 +
      clamp(frequencyDecline, 0, 100) * 0.25 +
      engagementDrop * 0.20 +
      clamp(orderValueTrend, 0, 100) * 0.15,
    ),
    0,
    100,
  );

  let classification: ChurnClass;
  if (score <= 20) classification = "Safe";
  else if (score <= 40) classification = "Watch";
  else if (score <= 60) classification = "At-Risk";
  else if (score <= 80) classification = "Churning";
  else classification = "Lost";

  const actions: string[] = [];
  if (classification === "Safe") {
    actions.push("Continue current engagement cadence");
    actions.push("Consider loyalty/VIP program invitation");
  } else if (classification === "Watch") {
    actions.push("Send personalized product recommendation");
    actions.push("Trigger re-engagement email flow");
  } else if (classification === "At-Risk") {
    actions.push("Send exclusive discount or limited-time offer");
    actions.push("Personal outreach from founder/team");
    actions.push("Survey to understand dissatisfaction");
  } else if (classification === "Churning") {
    actions.push("Aggressive win-back campaign with high-value incentive");
    actions.push("Show social proof and new arrivals");
    actions.push("Consider retargeting ads");
  } else {
    actions.push("Last-chance email with major discount");
    actions.push("Move to low-frequency nurture list");
    actions.push("Suppress from regular campaigns to protect deliverability");
  }

  return {
    score,
    classification,
    factors: { recencyScore, frequencyDecline, engagementDrop, orderValueTrend },
    recommendedActions: actions,
  };
}

export function computeNextPurchase(
  orders: OrderRecord[],
  now: Date = new Date(),
): NextPurchasePrediction {
  const completed = orders.filter((o) => o.status !== "pending");
  const n = completed.length;

  if (n < 2) {
    return {
      averageIntervalDays: 0,
      predictedNextDate: null,
      daysUntilPredicted: null,
      confidence: 0,
      isInPurchaseWindow: false,
      windowStartDate: null,
      windowEndDate: null,
    };
  }

  const intervals: number[] = [];
  for (let i = 1; i < n; i++) {
    intervals.push(daysBetween(completed[i - 1].createdAt, completed[i].createdAt));
  }

  const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  const cv = coefficientOfVariation(intervals);
  // Confidence inversely proportional to CV and proportional to sample size
  const confidence = clamp(Math.min(1 / (1 + cv), 1) * Math.min(n / 5, 1), 0, 1);

  const lastDate = completed[n - 1].createdAt;
  const predictedNext = new Date(lastDate.getTime() + avgInterval * 86_400_000);
  const daysUntil = Math.round(daysBetween(now, predictedNext) * (predictedNext > now ? 1 : -1));

  // Purchase window: +/- 1 standard deviation around the predicted date
  const stdDev = cv * avgInterval;
  const windowStart = new Date(predictedNext.getTime() - stdDev * 86_400_000);
  const windowEnd = new Date(predictedNext.getTime() + stdDev * 86_400_000);
  const isInWindow = now >= windowStart && now <= windowEnd;

  return {
    averageIntervalDays: Math.round(avgInterval * 10) / 10,
    predictedNextDate: predictedNext,
    daysUntilPredicted: daysUntil,
    confidence: Math.round(confidence * 1000) / 1000,
    isInPurchaseWindow: isInWindow,
    windowStartDate: windowStart,
    windowEndDate: windowEnd,
  };
}

export function computeRFM(
  orders: OrderRecord[],
  allOrdersByContact: Map<string, OrderRecord[]>,
  now: Date = new Date(),
): RFMResult {
  const completed = orders.filter((o) => o.status !== "pending");

  // Build comparison arrays from all contacts
  const recencyValues: number[] = [];
  const frequencyValues: number[] = [];
  const monetaryValues: number[] = [];

  allOrdersByContact.forEach((contactOrders) => {
    const co = contactOrders.filter((o) => o.status !== "pending");
    if (co.length === 0) return;
    recencyValues.push(daysBetween(co[co.length - 1].createdAt, now));
    frequencyValues.push(co.length);
    monetaryValues.push(co.reduce((s, o) => s + o.amountCents, 0) / 100);
  });

  if (completed.length === 0) {
    return { recency: 1, frequency: 1, monetary: 1, combinedScore: 3, segment: "Lost" };
  }

  const rDays = daysBetween(completed[completed.length - 1].createdAt, now);
  const fCount = completed.length;
  const mTotal = completed.reduce((s, o) => s + o.amountCents, 0) / 100;

  const r = quintileInverse(rDays, recencyValues); // fewer days = higher score
  const f = quintile(fCount, frequencyValues);
  const m = quintile(mTotal, monetaryValues);
  const combined = r + f + m;

  const segment = rfmSegmentLabel(r, f, m);

  return { recency: r, frequency: f, monetary: m, combinedScore: combined, segment };
}

function rfmSegmentLabel(r: number, f: number, _m: number): RFMSegment {
  // Standard RFM segmentation matrix (r + f pattern)
  if (r >= 4 && f >= 4) return "Champions";
  if (r >= 3 && f >= 4) return "Loyal";
  if (r >= 4 && f >= 2 && f <= 3) return "Potential Loyalist";
  if (r >= 4 && f === 1) return "New";
  if (r === 3 && f >= 2 && f <= 3) return "Promising";
  if (r === 3 && f === 1) return "Need Attention";
  if (r === 2 && f >= 3) return "Can't Lose";
  if (r === 2 && f === 2) return "About to Sleep";
  if (r === 2 && f === 1) return "At Risk";
  if (r === 1 && f >= 3) return "Can't Lose";
  if (r === 1 && f === 2) return "Hibernating";
  return "Lost";
}

export function computeEngagement(
  orders: OrderRecord[],
  engagement: FlowEngagementData,
  now: Date = new Date(),
): EngagementResult {
  const HALF_LIFE_DAYS = 60;

  // Purchase events scored
  const purchaseDates = orders
    .filter((o) => o.status !== "pending")
    .map((o) => o.createdAt);
  const purchaseScore = decayedScore(purchaseDates, now, HALF_LIFE_DAYS, 15);

  // Email opens (approximated from enrollment dates weighted by open ratio)
  const openWeight = engagement.totalEmailsSent > 0
    ? engagement.totalOpens / engagement.totalEmailsSent
    : 0;
  const openScore = decayedScore(
    engagement.enrollmentDates,
    now,
    HALF_LIFE_DAYS,
    5 * openWeight,
  );

  // Email clicks
  const clickWeight = engagement.totalEmailsSent > 0
    ? engagement.totalClicks / engagement.totalEmailsSent
    : 0;
  const clickScore = decayedScore(
    engagement.enrollmentDates,
    now,
    HALF_LIFE_DAYS,
    10 * clickWeight,
  );

  // Flow enrollment activity
  const enrollmentScore = decayedScore(
    engagement.enrollmentDates,
    now,
    HALF_LIFE_DAYS,
    3,
  );

  const rawScore = purchaseScore + openScore + clickScore + enrollmentScore;
  // Normalize to 0-100 using a sigmoid-like curve (score of 50 raw ~ 75 out of 100)
  const score = clamp(Math.round((1 - Math.exp(-rawScore / 30)) * 100), 0, 100);

  let classification: EngagementClass;
  if (score >= 80) classification = "Highly Engaged";
  else if (score >= 60) classification = "Engaged";
  else if (score >= 35) classification = "Passive";
  else if (score >= 15) classification = "Disengaged";
  else classification = "Inactive";

  return {
    score,
    classification,
    breakdown: {
      emailOpens: Math.round(openScore * 10) / 10,
      emailClicks: Math.round(clickScore * 10) / 10,
      purchases: Math.round(purchaseScore * 10) / 10,
      flowEnrollments: Math.round(enrollmentScore * 10) / 10,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Full predictive analysis for a single contact.
 */
export async function analyzeContact(
  userId: string,
  contactEmail: string,
): Promise<ContactAnalysis> {
  const now = new Date();

  const [orders, engagementData, allContacts] = await Promise.all([
    fetchOrders(userId, contactEmail),
    fetchFlowEngagement(userId, contactEmail),
    // For RFM we need all contacts' orders for relative ranking
    fetchAllContactOrders(userId),
  ]);

  const clv = computeCLV(orders, now);
  const churn = computeChurn(orders, engagementData, now);
  const nextPurchase = computeNextPurchase(orders, now);
  const rfm = computeRFM(orders, allContacts, now);
  const engScore = computeEngagement(orders, engagementData, now);

  return {
    email: contactEmail,
    clv,
    churn,
    nextPurchase,
    rfm,
    engagement: engScore,
    analyzedAt: now.toISOString(),
  };
}

/**
 * Batch-process all contacts for a user. Stores results in each contact's
 * `properties` JSON field under the key `predictiveAnalytics`.
 *
 * Returns the count of contacts processed.
 */
export async function analyzeAllContacts(userId: string): Promise<number> {
  const contacts = await prisma.emailContact.findMany({
    where: { userId },
    select: { id: true, email: true, properties: true },
  });

  if (contacts.length === 0) return 0;

  const now = new Date();
  const allContactOrders = await fetchAllContactOrders(userId);

  // Pre-fetch all enrollments for this user in one query
  const allEnrollments = await prisma.emailFlowEnrollment.findMany({
    where: { userId },
    select: {
      contactEmail: true,
      emailsSent: true,
      createdAt: true,
      flow: { select: { opens: true, clicks: true, enrolled: true, sent: true } },
    },
  });

  // Group enrollments by contact email
  const enrollmentsByEmail = new Map<string, typeof allEnrollments>();
  for (const e of allEnrollments) {
    const key = e.contactEmail.toLowerCase();
    if (!enrollmentsByEmail.has(key)) enrollmentsByEmail.set(key, []);
    enrollmentsByEmail.get(key)!.push(e);
  }

  // Process in batches of 50 to avoid overwhelming the DB
  const BATCH_SIZE = 50;
  let processed = 0;

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);

    const updates = batch.map((contact) => {
      const email = contact.email.toLowerCase();
      const orders = allContactOrders.get(email) ?? [];

      // Build engagement data from pre-fetched enrollments
      const contactEnrollments = enrollmentsByEmail.get(email) ?? [];
      const engagementData: FlowEngagementData = {
        totalEnrollments: contactEnrollments.length,
        totalEmailsSent: contactEnrollments.reduce((s, e) => s + e.emailsSent, 0),
        totalOpens: contactEnrollments.reduce((s, e) => {
          const enrolled = e.flow.enrolled || 1;
          return s + Math.round((e.flow.opens / enrolled) * (e.emailsSent > 0 ? 1 : 0));
        }, 0),
        totalClicks: contactEnrollments.reduce((s, e) => {
          const enrolled = e.flow.enrolled || 1;
          return s + Math.round((e.flow.clicks / enrolled) * (e.emailsSent > 0 ? 1 : 0));
        }, 0),
        enrollmentDates: contactEnrollments.map((e) => e.createdAt),
      };

      const clv = computeCLV(orders, now);
      const churn = computeChurn(orders, engagementData, now);
      const nextPurchase = computeNextPurchase(orders, now);
      const rfm = computeRFM(orders, allContactOrders, now);
      const engagement = computeEngagement(orders, engagementData, now);

      const analysis: ContactAnalysis = {
        email: contact.email,
        clv,
        churn,
        nextPurchase,
        rfm,
        engagement,
        analyzedAt: now.toISOString(),
      };

      const existingProps = (contact.properties as Record<string, unknown>) ?? {};
      // Serialize to plain JSON (converts Date objects to ISO strings)
      const serialized = JSON.parse(JSON.stringify(analysis));

      return prisma.emailContact.update({
        where: { id: contact.id },
        data: {
          properties: {
            ...existingProps,
            predictiveAnalytics: serialized,
          } as Prisma.InputJsonValue,
        },
      });
    });

    await Promise.all(updates);
    processed += batch.length;
  }

  return processed;
}

/**
 * Aggregate audience insights across all contacts for a user.
 */
export async function getAudienceInsights(
  userId: string,
): Promise<AudienceInsights> {
  const now = new Date();

  const [contacts, allContactOrders] = await Promise.all([
    prisma.emailContact.findMany({
      where: { userId },
      select: { email: true, properties: true },
    }),
    fetchAllContactOrders(userId),
  ]);

  // Fetch all enrollments
  const allEnrollments = await prisma.emailFlowEnrollment.findMany({
    where: { userId },
    select: {
      contactEmail: true,
      emailsSent: true,
      createdAt: true,
      flow: { select: { opens: true, clicks: true, enrolled: true, sent: true } },
    },
  });

  const enrollmentsByEmail = new Map<string, typeof allEnrollments>();
  for (const e of allEnrollments) {
    const key = e.contactEmail.toLowerCase();
    if (!enrollmentsByEmail.has(key)) enrollmentsByEmail.set(key, []);
    enrollmentsByEmail.get(key)!.push(e);
  }

  const clvDist: Record<CLVTier, number> = { VIP: 0, High: 0, Medium: 0, Low: 0, "At-Risk": 0 };
  const churnDist: Record<ChurnClass, number> = { Safe: 0, Watch: 0, "At-Risk": 0, Churning: 0, Lost: 0 };
  const rfmDist: Record<RFMSegment, number> = {
    Champions: 0, Loyal: 0, "Potential Loyalist": 0, New: 0, Promising: 0,
    "Need Attention": 0, "About to Sleep": 0, "At Risk": 0, "Can't Lose": 0,
    Hibernating: 0, Lost: 0,
  };
  const engDist: Record<EngagementClass, number> = {
    "Highly Engaged": 0, Engaged: 0, Passive: 0, Disengaged: 0, Inactive: 0,
  };

  let totalCLVSum = 0;
  let totalChurnSum = 0;
  let contactsWithOrders = 0;
  const allOrderValues: number[] = [];
  const topCustomers: { email: string; clv: number }[] = [];

  for (const contact of contacts) {
    const email = contact.email.toLowerCase();
    const orders = allContactOrders.get(email) ?? [];

    const contactEnrollments = enrollmentsByEmail.get(email) ?? [];
    const engagementData: FlowEngagementData = {
      totalEnrollments: contactEnrollments.length,
      totalEmailsSent: contactEnrollments.reduce((s, e) => s + e.emailsSent, 0),
      totalOpens: contactEnrollments.reduce((s, e) => {
        const enrolled = e.flow.enrolled || 1;
        return s + Math.round((e.flow.opens / enrolled) * (e.emailsSent > 0 ? 1 : 0));
      }, 0),
      totalClicks: contactEnrollments.reduce((s, e) => {
        const enrolled = e.flow.enrolled || 1;
        return s + Math.round((e.flow.clicks / enrolled) * (e.emailsSent > 0 ? 1 : 0));
      }, 0),
      enrollmentDates: contactEnrollments.map((e) => e.createdAt),
    };

    const clv = computeCLV(orders, now);
    const churn = computeChurn(orders, engagementData, now);
    const rfm = computeRFM(orders, allContactOrders, now);
    const eng = computeEngagement(orders, engagementData, now);

    clvDist[clv.tier]++;
    churnDist[churn.classification]++;
    rfmDist[rfm.segment]++;
    engDist[eng.classification]++;

    totalCLVSum += clv.totalCLV;
    totalChurnSum += churn.score;

    if (orders.length > 0) {
      contactsWithOrders++;
      for (const o of orders) {
        if (o.status !== "pending") allOrderValues.push(o.amountCents / 100);
      }
    }

    topCustomers.push({ email: contact.email, clv: clv.totalCLV });
  }

  // Median order value
  const sortedValues = [...allOrderValues].sort((a, b) => a - b);
  const medianOrderValue = sortedValues.length > 0
    ? sortedValues[Math.floor(sortedValues.length / 2)]
    : 0;

  // At-risk revenue: sum of CLV for At-Risk + Churning + Lost
  const atRiskContacts = contacts.filter((c) => {
    const email = c.email.toLowerCase();
    const orders = allContactOrders.get(email) ?? [];
    const clv = computeCLV(orders, now);
    return clv.tier === "At-Risk";
  });
  const atRiskRevenue = atRiskContacts.reduce((s, c) => {
    const orders = allContactOrders.get(c.email.toLowerCase()) ?? [];
    return s + computeCLV(orders, now).predictedCLV;
  }, 0);

  // Top 10 customers by CLV
  topCustomers.sort((a, b) => b.clv - a.clv);
  const topEmails = topCustomers.slice(0, 10).map((c) => c.email);

  return {
    totalContacts: contacts.length,
    totalWithOrders: contactsWithOrders,
    clvDistribution: clvDist,
    churnDistribution: churnDist,
    rfmDistribution: rfmDist,
    engagementDistribution: engDist,
    averageCLV: contacts.length > 0 ? Math.round((totalCLVSum / contacts.length) * 100) / 100 : 0,
    medianOrderValue: Math.round(medianOrderValue * 100) / 100,
    averageChurnScore: contacts.length > 0 ? Math.round((totalChurnSum / contacts.length) * 10) / 10 : 0,
    atRiskRevenue: Math.round(atRiskRevenue * 100) / 100,
    topCustomerEmails: topEmails,
    analyzedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Internal: fetch all orders grouped by customer email
// ---------------------------------------------------------------------------

async function fetchAllContactOrders(
  userId: string,
): Promise<Map<string, OrderRecord[]>> {
  const sites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  const siteIds = sites.map((s) => s.id);
  if (siteIds.length === 0) return new Map();

  const orders = await prisma.siteOrder.findMany({
    where: {
      siteId: { in: siteIds },
      status: { not: "refunded" },
    },
    orderBy: { createdAt: "asc" },
    select: { customerEmail: true, amountCents: true, createdAt: true, status: true },
  });

  const map = new Map<string, OrderRecord[]>();
  for (const o of orders) {
    const key = o.customerEmail.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({
      amountCents: o.amountCents,
      createdAt: o.createdAt,
      status: o.status,
    });
  }

  return map;
}
