/**
 * ALL WEBSITE TEMPLATES - MASTER FILE
 *
 * Combines:
 * - 13 Proven Templates (hand-crafted with real data)
 * - 100 Standard Templates (industry baseline)
 * - 100 Improved Templates (optimized versions)
 *
 * Total: 213 Templates
 */

import { ALL_WEBSITE_TEMPLATES as PROVEN_TEMPLATES } from "./provenWebsiteTemplates";
import { ALL_STANDARD_TEMPLATES, STANDARD_TEMPLATES_COUNT } from "./standardWebsiteTemplates";
import { ALL_IMPROVED_TEMPLATES, IMPROVED_TEMPLATES_COUNT } from "./improvedWebsiteTemplates";

export const ALL_TEMPLATES = [
  ...PROVEN_TEMPLATES,
  ...STANDARD_TEMPLATES,
  ...IMPROVED_TEMPLATES,
];

export const TEMPLATE_STATS = {
  proven: PROVEN_TEMPLATES.length,
  standard: STANDARD_TEMPLATES_COUNT,
  improved: IMPROVED_TEMPLATES_COUNT,
  total: PROVEN_TEMPLATES.length + STANDARD_TEMPLATES_COUNT + IMPROVED_TEMPLATES_COUNT,
};

// Category counts
export const CATEGORY_COUNTS = {
  all: ALL_TEMPLATES.length,
  ecommerce: ALL_TEMPLATES.filter(t => t.category === "ecommerce").length,
  saas: ALL_TEMPLATES.filter(t => t.category === "saas").length,
  "local-service": ALL_TEMPLATES.filter(t => t.category === "local-service").length,
  consultant: ALL_TEMPLATES.filter(t => t.category === "consultant").length,
  agency: ALL_TEMPLATES.filter(t => t.category === "agency").length,
  "high-converting": ALL_TEMPLATES.filter(t => t.avgConversionRate >= 4.0).length,
};

// Filter templates by tier
export const TEMPLATES_BY_TIER = {
  proven: PROVEN_TEMPLATES,
  standard: ALL_STANDARD_TEMPLATES,
  improved: ALL_IMPROVED_TEMPLATES,
};

// Filter templates by category
export const TEMPLATES_BY_CATEGORY = {
  ecommerce: ALL_TEMPLATES.filter(t => t.category === "ecommerce"),
  saas: ALL_TEMPLATES.filter(t => t.category === "saas"),
  "local-service": ALL_TEMPLATES.filter(t => t.category === "local-service"),
  consultant: ALL_TEMPLATES.filter(t => t.category === "consultant"),
  agency: ALL_TEMPLATES.filter(t => t.category === "agency"),
};

// Quick filters
export const QUICK_FILTERS = {
  topPerformers: ALL_TEMPLATES.filter(t => t.avgConversionRate >= 4.0),
  mobileFriendly: ALL_TEMPLATES.filter(t => t.mobileOptimization.mobileConversionRate >= 3.0),
  fastLoading: ALL_TEMPLATES.filter(t => t.mobileOptimization.coreTechScore >= 90),
  beginnerFriendly: ALL_TEMPLATES.filter(t => t.difficulty === "beginner"),
  proTemplates: ALL_TEMPLATES.filter(t => t.isPro),
};

console.log(`📊 Template Library Loaded: ${TEMPLATE_STATS.total} templates`);
console.log(`   ✅ Proven: ${TEMPLATE_STATS.proven}`);
console.log(`   📦 Standard: ${TEMPLATE_STATS.standard}`);
console.log(`   🚀 Improved: ${TEMPLATE_STATS.improved}`);
