import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────────────

type EngagementType = "open" | "click";

interface EngagementEntry {
  type: EngagementType;
  timestamp: string; // ISO string
}

interface ContactProperties {
  engagementLog?: EngagementEntry[];
  timezone?: string;
  businessType?: "b2b" | "b2c";
  [key: string]: unknown;
}

interface OptimalSendTime {
  hour: number; // 0-23
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  confidence: "personal" | "cohort" | "global";
  score: number; // 0-1 confidence score
}

interface CohortProfile {
  name: string;
  description: string;
  peakHours: number[];
  contactCount: number;
  avgOpenRate: number;
}

interface CohortSendTimes {
  profiles: CohortProfile[];
  hourlyDistribution: number[]; // 24 slots
  dayOfWeekDistribution: number[]; // 7 slots
}

interface ScheduleEntry {
  contactEmail: string;
  scheduledAt: Date;
}

interface SchedulePreview {
  totalContacts: number;
  hourlyBreakdown: { hour: number; count: number }[];
  dayBreakdown: { day: number; count: number }[];
  estimatedPeakLoad: number;
}

interface TimePerformance {
  hour: number;
  day: number;
  openRate: number;
  clickRate: number;
  totalSent: number;
}

interface BestWorstTimes {
  best: TimePerformance[];
  worst: TimePerformance[];
}

interface HeatmapCell {
  day: number; // 0-6
  hour: number; // 0-23
  score: number; // 0-1 normalized engagement score
  opens: number;
  clicks: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseProperties(props: unknown): ContactProperties {
  if (!props || typeof props !== "object") return {};
  return props as ContactProperties;
}

/** Weighted score: clicks are worth 2x opens */
function engagementWeight(type: EngagementType): number {
  return type === "click" ? 2 : 1;
}

/** Build a histogram of size `slots` from timestamps using an extractor function */
function buildHistogram(
  entries: EngagementEntry[],
  slots: number,
  extractor: (d: Date) => number
): number[] {
  const histogram = new Array(slots).fill(0);
  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    if (isNaN(d.getTime())) continue;
    const slot = extractor(d);
    if (slot >= 0 && slot < slots) {
      histogram[slot] += engagementWeight(entry.type);
    }
  }
  return histogram;
}

function buildHourlyHistogram(entries: EngagementEntry[]): number[] {
  return buildHistogram(entries, 24, (d) => d.getUTCHours());
}

function buildDayOfWeekHistogram(entries: EngagementEntry[]): number[] {
  return buildHistogram(entries, 7, (d) => d.getUTCDay());
}

/** Find the index of the maximum value in an array; returns 0 on tie/empty */
function argMax(arr: number[]): number {
  let maxIdx = 0;
  let maxVal = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

/** Normalize an array so the max value is 1.0 */
function normalize(arr: number[]): number[] {
  const max = Math.max(...arr);
  if (max === 0) return arr.map(() => 0);
  return arr.map((v) => v / max);
}

/** Apply a timezone offset (hours) to an hour value */
function applyTimezoneOffset(hour: number, offsetHours: number): number {
  return ((hour - offsetHours) % 24 + 24) % 24;
}

/** Common timezone offsets (IANA name → UTC offset in hours) */
const TIMEZONE_OFFSETS: Record<string, number> = {
  "America/New_York": -5,
  "America/Chicago": -6,
  "America/Denver": -7,
  "America/Los_Angeles": -8,
  "America/Anchorage": -9,
  "Pacific/Honolulu": -10,
  "Europe/London": 0,
  "Europe/Paris": 1,
  "Europe/Berlin": 1,
  "Asia/Tokyo": 9,
  "Asia/Shanghai": 8,
  "Asia/Kolkata": 5.5,
  "Australia/Sydney": 11,
  "Pacific/Auckland": 13,
  UTC: 0,
};

function getTimezoneOffset(timezone: string | undefined): number {
  if (!timezone) return 0;
  return TIMEZONE_OFFSETS[timezone] ?? 0;
}

// Default best practices when no data exists
const B2C_DEFAULTS = {
  hours: [10, 14, 20],
  days: [2, 4], // Tuesday, Thursday
};

const B2B_DEFAULTS = {
  hours: [9, 10, 11],
  days: [2, 3, 4], // Tuesday-Thursday
};

// ─── 1. Engagement Time Tracking ────────────────────────────────────────────

/**
 * Record an engagement event (open or click) for a contact.
 * Stores timestamped entries in `contact.properties.engagementLog`.
 */
export async function recordEngagement(
  contactEmail: string,
  type: EngagementType,
  timestamp: Date
): Promise<void> {
  const contact = await prisma.emailContact.findFirst({
    where: { email: contactEmail },
    select: { id: true, properties: true },
  });

  if (!contact) return;

  const props = parseProperties(contact.properties);
  const log: EngagementEntry[] = props.engagementLog ?? [];

  log.push({
    type,
    timestamp: timestamp.toISOString(),
  });

  // Keep only the last 500 entries to avoid unbounded growth
  const trimmedLog = log.slice(-500);

  await prisma.emailContact.update({
    where: { id: contact.id },
    data: {
      properties: JSON.parse(JSON.stringify({
        ...props,
        engagementLog: trimmedLog,
      })),
    },
  });
}

/**
 * Get hourly engagement histogram (24 slots) for a contact.
 */
export async function getHourlyHistogram(
  contactEmail: string
): Promise<number[]> {
  const contact = await prisma.emailContact.findFirst({
    where: { email: contactEmail },
    select: { properties: true },
  });

  if (!contact) return new Array(24).fill(0);

  const props = parseProperties(contact.properties);
  const log = props.engagementLog ?? [];

  return buildHourlyHistogram(log);
}

/**
 * Get day-of-week engagement histogram (7 slots, 0=Sunday) for a contact.
 */
export async function getDayOfWeekHistogram(
  contactEmail: string
): Promise<number[]> {
  const contact = await prisma.emailContact.findFirst({
    where: { email: contactEmail },
    select: { properties: true },
  });

  if (!contact) return new Array(7).fill(0);

  const props = parseProperties(contact.properties);
  const log = props.engagementLog ?? [];

  return buildDayOfWeekHistogram(log);
}

// ─── 2. Individual Send Time Prediction ─────────────────────────────────────

/**
 * Predict the optimal send time for a specific contact.
 *
 * Strategy (in priority order):
 *   1. Personal engagement history (if >= 3 events)
 *   2. Cohort average from contacts sharing tags
 *   3. Global defaults (B2C or B2B)
 */
export async function getOptimalSendTime(
  userId: string,
  contactEmail: string
): Promise<OptimalSendTime> {
  const contact = await prisma.emailContact.findFirst({
    where: { email: contactEmail, userId },
    select: { properties: true, tags: true },
  });

  if (!contact) {
    return { hour: 10, dayOfWeek: 2, confidence: "global", score: 0.3 };
  }

  const props = parseProperties(contact.properties);
  const log = props.engagementLog ?? [];
  const tz = props.timezone;
  const offset = getTimezoneOffset(tz);

  // --- Strategy 1: Personal data (minimum 3 events) ---
  if (log.length >= 3) {
    const hourly = buildHourlyHistogram(log);
    const daily = buildDayOfWeekHistogram(log);
    const bestHour = argMax(hourly);
    const bestDay = argMax(daily);
    const totalWeight = hourly.reduce((a, b) => a + b, 0);
    const score = Math.min(1, totalWeight / 50); // confidence grows with more data

    return {
      hour: applyTimezoneOffset(bestHour, offset),
      dayOfWeek: bestDay,
      confidence: "personal",
      score: Math.max(0.5, score),
    };
  }

  // --- Strategy 2: Cohort data from contacts with matching tags ---
  if (contact.tags.length > 0) {
    const cohortContacts = await prisma.emailContact.findMany({
      where: {
        userId,
        tags: { hasSome: contact.tags },
        email: { not: contactEmail },
      },
      select: { properties: true },
      take: 200,
    });

    const allLogs: EngagementEntry[] = [];
    for (const c of cohortContacts) {
      const p = parseProperties(c.properties);
      if (p.engagementLog) allLogs.push(...p.engagementLog);
    }

    if (allLogs.length >= 10) {
      const hourly = buildHourlyHistogram(allLogs);
      const daily = buildDayOfWeekHistogram(allLogs);
      return {
        hour: applyTimezoneOffset(argMax(hourly), offset),
        dayOfWeek: argMax(daily),
        confidence: "cohort",
        score: Math.min(0.7, allLogs.length / 200),
      };
    }
  }

  // --- Strategy 3: Global defaults ---
  const businessType = props.businessType ?? "b2c";
  const defaults = businessType === "b2b" ? B2B_DEFAULTS : B2C_DEFAULTS;

  return {
    hour: defaults.hours[0],
    dayOfWeek: defaults.days[0],
    confidence: "global",
    score: 0.3,
  };
}

// ─── 3. Cohort Analysis ─────────────────────────────────────────────────────

type CohortCategory = "early_bird" | "lunch_reader" | "evening_browser" | "night_owl";

function classifyContact(hourly: number[]): CohortCategory {
  // Sum engagement by time-of-day bands
  const bands = {
    early_bird: hourly.slice(5, 10).reduce((a, b) => a + b, 0),     // 5-9am
    lunch_reader: hourly.slice(10, 15).reduce((a, b) => a + b, 0),   // 10am-2pm
    evening_browser: hourly.slice(15, 21).reduce((a, b) => a + b, 0), // 3-8pm
    night_owl:
      hourly.slice(21, 24).reduce((a, b) => a + b, 0) +
      hourly.slice(0, 5).reduce((a, b) => a + b, 0),                  // 9pm-4am
  };

  let maxBand: CohortCategory = "lunch_reader";
  let maxVal = 0;
  for (const [band, val] of Object.entries(bands)) {
    if (val > maxVal) {
      maxVal = val;
      maxBand = band as CohortCategory;
    }
  }
  return maxBand;
}

const COHORT_META: Record<CohortCategory, { name: string; description: string; peakHours: number[] }> = {
  early_bird: { name: "Early Bird", description: "Most active 5-9am", peakHours: [6, 7, 8] },
  lunch_reader: { name: "Lunch Reader", description: "Most active 10am-2pm", peakHours: [10, 11, 12, 13] },
  evening_browser: { name: "Evening Browser", description: "Most active 3-8pm", peakHours: [16, 17, 18, 19] },
  night_owl: { name: "Night Owl", description: "Most active 9pm-4am", peakHours: [21, 22, 23, 0, 1] },
};

/**
 * Analyze the user's entire contact list and group by engagement pattern.
 * Returns cohort profiles and distribution data for charting.
 */
export async function getCohortSendTimes(userId: string): Promise<CohortSendTimes> {
  const contacts = await prisma.emailContact.findMany({
    where: { userId, status: "subscribed" },
    select: { properties: true },
  });

  const globalHourly = new Array(24).fill(0);
  const globalDaily = new Array(7).fill(0);
  const cohortCounts: Record<CohortCategory, { count: number; totalEngagement: number }> = {
    early_bird: { count: 0, totalEngagement: 0 },
    lunch_reader: { count: 0, totalEngagement: 0 },
    evening_browser: { count: 0, totalEngagement: 0 },
    night_owl: { count: 0, totalEngagement: 0 },
  };

  for (const contact of contacts) {
    const props = parseProperties(contact.properties);
    const log = props.engagementLog ?? [];
    if (log.length === 0) continue;

    const hourly = buildHourlyHistogram(log);
    const daily = buildDayOfWeekHistogram(log);

    // Accumulate global histograms
    for (let i = 0; i < 24; i++) globalHourly[i] += hourly[i];
    for (let i = 0; i < 7; i++) globalDaily[i] += daily[i];

    // Classify into cohort
    const cohort = classifyContact(hourly);
    cohortCounts[cohort].count += 1;
    cohortCounts[cohort].totalEngagement += log.length;
  }

  const totalWithData = Object.values(cohortCounts).reduce((s, c) => s + c.count, 0);

  const profiles: CohortProfile[] = (
    Object.entries(cohortCounts) as [CohortCategory, { count: number; totalEngagement: number }][]
  ).map(([key, val]) => ({
    name: COHORT_META[key].name,
    description: COHORT_META[key].description,
    peakHours: COHORT_META[key].peakHours,
    contactCount: val.count,
    avgOpenRate: totalWithData > 0 ? val.totalEngagement / Math.max(val.count, 1) : 0,
  }));

  return {
    profiles,
    hourlyDistribution: normalize(globalHourly),
    dayOfWeekDistribution: normalize(globalDaily),
  };
}

// ─── 4. Smart Send Scheduling ───────────────────────────────────────────────

/**
 * Schedule a broadcast with per-contact optimal send times.
 * Spreads sends within a ±2 hour jitter window around each contact's best time.
 */
export async function scheduleSmart(
  userId: string,
  broadcastId: string
): Promise<ScheduleEntry[]> {
  const broadcast = await prisma.emailBroadcast.findFirst({
    where: { id: broadcastId, userId },
  });

  if (!broadcast) throw new Error(`Broadcast ${broadcastId} not found`);

  const tagFilter =
    broadcast.segmentTags.length > 0
      ? { hasSome: broadcast.segmentTags }
      : undefined;

  const contacts = await prisma.emailContact.findMany({
    where: {
      userId,
      status: "subscribed",
      ...(tagFilter ? { tags: tagFilter } : {}),
    },
    select: { email: true, properties: true, tags: true },
  });

  const schedule: ScheduleEntry[] = [];
  const now = new Date();

  for (const contact of contacts) {
    const optimal = await getOptimalSendTime(userId, contact.email);
    const props = parseProperties(contact.properties);
    const offset = getTimezoneOffset(props.timezone);

    // Calculate next occurrence of the optimal day/hour
    const targetDate = getNextOccurrence(optimal.dayOfWeek, optimal.hour, offset, now);

    // Apply jitter: ±2 hours, randomly distributed
    const jitterMinutes = Math.round((Math.random() * 240) - 120);
    targetDate.setMinutes(targetDate.getMinutes() + jitterMinutes);

    // Don't schedule in the past
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 7);
    }

    schedule.push({
      contactEmail: contact.email,
      scheduledAt: targetDate,
    });
  }

  // Sort by scheduled time
  schedule.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  return schedule;
}

/**
 * Find the next occurrence of a specific day-of-week and hour from a reference date.
 */
function getNextOccurrence(
  dayOfWeek: number,
  hour: number,
  utcOffsetHours: number,
  from: Date
): Date {
  const target = new Date(from);
  // Adjust hour for UTC offset
  const utcHour = ((hour - utcOffsetHours) % 24 + 24) % 24;
  target.setUTCHours(utcHour, 0, 0, 0);

  // Find the next matching day
  const currentDay = target.getUTCDay();
  let daysUntil = (dayOfWeek - currentDay + 7) % 7;
  if (daysUntil === 0 && target <= from) {
    daysUntil = 7;
  }
  target.setUTCDate(target.getUTCDate() + daysUntil);

  return target;
}

/**
 * Preview the send distribution for a smart schedule before committing.
 */
export async function getSmartSchedulePreview(
  userId: string,
  segmentRules?: { tags?: string[] }
): Promise<SchedulePreview> {
  const tagFilter =
    segmentRules?.tags && segmentRules.tags.length > 0
      ? { hasSome: segmentRules.tags }
      : undefined;

  const contacts = await prisma.emailContact.findMany({
    where: {
      userId,
      status: "subscribed",
      ...(tagFilter ? { tags: tagFilter } : {}),
    },
    select: { email: true, properties: true, tags: true },
  });

  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);

  for (const contact of contacts) {
    const optimal = await getOptimalSendTime(userId, contact.email);
    hourCounts[optimal.hour] += 1;
    dayCounts[optimal.dayOfWeek] += 1;
  }

  const hourlyBreakdown = hourCounts.map((count, hour) => ({ hour, count }));
  const dayBreakdown = dayCounts.map((count, day) => ({ day, count }));

  return {
    totalContacts: contacts.length,
    hourlyBreakdown,
    dayBreakdown,
    estimatedPeakLoad: Math.max(...hourCounts),
  };
}

// ─── 5. Time Zone Handling ──────────────────────────────────────────────────

/**
 * Estimate a contact's timezone from their engagement patterns.
 *
 * Strategy: Assume most people open emails during waking hours (7am-11pm local).
 * The median open hour in UTC, mapped against typical waking mid-point (~2pm local),
 * gives us an offset estimate.
 */
export async function estimateTimezone(contactEmail: string): Promise<string | null> {
  const contact = await prisma.emailContact.findFirst({
    where: { email: contactEmail },
    select: { id: true, properties: true },
  });

  if (!contact) return null;

  const props = parseProperties(contact.properties);
  const log = props.engagementLog ?? [];

  if (log.length < 5) return null; // Need enough data to infer

  // Get the weighted median engagement hour (UTC)
  const hourly = buildHourlyHistogram(log);
  const totalWeight = hourly.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return null;

  // Find the weighted median hour
  let cumulative = 0;
  let medianHour = 12;
  for (let h = 0; h < 24; h++) {
    cumulative += hourly[h];
    if (cumulative >= totalWeight / 2) {
      medianHour = h;
      break;
    }
  }

  // Assume median engagement should be around 14:00 (2pm) local time
  // offset = medianHour(UTC) - 14(local target)
  const estimatedOffset = medianHour - 14;

  // Find the closest known timezone
  let bestTz = "UTC";
  let bestDiff = Infinity;
  for (const [tz, off] of Object.entries(TIMEZONE_OFFSETS)) {
    const diff = Math.abs(off - estimatedOffset);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestTz = tz;
    }
  }

  // Store the estimated timezone
  await prisma.emailContact.update({
    where: { id: contact.id },
    data: {
      properties: JSON.parse(JSON.stringify({
        ...props,
        timezone: bestTz,
      })),
    },
  });

  return bestTz;
}

// ─── 6. Performance Analysis ────────────────────────────────────────────────

/**
 * Analyze send time performance across all broadcasts for a user.
 * Compares open/click rates by hour and day of week.
 */
export async function analyzeSendTimePerformance(
  userId: string
): Promise<TimePerformance[]> {
  const broadcasts = await prisma.emailBroadcast.findMany({
    where: { userId, sentAt: { not: null }, recipients: { gt: 0 } },
    select: { sentAt: true, recipients: true, opens: true, clicks: true },
  });

  // Group by (dayOfWeek, hour)
  const grid = new Map<string, { sent: number; opens: number; clicks: number }>();

  for (const b of broadcasts) {
    if (!b.sentAt) continue;
    const d = new Date(b.sentAt);
    const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
    const entry = grid.get(key) ?? { sent: 0, opens: 0, clicks: 0 };
    entry.sent += b.recipients;
    entry.opens += b.opens;
    entry.clicks += b.clicks;
    grid.set(key, entry);
  }

  const results: TimePerformance[] = [];
  for (const [key, val] of Array.from(grid.entries())) {
    const [day, hour] = key.split("-").map(Number);
    results.push({
      hour,
      day,
      openRate: val.sent > 0 ? val.opens / val.sent : 0,
      clickRate: val.sent > 0 ? val.clicks / val.sent : 0,
      totalSent: val.sent,
    });
  }

  // Sort by open rate descending
  results.sort((a, b) => b.openRate - a.openRate);
  return results;
}

/**
 * Get the top 3 and bottom 3 send times by open rate.
 * Requires a minimum of 10 recipients to be considered.
 */
export async function getBestWorstTimes(
  userId: string
): Promise<BestWorstTimes> {
  const all = await analyzeSendTimePerformance(userId);

  // Only consider time slots with meaningful volume
  const significant = all.filter((t) => t.totalSent >= 10);

  return {
    best: significant.slice(0, 3),
    worst: significant.slice(-3).reverse(),
  };
}

/**
 * Generate a 7×24 heatmap of engagement scores for the user's contact base.
 * Each cell represents a (day, hour) combination with a normalized score.
 */
export async function getEngagementHeatmap(
  userId: string
): Promise<HeatmapCell[]> {
  const contacts = await prisma.emailContact.findMany({
    where: { userId, status: "subscribed" },
    select: { properties: true },
  });

  // Build a 7×24 grid of opens and clicks
  const grid: { opens: number; clicks: number }[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ opens: 0, clicks: 0 }))
  );

  for (const contact of contacts) {
    const props = parseProperties(contact.properties);
    const log = props.engagementLog ?? [];

    for (const entry of log) {
      const d = new Date(entry.timestamp);
      if (isNaN(d.getTime())) continue;
      const day = d.getUTCDay();
      const hour = d.getUTCHours();
      if (entry.type === "open") grid[day][hour].opens += 1;
      if (entry.type === "click") grid[day][hour].clicks += 1;
    }
  }

  // Calculate engagement score (weighted: click=2, open=1) and normalize
  const cells: HeatmapCell[] = [];
  let maxScore = 0;

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const cell = grid[day][hour];
      const rawScore = cell.opens + cell.clicks * 2;
      if (rawScore > maxScore) maxScore = rawScore;
      cells.push({ day, hour, score: rawScore, opens: cell.opens, clicks: cell.clicks });
    }
  }

  // Normalize scores to 0-1
  if (maxScore > 0) {
    for (const cell of cells) {
      cell.score = cell.score / maxScore;
    }
  }

  return cells;
}
