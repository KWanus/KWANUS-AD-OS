export type CuratedOffer = {
  id: string;
  name: string;
  niche: string;
  nicheLabel: string;
  network: string;
  avgCommission: string;
  minBudget: number; // daily $ minimum
  platforms: string[];
  refundRisk: "low" | "medium" | "high";
  difficulty: "beginner" | "intermediate";
  tagline: string;
  whatYouSell: string;
  whoBuysIt: string;
  provenHook: string;
  ctaCopy: string;
  networkUrl: string;
  avgEpc: string;
};

export const CURATED_OFFERS: CuratedOffer[] = [
  // ── HEALTH / WEIGHT LOSS ──
  {
    id: "legendary-marketer",
    name: "Legendary Marketer",
    niche: "mmo",
    nicheLabel: "Make Money Online",
    network: "Direct (LegendaryMarketer.com)",
    avgCommission: "$1–$1,000/sale (scales with backend)",
    minBudget: 10,
    platforms: ["TikTok", "Facebook"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "The easiest $7 front-end in affiliate marketing",
    whatYouSell: "A $7 online business training challenge that pays backend commissions up to $1,000",
    whoBuysIt: "People 25–45 who want to make money online but don't know where to start",
    provenHook: "I spent $7 and learned more about making money online than 3 years of YouTube tutorials",
    ctaCopy: "Start With $7 — No Experience Needed",
    networkUrl: "https://www.legendarymarketer.com/affiliate-program/",
    avgEpc: "$2.50–$4.00",
  },
  {
    id: "java-burn",
    name: "Java Burn",
    niche: "health",
    nicheLabel: "Health & Weight Loss",
    network: "ClickBank (JAVABURN)",
    avgCommission: "$38–$45/sale (40% commission)",
    minBudget: 20,
    platforms: ["Facebook", "TikTok"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "Add this to your morning coffee. That's it.",
    whatYouSell: "A supplement packet people add to their coffee — claims to boost metabolism",
    whoBuysIt: "Women 35–55 who drink coffee daily and want to lose weight without major lifestyle changes",
    provenHook: "I switched from regular coffee to THIS and nothing else changed — no diet, no gym — just this",
    ctaCopy: "I Want to Lose Weight Without Changing My Routine",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$2.50–$4.00",
  },
  {
    id: "ikaria-lean-belly-juice",
    name: "Ikaria Lean Belly Juice",
    niche: "health",
    nicheLabel: "Health & Weight Loss",
    network: "ClickBank",
    avgCommission: "~$55–$104/sale (40–75% on $138 avg order)",
    minBudget: 30,
    platforms: ["Facebook", "YouTube"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "Highest EPC in health on ClickBank 2023–2025",
    whatYouSell: "A weight loss juice powder with scientific-sounding mechanism (ceramide theory)",
    whoBuysIt: "Men and women 40–65 frustrated with stubborn belly fat who have tried other things",
    provenHook: "New research links this compound to stubborn belly fat — and it has nothing to do with diet or exercise",
    ctaCopy: "Show Me How This Works",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$3.00–$5.50",
  },
  {
    id: "puravive",
    name: "Puravive",
    niche: "health",
    nicheLabel: "Health & Weight Loss",
    network: "ClickBank",
    avgCommission: "~$85–$120/sale (65–75% on $130–$160 AOV)",
    minBudget: 20,
    platforms: ["Facebook", "TikTok"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "The 'brown fat' angle that dominated TikTok in 2024",
    whatYouSell: "Weight loss capsules based on brown adipose tissue (BAT) science",
    whoBuysIt: "People 30–60 interested in metabolism science, frustrated with conventional diet advice",
    provenHook: "Scientists discover why thin people stay thin — it's not metabolism, it's THIS hidden switch",
    ctaCopy: "Activate My Fat-Burning Switch",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$2.80–$4.50",
  },
  // ── RELATIONSHIPS ──
  {
    id: "his-secret-obsession",
    name: "His Secret Obsession",
    niche: "relationships",
    nicheLabel: "Relationships",
    network: "ClickBank (HISSECRET)",
    avgCommission: "~$35/sale (75% on $47)",
    minBudget: 15,
    platforms: ["Facebook", "Pinterest"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "Evergreen relationship offer — women 35–55 eat this up",
    whatYouSell: "A relationship psychology book about the 'hero instinct' that makes men devoted",
    whoBuysIt: "Single or recently separated women 30–55 who want to attract or keep a man",
    provenHook: "Psychologists call it the hero instinct — trigger this one thing and he becomes obsessed with you",
    ctaCopy: "Yes — Show Me the Hero Instinct",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$2.00–$3.50",
  },
  {
    id: "ex-factor-guide",
    name: "The Ex Factor Guide",
    niche: "relationships",
    nicheLabel: "Relationships",
    network: "ClickBank (EXFACTOR)",
    avgCommission: "~$35/sale (75% on $47)",
    minBudget: 10,
    platforms: ["Facebook", "TikTok"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "Breakup pain = highly motivated buyer. Fast-converting.",
    whatYouSell: "A guide on how to get your ex back using psychological principles",
    whoBuysIt: "Recently broken-up adults 20–45 who want their ex back and are in emotional distress",
    provenHook: "Before you send that text — there's a specific sequence that makes exes come back. Most people do the opposite.",
    ctaCopy: "Show Me the Sequence That Works",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$2.10–$3.20",
  },
  // ── DIY / HOME ──
  {
    id: "teds-woodworking",
    name: "Ted's Woodworking",
    niche: "diy",
    nicheLabel: "DIY & Home",
    network: "ClickBank (TEDSPLANS)",
    avgCommission: "~$50/sale (75% on $67) + upsells",
    minBudget: 10,
    platforms: ["Facebook", "Pinterest"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "ClickBank's longest-running offer. Cheap audience. Easy targeting.",
    whatYouSell: "16,000 woodworking plans for DIY hobbyists of all skill levels",
    whoBuysIt: "Men 45–65 who do DIY and woodworking as a hobby. Very cheap to target on Facebook.",
    provenHook: "My dad has been woodworking for 40 years. When I showed him these 16,000 plans, he said he'd never seen anything like it.",
    ctaCopy: "Get 16,000 Woodworking Plans",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$2.00–$3.00",
  },
  // ── BEAUTY / SKIN ──
  {
    id: "hydrossential",
    name: "Hydrossential",
    niche: "beauty",
    nicheLabel: "Beauty & Skin",
    network: "ClickBank",
    avgCommission: "~$85–$120/sale (65–75% on $130–$160 AOV)",
    minBudget: 20,
    platforms: ["Facebook", "TikTok"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "Anti-aging VSL that converts. Before/after creative writes itself.",
    whatYouSell: "A skin serum positioned as an 'at-home facelift' for women 40+",
    whoBuysIt: "Women 35–65 concerned about aging skin, looking for non-surgical solutions",
    provenHook: "I stopped wearing foundation. Not because I don't need it — because after 30 days of this, I genuinely don't need it anymore.",
    ctaCopy: "Show Me the At-Home Facelift",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$2.50–$4.00",
  },
  {
    id: "neotonics",
    name: "Neotonics (Skin + Gut)",
    niche: "beauty",
    nicheLabel: "Beauty & Skin",
    network: "ClickBank",
    avgCommission: "~$91–$105/sale (65–75% on ~$140 AOV)",
    minBudget: 20,
    platforms: ["Facebook", "TikTok"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "Gut-skin connection is a trending angle that sounds scientific and new",
    whatYouSell: "Gummies that improve skin by improving gut health — dual problem/solution",
    whoBuysIt: "Women 30–55 dealing with skin issues who are also health-conscious",
    provenHook: "Scientists just found that bad skin isn't a skin problem — it's a gut problem. This changes everything.",
    ctaCopy: "Fix My Skin From the Inside",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$3.00–$5.00",
  },
  // ── SURVIVAL / SELF-RELIANCE ──
  {
    id: "4patriots",
    name: "4Patriots Solar Generator",
    niche: "survival",
    nicheLabel: "Survival & Self-Reliance",
    network: "4Patriots Direct Affiliate",
    avgCommission: "$30–$225/sale (10–15% on $300–$1,500 orders)",
    minBudget: 25,
    platforms: ["Facebook", "YouTube"],
    refundRisk: "low",
    difficulty: "intermediate",
    tagline: "Highest EPC in survival. High-ticket, pre-sold by fear.",
    whatYouSell: "Solar-powered generators for grid-down emergency preparedness",
    whoBuysIt: "Men 45–65, patriot/conservative identity, worried about power outages and grid reliability",
    provenHook: "When the power went out for 11 days, my neighbors were in the dark. I wasn't. Here's the one thing I did differently.",
    ctaCopy: "I Want to Be Prepared",
    networkUrl: "https://www.4patriots.com/pages/affiliate",
    avgEpc: "$3.00–$8.00",
  },
  {
    id: "the-lost-ways",
    name: "The Lost Ways",
    niche: "survival",
    nicheLabel: "Survival & Self-Reliance",
    network: "ClickBank (LOSTWAYS)",
    avgCommission: "~$27/sale (75% on $37)",
    minBudget: 10,
    platforms: ["Facebook", "Pinterest"],
    refundRisk: "low",
    difficulty: "beginner",
    tagline: "Nostalgia + self-reliance converts across homesteaders and preppers",
    whatYouSell: "A book of lost survival skills from previous generations",
    whoBuysIt: "Adults 40–65 interested in self-reliance, homesteading, preparedness — broad reach",
    provenHook: "Our great-grandparents knew how to survive anything. We've forgotten everything. This book is changing that.",
    ctaCopy: "Learn the Lost Skills",
    networkUrl: "https://www.clickbank.com/",
    avgEpc: "$2.00–$3.00",
  },
];

export const NICHES = [
  { id: "health", label: "Health & Weight Loss", icon: "💊" },
  { id: "mmo", label: "Make Money Online", icon: "💰" },
  { id: "relationships", label: "Relationships", icon: "❤️" },
  { id: "diy", label: "DIY & Home", icon: "🔨" },
  { id: "beauty", label: "Beauty & Skin", icon: "✨" },
  { id: "survival", label: "Survival & Self-Reliance", icon: "🔦" },
] as const;

export type NicheId = typeof NICHES[number]["id"];

export function getOffersForNiche(niche: NicheId): CuratedOffer[] {
  return CURATED_OFFERS.filter((o) => o.niche === niche);
}

export function getOfferById(id: string): CuratedOffer | undefined {
  return CURATED_OFFERS.find((o) => o.id === id);
}

export function getRecommendedOffer(niche: NicheId, dailyBudget: number): CuratedOffer {
  const offers = getOffersForNiche(niche);
  const affordable = offers.filter((o) => o.minBudget <= dailyBudget);
  const beginnerFirst = affordable.sort((a, b) =>
    a.difficulty === "beginner" ? -1 : b.difficulty === "beginner" ? 1 : 0
  );
  return beginnerFirst[0] ?? offers[0];
}
