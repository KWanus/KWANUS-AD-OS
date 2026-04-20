import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SegmentOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_set"
  | "is_not_set"
  | "in_list"
  | "not_in_list"
  | "before"
  | "after"
  | "between";

export type SegmentRule = {
  field: string;
  operator: SegmentOperator;
  value: unknown;
};

export type SegmentGroup = {
  logic: "and" | "or";
  rules: (SegmentRule | SegmentGroup)[];
};

export type SmartSegmentName =
  | "vip_customers"
  | "at_risk"
  | "new_subscribers"
  | "engaged_non_buyers"
  | "win_back"
  | "big_spenders"
  | "repeat_buyers"
  | "one_time_buyers"
  | "inactive"
  | "birthday_month";

type ContactProperties = {
  rfmScore?: number;
  clvTier?: string;
  churnRisk?: number;
  engagementScore?: number;
  lastOpenedAt?: string;
  lastClickedAt?: string;
  lastPurchasedAt?: string;
  birthday?: string;
  totalSpent?: number;
  orderCount?: number;
  [key: string]: unknown;
};

type ContactRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  tags: string[];
  properties: ContactProperties | null;
  status: string;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSegmentGroup(rule: SegmentRule | SegmentGroup): rule is SegmentGroup {
  return "logic" in rule && "rules" in rule;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  return new Date(String(v));
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  return Number(v);
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return [v];
  return [];
}

function getProp(contact: ContactRow, path: string): unknown {
  // Direct contact fields
  const directFields: Record<string, (c: ContactRow) => unknown> = {
    email: (c) => c.email,
    firstName: (c) => c.firstName,
    lastName: (c) => c.lastName,
    status: (c) => c.status,
    source: (c) => c.source,
    createdAt: (c) => c.createdAt,
    updatedAt: (c) => c.updatedAt,
  };

  if (directFields[path]) return directFields[path](contact);

  // Tags handled separately
  if (path === "tags") return contact.tags;

  // Properties path (e.g. "properties.rfmScore" or just "rfmScore")
  const propPath = path.startsWith("properties.") ? path.slice(11) : path;
  const props = (contact.properties ?? {}) as Record<string, unknown>;
  return props[propPath];
}

// ---------------------------------------------------------------------------
// Rule evaluation against a single contact
// ---------------------------------------------------------------------------

function evaluateOperator(fieldValue: unknown, operator: SegmentOperator, ruleValue: unknown): boolean {
  switch (operator) {
    case "is_set":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";

    case "is_not_set":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";

    case "equals":
      if (fieldValue instanceof Date) return fieldValue.getTime() === toDate(ruleValue).getTime();
      return String(fieldValue).toLowerCase() === String(ruleValue).toLowerCase();

    case "not_equals":
      if (fieldValue instanceof Date) return fieldValue.getTime() !== toDate(ruleValue).getTime();
      return String(fieldValue).toLowerCase() !== String(ruleValue).toLowerCase();

    case "contains":
      return String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());

    case "not_contains":
      return !String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());

    case "greater_than":
      return toNumber(fieldValue) > toNumber(ruleValue);

    case "less_than":
      return toNumber(fieldValue) < toNumber(ruleValue);

    case "in_list": {
      const list = toStringArray(ruleValue);
      return list.map((s) => s.toLowerCase()).includes(String(fieldValue).toLowerCase());
    }

    case "not_in_list": {
      const list = toStringArray(ruleValue);
      return !list.map((s) => s.toLowerCase()).includes(String(fieldValue).toLowerCase());
    }

    case "before":
      return toDate(fieldValue) < toDate(ruleValue);

    case "after":
      return toDate(fieldValue) > toDate(ruleValue);

    case "between": {
      const [start, end] = ruleValue as [unknown, unknown];
      const d = toDate(fieldValue);
      return d >= toDate(start) && d <= toDate(end);
    }

    default:
      return false;
  }
}

function evaluateTagRule(contact: ContactRow, operator: SegmentOperator, value: unknown): boolean {
  const tags = contact.tags.map((t) => t.toLowerCase());

  switch (operator) {
    case "equals": // has_tag
      return tags.includes(String(value).toLowerCase());

    case "not_equals": // doesnt_have_tag
      return !tags.includes(String(value).toLowerCase());

    case "in_list": // has_any_of_tags
      return toStringArray(value).some((v) => tags.includes(v.toLowerCase()));

    case "not_in_list": // has_none_of_tags
      return !toStringArray(value).some((v) => tags.includes(v.toLowerCase()));

    case "contains": // has_all_of_tags
      return toStringArray(value).every((v) => tags.includes(v.toLowerCase()));

    case "is_set":
      return tags.length > 0;

    case "is_not_set":
      return tags.length === 0;

    default:
      return false;
  }
}

function matchesRule(contact: ContactRow, rule: SegmentRule): boolean {
  if (rule.field === "tags") {
    return evaluateTagRule(contact, rule.operator, rule.value);
  }
  const fieldValue = getProp(contact, rule.field);
  return evaluateOperator(fieldValue, rule.operator, rule.value);
}

function matchesGroup(contact: ContactRow, group: SegmentGroup): boolean {
  if (group.logic === "and") {
    return group.rules.every((r) =>
      isSegmentGroup(r) ? matchesGroup(contact, r) : matchesRule(contact, r)
    );
  }
  return group.rules.some((r) =>
    isSegmentGroup(r) ? matchesGroup(contact, r) : matchesRule(contact, r)
  );
}

// ---------------------------------------------------------------------------
// Purchase data enrichment
// ---------------------------------------------------------------------------

type PurchaseSummary = {
  totalSpent: number;
  orderCount: number;
  lastPurchasedAt: Date | null;
  productIds: string[];
};

async function getPurchaseSummaries(
  emails: string[]
): Promise<Map<string, PurchaseSummary>> {
  if (emails.length === 0) return new Map();

  const orders = await prisma.siteOrder.findMany({
    where: {
      customerEmail: { in: emails },
      status: { not: "refunded" },
    },
    select: {
      customerEmail: true,
      amountCents: true,
      productId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const map = new Map<string, PurchaseSummary>();
  for (const o of orders) {
    const key = o.customerEmail.toLowerCase();
    const existing = map.get(key) ?? {
      totalSpent: 0,
      orderCount: 0,
      lastPurchasedAt: null,
      productIds: [],
    };
    existing.totalSpent += o.amountCents;
    existing.orderCount += 1;
    if (!existing.lastPurchasedAt || o.createdAt > existing.lastPurchasedAt) {
      existing.lastPurchasedAt = o.createdAt;
    }
    if (!existing.productIds.includes(o.productId)) {
      existing.productIds.push(o.productId);
    }
    map.set(key, existing);
  }
  return map;
}

// Check if rules reference purchase/behavioral fields that need enrichment
function needsPurchaseData(group: SegmentGroup): boolean {
  const purchaseFields = new Set([
    "totalSpent",
    "orderCount",
    "lastPurchasedAt",
    "purchasedProduct",
    "purchasedCategory",
    "neverPurchased",
    "properties.totalSpent",
    "properties.orderCount",
    "properties.lastPurchasedAt",
  ]);

  function check(rules: (SegmentRule | SegmentGroup)[]): boolean {
    return rules.some((r) => {
      if (isSegmentGroup(r)) return check(r.rules);
      return purchaseFields.has(r.field);
    });
  }
  return check(group.rules);
}

// ---------------------------------------------------------------------------
// Category lookup for product-based rules
// ---------------------------------------------------------------------------

async function getProductCategories(
  productIds: string[]
): Promise<Map<string, string>> {
  if (productIds.length === 0) return new Map();
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, category: true },
  });
  const map = new Map<string, string>();
  for (const p of products) {
    if (p.category) map.set(p.id, p.category);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Extended matching that includes purchase data
// ---------------------------------------------------------------------------

function matchesRuleWithPurchase(
  contact: ContactRow,
  rule: SegmentRule,
  purchase: PurchaseSummary | undefined,
  categoryMap: Map<string, string>
): boolean {
  const p = purchase ?? { totalSpent: 0, orderCount: 0, lastPurchasedAt: null, productIds: [] };

  switch (rule.field) {
    case "totalSpent":
    case "properties.totalSpent":
      return evaluateOperator(p.totalSpent / 100, rule.operator, rule.value);

    case "orderCount":
    case "properties.orderCount":
      return evaluateOperator(p.orderCount, rule.operator, rule.value);

    case "lastPurchasedAt":
    case "properties.lastPurchasedAt":
      if (!p.lastPurchasedAt) {
        return rule.operator === "is_not_set";
      }
      return evaluateOperator(p.lastPurchasedAt, rule.operator, rule.value);

    case "purchasedProduct":
      if (rule.operator === "equals") return p.productIds.includes(String(rule.value));
      if (rule.operator === "not_equals") return !p.productIds.includes(String(rule.value));
      if (rule.operator === "in_list") return toStringArray(rule.value).some((id) => p.productIds.includes(id));
      return false;

    case "purchasedCategory": {
      const cats = p.productIds.map((id) => categoryMap.get(id)).filter(Boolean) as string[];
      if (rule.operator === "equals") return cats.some((c) => c.toLowerCase() === String(rule.value).toLowerCase());
      if (rule.operator === "not_equals") return !cats.some((c) => c.toLowerCase() === String(rule.value).toLowerCase());
      return false;
    }

    case "neverPurchased":
      return p.orderCount === 0;

    default:
      return matchesRule(contact, rule);
  }
}

function matchesGroupWithPurchase(
  contact: ContactRow,
  group: SegmentGroup,
  purchase: PurchaseSummary | undefined,
  categoryMap: Map<string, string>
): boolean {
  const evaluate = (r: SegmentRule | SegmentGroup): boolean => {
    if (isSegmentGroup(r)) return matchesGroupWithPurchase(contact, r, purchase, categoryMap);
    return matchesRuleWithPurchase(contact, r, purchase, categoryMap);
  };

  return group.logic === "and"
    ? group.rules.every(evaluate)
    : group.rules.some(evaluate);
}

// ---------------------------------------------------------------------------
// Core evaluation
// ---------------------------------------------------------------------------

async function loadContacts(userId: string): Promise<ContactRow[]> {
  const contacts = await prisma.emailContact.findMany({
    where: { userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      tags: true,
      properties: true,
      status: true,
      source: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return contacts.map((c) => ({
    ...c,
    properties: (c.properties as ContactProperties) ?? null,
  }));
}

/**
 * Evaluate a segment definition and return matching contact IDs.
 */
export async function evaluateSegment(
  userId: string,
  rules: SegmentGroup
): Promise<string[]> {
  const contacts = await loadContacts(userId);
  if (contacts.length === 0) return [];

  if (needsPurchaseData(rules)) {
    const emails = contacts.map((c) => c.email);
    const purchaseMap = await getPurchaseSummaries(emails);

    // Collect all product IDs for category lookups
    const allProductIds = new Set<string>();
    for (const ps of purchaseMap.values()) {
      for (const pid of ps.productIds) allProductIds.add(pid);
    }
    const categoryMap = await getProductCategories([...allProductIds]);

    return contacts
      .filter((c) => matchesGroupWithPurchase(c, rules, purchaseMap.get(c.email.toLowerCase()), categoryMap))
      .map((c) => c.id);
  }

  return contacts.filter((c) => matchesGroup(c, rules)).map((c) => c.id);
}

/**
 * Count contacts matching a segment without loading all IDs into memory.
 * Uses the same evaluation logic but returns only the count.
 */
export async function countSegment(
  userId: string,
  rules: SegmentGroup
): Promise<number> {
  // For simple property/status filters we can push down to SQL
  if (canUseSqlShortcut(rules)) {
    const where = buildPrismaWhere(userId, rules);
    if (where) {
      return prisma.emailContact.count({ where });
    }
  }

  const ids = await evaluateSegment(userId, rules);
  return ids.length;
}

/**
 * Preview the first N contacts matching a segment.
 */
export async function previewSegment(
  userId: string,
  rules: SegmentGroup,
  limit = 25
): Promise<{
  total: number;
  contacts: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    tags: string[];
    status: string;
  }>;
}> {
  const contacts = await loadContacts(userId);
  if (contacts.length === 0) return { total: 0, contacts: [] };

  let matched: ContactRow[];

  if (needsPurchaseData(rules)) {
    const emails = contacts.map((c) => c.email);
    const purchaseMap = await getPurchaseSummaries(emails);
    const allProductIds = new Set<string>();
    for (const ps of purchaseMap.values()) {
      for (const pid of ps.productIds) allProductIds.add(pid);
    }
    const categoryMap = await getProductCategories([...allProductIds]);
    matched = contacts.filter((c) =>
      matchesGroupWithPurchase(c, rules, purchaseMap.get(c.email.toLowerCase()), categoryMap)
    );
  } else {
    matched = contacts.filter((c) => matchesGroup(c, rules));
  }

  return {
    total: matched.length,
    contacts: matched.slice(0, limit).map((c) => ({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      tags: c.tags,
      status: c.status,
    })),
  };
}

// ---------------------------------------------------------------------------
// SQL shortcut for simple segments (count optimization)
// ---------------------------------------------------------------------------

type PrismaContactWhere = Prisma.EmailContactWhereInput;

function canUseSqlShortcut(group: SegmentGroup): boolean {
  if (group.logic !== "and") return false;
  return group.rules.every((r) => {
    if (isSegmentGroup(r)) return false;
    return ["email", "firstName", "lastName", "status", "source", "createdAt"].includes(r.field);
  });
}

function buildPrismaWhere(userId: string, group: SegmentGroup): PrismaContactWhere | null {
  const where: PrismaContactWhere = { userId };
  for (const r of group.rules) {
    if (isSegmentGroup(r)) return null;
    const clause = ruleToPrisma(r);
    if (!clause) return null;
    Object.assign(where, clause);
  }
  return where;
}

function ruleToPrisma(rule: SegmentRule): PrismaContactWhere | null {
  const { field, operator, value } = rule;
  switch (operator) {
    case "equals":
      return { [field]: String(value) };
    case "not_equals":
      return { [field]: { not: String(value) } };
    case "contains":
      return { [field]: { contains: String(value), mode: "insensitive" as const } };
    case "not_contains":
      return { NOT: { [field]: { contains: String(value), mode: "insensitive" as const } } };
    case "before":
      return { [field]: { lt: toDate(value) } };
    case "after":
      return { [field]: { gt: toDate(value) } };
    case "is_set":
      return { [field]: { not: null } };
    case "is_not_set":
      return { [field]: null };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Smart Segments (Pre-built)
// ---------------------------------------------------------------------------

async function smartVipCustomers(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  if (contacts.length === 0) return [];

  const emails = contacts.map((c) => c.email);
  const purchaseMap = await getPurchaseSummaries(emails);

  // Rank by total spent, take top 10%
  const ranked = contacts
    .map((c) => ({
      id: c.id,
      spent: (purchaseMap.get(c.email.toLowerCase())?.totalSpent ?? 0) / 100,
    }))
    .filter((r) => r.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const cutoff = Math.max(1, Math.ceil(ranked.length * 0.1));
  return ranked.slice(0, cutoff).map((r) => r.id);
}

async function smartAtRisk(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const emails = contacts.map((c) => c.email);
  const purchaseMap = await getPurchaseSummaries(emails);
  const threshold = daysAgo(60);

  return contacts
    .filter((c) => {
      const p = purchaseMap.get(c.email.toLowerCase());
      if (!p || p.orderCount === 0) return false;
      return !p.lastPurchasedAt || p.lastPurchasedAt < threshold;
    })
    .map((c) => c.id);
}

async function smartNewSubscribers(userId: string): Promise<string[]> {
  const sevenDaysAgo = daysAgo(7);
  const contacts = await prisma.emailContact.findMany({
    where: { userId, createdAt: { gte: sevenDaysAgo } },
    select: { id: true },
  });
  return contacts.map((c) => c.id);
}

async function smartEngagedNonBuyers(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const emails = contacts.map((c) => c.email);
  const purchaseMap = await getPurchaseSummaries(emails);

  return contacts
    .filter((c) => {
      const props = c.properties;
      const hasEngagement =
        props?.lastOpenedAt || (props?.engagementScore && props.engagementScore > 0);
      const hasPurchase = (purchaseMap.get(c.email.toLowerCase())?.orderCount ?? 0) > 0;
      return hasEngagement && !hasPurchase;
    })
    .map((c) => c.id);
}

async function smartWinBack(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const emails = contacts.map((c) => c.email);
  const purchaseMap = await getPurchaseSummaries(emails);
  const threshold = daysAgo(90);

  return contacts
    .filter((c) => {
      const p = purchaseMap.get(c.email.toLowerCase());
      if (!p || p.orderCount === 0) return false;
      return !p.lastPurchasedAt || p.lastPurchasedAt < threshold;
    })
    .map((c) => c.id);
}

async function smartBigSpenders(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const emails = contacts.map((c) => c.email);
  const purchaseMap = await getPurchaseSummaries(emails);

  // Calculate average order value across all contacts with purchases
  let totalSpent = 0;
  let buyerCount = 0;
  for (const p of purchaseMap.values()) {
    if (p.orderCount > 0) {
      totalSpent += p.totalSpent;
      buyerCount++;
    }
  }

  if (buyerCount === 0) return [];
  const avgSpent = totalSpent / buyerCount;
  const threshold = avgSpent * 2;

  return contacts
    .filter((c) => {
      const p = purchaseMap.get(c.email.toLowerCase());
      return p && p.totalSpent >= threshold;
    })
    .map((c) => c.id);
}

async function smartRepeatBuyers(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const emails = contacts.map((c) => c.email);
  const purchaseMap = await getPurchaseSummaries(emails);

  return contacts
    .filter((c) => (purchaseMap.get(c.email.toLowerCase())?.orderCount ?? 0) >= 2)
    .map((c) => c.id);
}

async function smartOneTimeBuyers(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const emails = contacts.map((c) => c.email);
  const purchaseMap = await getPurchaseSummaries(emails);

  return contacts
    .filter((c) => (purchaseMap.get(c.email.toLowerCase())?.orderCount ?? 0) === 1)
    .map((c) => c.id);
}

async function smartInactive(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const threshold = daysAgo(90);

  return contacts
    .filter((c) => {
      const lastOpened = c.properties?.lastOpenedAt;
      if (!lastOpened) return true; // never opened = inactive
      return new Date(lastOpened) < threshold;
    })
    .map((c) => c.id);
}

async function smartBirthdayMonth(userId: string): Promise<string[]> {
  const contacts = await loadContacts(userId);
  const currentMonth = new Date().getMonth(); // 0-indexed

  return contacts
    .filter((c) => {
      const birthday = c.properties?.birthday;
      if (!birthday) return false;
      const bMonth = new Date(birthday).getMonth();
      return bMonth === currentMonth;
    })
    .map((c) => c.id);
}

const smartSegmentHandlers: Record<SmartSegmentName, (userId: string) => Promise<string[]>> = {
  vip_customers: smartVipCustomers,
  at_risk: smartAtRisk,
  new_subscribers: smartNewSubscribers,
  engaged_non_buyers: smartEngagedNonBuyers,
  win_back: smartWinBack,
  big_spenders: smartBigSpenders,
  repeat_buyers: smartRepeatBuyers,
  one_time_buyers: smartOneTimeBuyers,
  inactive: smartInactive,
  birthday_month: smartBirthdayMonth,
};

/**
 * Get contact IDs matching a pre-built smart segment.
 */
export async function getSmartSegment(
  userId: string,
  segmentName: SmartSegmentName
): Promise<string[]> {
  const handler = smartSegmentHandlers[segmentName];
  if (!handler) {
    throw new Error(`Unknown smart segment: ${segmentName}`);
  }
  return handler(userId);
}

/**
 * List all available smart segment definitions with descriptions.
 */
export function listSmartSegments(): Array<{ name: SmartSegmentName; description: string }> {
  return [
    { name: "vip_customers", description: "Top 10% of customers by total spend" },
    { name: "at_risk", description: "Purchased before but not in the last 60 days" },
    { name: "new_subscribers", description: "Joined in the last 7 days" },
    { name: "engaged_non_buyers", description: "Opens emails but has never purchased" },
    { name: "win_back", description: "Last purchase was 90+ days ago" },
    { name: "big_spenders", description: "Total spend exceeds 2x the average customer" },
    { name: "repeat_buyers", description: "Customers with 2 or more orders" },
    { name: "one_time_buyers", description: "Customers with exactly 1 order" },
    { name: "inactive", description: "No email opens in the last 90 days" },
    { name: "birthday_month", description: "Contacts whose birthday is this month" },
  ];
}

// ---------------------------------------------------------------------------
// Convenience builders for common rules
// ---------------------------------------------------------------------------

export const SegmentBuilder = {
  /** Create a rule group with AND logic */
  and(...rules: (SegmentRule | SegmentGroup)[]): SegmentGroup {
    return { logic: "and", rules };
  },

  /** Create a rule group with OR logic */
  or(...rules: (SegmentRule | SegmentGroup)[]): SegmentGroup {
    return { logic: "or", rules };
  },

  /** Property-based rules */
  emailContains(value: string): SegmentRule {
    return { field: "email", operator: "contains", value };
  },
  nameStartsWith(value: string): SegmentRule {
    return { field: "firstName", operator: "contains", value };
  },
  sourceEquals(value: string): SegmentRule {
    return { field: "source", operator: "equals", value };
  },
  statusIs(value: string): SegmentRule {
    return { field: "status", operator: "equals", value };
  },

  /** Behavioral rules */
  openedInLastDays(days: number): SegmentRule {
    return { field: "lastOpenedAt", operator: "after", value: daysAgo(days).toISOString() };
  },
  clickedInLastDays(days: number): SegmentRule {
    return { field: "lastClickedAt", operator: "after", value: daysAgo(days).toISOString() };
  },
  purchasedInLastDays(days: number): SegmentRule {
    return { field: "lastPurchasedAt", operator: "after", value: daysAgo(days).toISOString() };
  },
  neverPurchased(): SegmentRule {
    return { field: "neverPurchased", operator: "equals", value: true };
  },

  /** Purchase-based rules */
  totalSpentGreaterThan(amountDollars: number): SegmentRule {
    return { field: "totalSpent", operator: "greater_than", value: amountDollars };
  },
  orderCountGreaterThan(count: number): SegmentRule {
    return { field: "orderCount", operator: "greater_than", value: count };
  },
  boughtProduct(productId: string): SegmentRule {
    return { field: "purchasedProduct", operator: "equals", value: productId };
  },
  boughtInCategory(category: string): SegmentRule {
    return { field: "purchasedCategory", operator: "equals", value: category };
  },

  /** RFM-based rules */
  rfmScoreAbove(score: number): SegmentRule {
    return { field: "rfmScore", operator: "greater_than", value: score };
  },
  clvTierEquals(tier: string): SegmentRule {
    return { field: "clvTier", operator: "equals", value: tier };
  },
  churnRiskAbove(risk: number): SegmentRule {
    return { field: "churnRisk", operator: "greater_than", value: risk };
  },

  /** Tag-based rules */
  hasTag(tag: string): SegmentRule {
    return { field: "tags", operator: "equals", value: tag };
  },
  doesntHaveTag(tag: string): SegmentRule {
    return { field: "tags", operator: "not_equals", value: tag };
  },
  hasAnyOfTags(tags: string[]): SegmentRule {
    return { field: "tags", operator: "in_list", value: tags };
  },
  hasAllOfTags(tags: string[]): SegmentRule {
    return { field: "tags", operator: "contains", value: tags };
  },

  /** Date-based rules */
  createdBefore(date: Date | string): SegmentRule {
    return { field: "createdAt", operator: "before", value: date instanceof Date ? date.toISOString() : date };
  },
  createdAfter(date: Date | string): SegmentRule {
    return { field: "createdAt", operator: "after", value: date instanceof Date ? date.toISOString() : date };
  },
  lastPurchaseBefore(date: Date | string): SegmentRule {
    return { field: "lastPurchasedAt", operator: "before", value: date instanceof Date ? date.toISOString() : date };
  },
  lastPurchaseAfter(date: Date | string): SegmentRule {
    return { field: "lastPurchasedAt", operator: "after", value: date instanceof Date ? date.toISOString() : date };
  },

  /** Engagement rules */
  engagementScoreAbove(score: number): SegmentRule {
    return { field: "engagementScore", operator: "greater_than", value: score };
  },
  engagementScoreBelow(score: number): SegmentRule {
    return { field: "engagementScore", operator: "less_than", value: score };
  },
};
