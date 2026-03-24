// Curated Beginner Dropshipping Product Library
// Powers the KWANUS AD OS Operator Mode product recommendation engine.
// Each product has been validated against the platform's scoring criteria from
// docs/system/research-dropship-mode.md and research-product-library.md.

export type ProductEntry = {
  id: string;
  name: string;
  niche: Niche;
  searchTermCJ: string; // Exact search string for CJ Dropshipping / AliExpress
  description: string;
  pricing: {
    sellingPriceMin: number;
    sellingPriceMax: number;
    sellingPriceRecommended: number;
    cogsMin: number;
    cogsMax: number;
    cogsRecommended: number;
    grossMarginAtRecommended: number; // after COGS + ~$3.50 shipping
    markupMin: number;
    markupMax: number;
  };
  shipping: {
    estimatedDaysMin: number;
    estimatedDaysMax: number;
    carrier: string;
    notes: string;
  };
  marketing: {
    bestPlatform: Platform[];
    bestAngle: string;
    primaryHook: string;
    whyItWorksForBeginners: string;
    startingBudgetPerDay: number; // USD
    audienceSummary: string;
    creativeAnglesAvailable: string[]; // 3–6 angles for creative runway
  };
  beginnerScore: number; // 0–10, higher = more beginner-friendly
  warnings: string[]; // compliance, sizing, shipping flags
  bundleSuggestion?: string; // product ID to bundle with for higher AOV
};

export type Niche =
  | "home-kitchen"
  | "pet"
  | "health-wellness"
  | "beauty-grooming"
  | "fitness-posture"
  | "outdoor-survival";

export type Platform = "tiktok" | "facebook" | "youtube" | "pinterest";

export const PRODUCT_LIBRARY: ProductEntry[] = [
  // ─── NICHE 1: HOME / KITCHEN ───────────────────────────────────────────────

  {
    id: "hk-001",
    name: "Adjustable Pot Lid Organizer",
    niche: "home-kitchen",
    searchTermCJ: "expandable pot lid rack organizer kitchen cabinet",
    description:
      "Expandable wire rack that mounts inside cabinet doors or stands on counter. Holds 5–8 pot and pan lids upright. Adjustable width, no tools required. Available in chrome and matte black.",
    pricing: {
      sellingPriceMin: 29.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 32.99,
      cogsMin: 5.5,
      cogsMax: 7.0,
      cogsRecommended: 6.5,
      grossMarginAtRecommended: 25.0,
      markupMin: 4.3,
      markupMax: 5.4,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Lightweight, low breakage risk. CJPacket Ordinary available on select SKUs.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Kitchen organization hack — position as a life hack, not a product. Viewer thinks they're watching a tips video; product is the answer.",
      primaryHook:
        "POV: You open your cabinet and THIS happens every time… [cabinet avalanche of lids] — I fixed it for $30",
      whyItWorksForBeginners:
        "The before state (drawer of clanging lids, cabinet chaos) films itself in 3 seconds. The after state (every lid standing perfectly) is the wow moment. No explanation needed. Beginner can film in their own kitchen. Zero sizing issues. Zero assembly.",
      startingBudgetPerDay: 20,
      audienceSummary: "Home owners and renters 25–50 who cook. Women skew higher. Kitchen/home organization interests.",
      creativeAnglesAvailable: [
        "Chaos-to-calm transformation",
        "Satisfying ASMR organization",
        "Life hack framing",
        "Rental-friendly (no drilling)",
        "Gift for mom/wife angle",
      ],
    },
    beginnerScore: 9.0,
    warnings: [],
  },

  {
    id: "hk-002",
    name: "Silicone Stretch Wrap Lids (Set of 6)",
    niche: "home-kitchen",
    searchTermCJ: "silicone stretch lid set food cover wrap reusable BPA free",
    description:
      "Set of 6 silicone lids in graduated sizes that stretch to seal any bowl, pot, can, or container. Replaces plastic wrap. BPA-free, dishwasher safe, bright-colored.",
    pricing: {
      sellingPriceMin: 24.99,
      sellingPriceMax: 32.99,
      sellingPriceRecommended: 27.99,
      cogsMin: 4.0,
      cogsMax: 6.0,
      cogsRecommended: 5.0,
      grossMarginAtRecommended: 21.0,
      markupMin: 4.5,
      markupMax: 6.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Lightweight. No breakage risk. Flat/soft packaging.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Environmental sustainability: 'I haven't bought plastic wrap in 6 months.' OR satisfying slow-motion stretch demo.",
      primaryHook:
        "Stop buying plastic wrap. I switched to this 6 months ago and I'm never going back — watch this",
      whyItWorksForBeginners:
        "The demonstration is purely satisfying — stretching over an odd-shaped bowl grips instantly. Six-piece set adds perceived value. Zero support issues. Film it in 30 seconds on your countertop.",
      startingBudgetPerDay: 20,
      audienceSummary: "Home cooks, eco-conscious buyers, 22–45. Kitchen/sustainable living interest stack.",
      creativeAnglesAvailable: [
        "Eco/sustainability angle",
        "Satisfying stretch demo",
        "Money-saving (vs. plastic wrap cost)",
        "Oddly-shaped container problem solver",
        "Gift for a cook",
      ],
    },
    beginnerScore: 8.0,
    warnings: ["Lower selling price compresses margin slightly — target $27.99+ minimum."],
  },

  {
    id: "hk-003",
    name: "Magnetic Fridge Spice Rack (Set of 6–12)",
    niche: "home-kitchen",
    searchTermCJ: "magnetic spice rack refrigerator mount stainless organizer tins",
    description:
      "Set of 6–12 round magnetic spice tins that stick to fridge, range hood, or any magnetic surface. Stainless steel finish. Includes label set. Multiple sizes available.",
    pricing: {
      sellingPriceMin: 34.99,
      sellingPriceMax: 44.99,
      sellingPriceRecommended: 39.99,
      cogsMin: 7.0,
      cogsMax: 10.0,
      cogsRecommended: 8.5,
      grossMarginAtRecommended: 28.0,
      markupMin: 3.5,
      markupMax: 5.0,
    },
    shipping: {
      estimatedDaysMin: 8,
      estimatedDaysMax: 12,
      carrier: "CJ Dropshipping Standard",
      notes: "Moderate weight on larger sets. Verify weight class before ordering. Stick to 6-tin starter set for safest margin.",
    },
    marketing: {
      bestPlatform: ["tiktok", "pinterest", "facebook"],
      bestAngle:
        "Rental-friendly kitchen makeover: no holes, no tools, fully reversible. Massive audience of renters who cannot modify walls.",
      primaryHook:
        "Renters: you CAN have a beautiful kitchen. No holes, no damage, fully reversible — under $40",
      whyItWorksForBeginners:
        "Clear transformation — messy drawer to magnetic wall display. The reveal shot is inherently shareable. Multiple price points possible (6-pack starter, 12-pack full set) for upsell.",
      startingBudgetPerDay: 25,
      audienceSummary: "Renters and homeowners 28–50. Home decor, kitchen organization, apartment living interests.",
      creativeAnglesAvailable: [
        "Renter-friendly kitchen makeover",
        "Before/after reveal",
        "Aesthetic kitchen upgrade",
        "Gift for a home cook",
        "Organization satisfying content",
      ],
    },
    beginnerScore: 7.5,
    warnings: ["Heavier sets increase shipping cost — verify COGS at larger pack sizes before listing."],
  },

  // ─── NICHE 2: PET PRODUCTS ─────────────────────────────────────────────────

  {
    id: "pet-001",
    name: "Slow Feeder Dog Bowl (Maze/Puzzle)",
    niche: "pet",
    searchTermCJ: "slow feeder dog bowl puzzle anti-choke suction cup silicone",
    description:
      "Maze-patterned silicone or hard plastic dog bowl that slows eating by 10x. Suction cup base prevents sliding. Multiple sizes. Dishwasher safe. Lick mat variant also available.",
    pricing: {
      sellingPriceMin: 22.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 27.99,
      cogsMin: 3.5,
      cogsMax: 6.0,
      cogsRecommended: 5.0,
      grossMarginAtRecommended: 22.0,
      markupMin: 5.0,
      markupMax: 6.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Lightweight. Durable. Zero breakage risk.",
    },
    marketing: {
      bestPlatform: ["facebook", "tiktok"],
      bestAngle:
        "Fear/guilt: Did you know eating too fast can cause bloat, which can be fatal in large dogs? This bowl could save your dog's life.",
      primaryHook:
        "Vet told me my dog could get bloat from eating too fast. This $25 bowl fixed it immediately.",
      whyItWorksForBeginners:
        "Dog owners are the most emotionally invested buyers on the internet. The health benefit (bloat prevention) adds guilt. Film with any dog on any phone. The demo (dog eating slowly from maze) is relatable to every fast-eating dog owner.",
      startingBudgetPerDay: 20,
      audienceSummary: "Dog owners 28–55. Pet, dog breed, veterinary, pet health interest stack. Strong on Facebook.",
      creativeAnglesAvailable: [
        "Health/safety (bloat prevention)",
        "Anxiety and enrichment (lick mat variant)",
        "Training tool angle",
        "Slow eater satisfaction demo",
        "Gift for a dog parent",
        "Vet-recommended framing",
      ],
    },
    beginnerScore: 9.5,
    warnings: [],
  },

  {
    id: "pet-002",
    name: "Self-Cleaning Pet Hair Remover Roller",
    niche: "pet",
    searchTermCJ: "self cleaning pet hair remover roller reusable lint brush couch",
    description:
      "Reusable pet hair remover with self-cleaning base. Roll across couch/clothes, press into base, hair compacts and ejects cleanly. No refill pads needed. Works on fabric, car seats, beds.",
    pricing: {
      sellingPriceMin: 24.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 29.99,
      cogsMin: 4.5,
      cogsMax: 7.0,
      cogsRecommended: 6.0,
      grossMarginAtRecommended: 22.0,
      markupMin: 4.0,
      markupMax: 5.5,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Lightweight. Plastic — low breakage risk when well-packaged.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Disgust-to-satisfaction: show extremely hair-covered couch, 10 seconds of rolling, completely clean result. The ejected hair ball is the viral moment.",
      primaryHook:
        "My couch was DISGUSTING until I tried this. Watch what comes off in 30 seconds…",
      whyItWorksForBeginners:
        "Before/after is visually disgusting in the best way. The eject mechanism creates a satisfying reveal moment. Viral by nature. 67% of US households own pets — addressable market is enormous.",
      startingBudgetPerDay: 20,
      audienceSummary: "Pet owners (dog + cat) 22–50. Pet hair, upholstery, home cleaning interest stack.",
      creativeAnglesAvailable: [
        "Gross-out satisfaction (hair reveal)",
        "Couch rescue transformation",
        "Car seat cleaning angle",
        "Clothes/outfit rescue",
        "Gift for pet owners",
      ],
    },
    beginnerScore: 9.0,
    warnings: [],
  },

  {
    id: "pet-003",
    name: "Retractable Dog Leash with Waste Bag Dispenser",
    niche: "pet",
    searchTermCJ: "retractable dog leash built-in waste bag dispenser LED light ergonomic",
    description:
      "5m retractable leash with ergonomic grip, built-in waste bag roll dispenser, and LED safety light. Anti-tangle cord. Multiple weight classes (up to 50lb).",
    pricing: {
      sellingPriceMin: 27.99,
      sellingPriceMax: 39.99,
      sellingPriceRecommended: 32.99,
      cogsMin: 6.5,
      cogsMax: 9.0,
      cogsRecommended: 7.5,
      grossMarginAtRecommended: 23.0,
      markupMin: 3.5,
      markupMax: 4.5,
    },
    shipping: {
      estimatedDaysMin: 8,
      estimatedDaysMax: 11,
      carrier: "CJ Dropshipping Standard",
      notes: "Moderate weight. Verify weight class before ordering. Retractable mechanism must be tested for quality.",
    },
    marketing: {
      bestPlatform: ["facebook"],
      bestAngle:
        "Convenience: 'I used to juggle my leash, phone, bags, and coffee on walks. This has everything in one handle.'",
      primaryHook:
        "Dog walkers: why are you still holding a separate bag dispenser? This is embarrassing that I didn't know this existed.",
      whyItWorksForBeginners:
        "Every dog owner walks their dog. The built-in waste bag dispenser solves the universal wallet-searching problem. Feature stacking (leash + bags + light) justifies price without the buyer feeling upsold.",
      startingBudgetPerDay: 25,
      audienceSummary: "Dog owners, suburban homeowners, 28–50. Dog walking, dog ownership interests.",
      creativeAnglesAvailable: [
        "Convenience/simplicity angle",
        "Night walk safety (LED)",
        "Gift for dog owners",
        "New puppy starter kit framing",
      ],
    },
    beginnerScore: 7.5,
    warnings: ["Slightly competitive. LED variant provides differentiation — source LED SKU specifically."],
  },

  // ─── NICHE 3: HEALTH / WELLNESS ───────────────────────────────────────────

  {
    id: "hw-001",
    name: "Gua Sha Tool + Facial Roller Set",
    niche: "health-wellness",
    searchTermCJ: "rose quartz gua sha facial roller set jade stone gift box",
    description:
      "Rose quartz or jade gua sha scraping tool with matching facial roller. Used for face depuffing, lymphatic drainage, jawline definition. Comes in gift-ready box.",
    pricing: {
      sellingPriceMin: 24.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 27.99,
      cogsMin: 3.0,
      cogsMax: 5.5,
      cogsRecommended: 4.5,
      grossMarginAtRecommended: 22.0,
      markupMin: 5.0,
      markupMax: 8.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Ultra-light. Pack well — stone variants can chip. Foam insert recommended.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Spa-at-home accessibility: 'Facial massage used to cost me $80/session. I get the same result every morning for free now.'",
      primaryHook:
        "I depuffed my face in 2 minutes this morning and I'm obsessed. Here's my exact routine.",
      whyItWorksForBeginners:
        "Transformation demo (puffed face to sculpted jawline) is inherently visual. Massive existing organic TikTok content base proves demand. The ritual angle (morning routine, luxury feel at low cost) extends creative runway beyond a single demo.",
      startingBudgetPerDay: 20,
      audienceSummary: "Women 18–40. Skincare, facial massage, self-care, wellness interests.",
      creativeAnglesAvailable: [
        "Morning depuff routine",
        "Spa-at-home savings angle",
        "Jawline definition demo",
        "Gift for her",
        "Lymphatic drainage wellness angle",
        "Anti-aging routine framing",
      ],
    },
    beginnerScore: 8.5,
    warnings: ["Stone variants can crack if dropped — verify packaging quality. Source sets with foam-lined box."],
  },

  {
    id: "hw-002",
    name: "Acupressure Mat + Pillow Set",
    niche: "health-wellness",
    searchTermCJ: "acupressure mat pillow set back pain neck relief lotus spike foam",
    description:
      "Foam mat covered in 6,000+ plastic acupressure points with matching neck pillow. Used lying down for 20–30 minutes. Targets back pain, relaxation, and sleep improvement.",
    pricing: {
      sellingPriceMin: 34.99,
      sellingPriceMax: 49.99,
      sellingPriceRecommended: 42.99,
      cogsMin: 8.0,
      cogsMax: 11.0,
      cogsRecommended: 9.5,
      grossMarginAtRecommended: 29.0,
      markupMin: 3.5,
      markupMax: 5.0,
    },
    shipping: {
      estimatedDaysMin: 8,
      estimatedDaysMax: 11,
      carrier: "CJ Dropshipping Standard",
      notes: "Bulkier item — verify weight class and dimensions. Pillow adds to package size.",
    },
    marketing: {
      bestPlatform: ["facebook", "tiktok"],
      bestAngle:
        "Skeptic-to-believer: 'I laughed at this until I used it for a week. My back pain is gone.' Works especially well for 35–55 on Facebook.",
      primaryHook:
        "My chiropractor charges me $120/visit. I've cancelled 4 appointments since I started doing THIS instead.",
      whyItWorksForBeginners:
        "80% of adults experience back pain. The first-touch visual (lying on a spike mat) creates instant curiosity + skepticism — the most clickable creative combination. The skeptic-to-believer arc is built into the product itself.",
      startingBudgetPerDay: 25,
      audienceSummary: "Adults 30–60 with back or neck pain. Back pain, chiropractic, yoga, stress relief interests.",
      creativeAnglesAvailable: [
        "Skeptic-to-believer arc",
        "Chiropractor alternative",
        "Sleep improvement angle",
        "Stress relief + relaxation",
        "First-use reaction video",
      ],
    },
    beginnerScore: 8.0,
    warnings: [
      "Do NOT make medical claims in ad copy. Frame as relaxation/wellness tool only.",
      "Bulkier than other products — verify shipping cost does not erode margin.",
    ],
  },

  {
    id: "hw-003",
    name: "Ice Roller for Face and Body",
    niche: "health-wellness",
    searchTermCJ: "ice roller face body cryotherapy stainless steel gel filled",
    description:
      "Stainless steel or gel-filled roller stored in freezer. Rolled across face/neck/body for inflammation reduction, pore minimizing, headache relief, and muscle recovery.",
    pricing: {
      sellingPriceMin: 22.99,
      sellingPriceMax: 29.99,
      sellingPriceRecommended: 25.99,
      cogsMin: 4.0,
      cogsMax: 6.5,
      cogsRecommended: 5.5,
      grossMarginAtRecommended: 19.0,
      markupMin: 4.0,
      markupMax: 5.5,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 9,
      carrier: "CJ Dropshipping Standard",
      notes: "Extremely lightweight. Gel-filled variant requires care note (do not freeze below -20C).",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "TikTok: morning glow ritual. Facebook: migraine/headache relief without pills.",
      primaryHook:
        "My skin looks like this at 6am because of a $25 thing from my freezer.",
      whyItWorksForBeginners:
        "Multiple angles across different audiences with one product. Rolling an ice roller across a face gives an instant visible + tactile reaction on camera. The '5am skincare routine' creative format is built for this product.",
      startingBudgetPerDay: 20,
      audienceSummary:
        "Women 18–40 (skincare angle). Adults 28–55 (migraine/pain angle). Athletes 18–40 (recovery angle).",
      creativeAnglesAvailable: [
        "Morning skincare ritual",
        "Migraine and headache relief",
        "Post-workout muscle recovery",
        "Anti-puffiness after a night out",
        "Pore minimizing demo",
      ],
    },
    beginnerScore: 8.0,
    warnings: ["Lower price point — test angles quickly to find best converter before scaling."],
  },

  // ─── NICHE 4: BEAUTY / GROOMING ───────────────────────────────────────────

  {
    id: "bg-001",
    name: "Dermaplaning Face Razor Set (3–6 pack)",
    niche: "beauty-grooming",
    searchTermCJ: "dermaplaning tool facial razor peach fuzz exfoliator women eyebrow",
    description:
      "Small precision face razor with protective guard. Removes peach fuzz and dead skin cells for smoother makeup application. Pack of 3–6 tools.",
    pricing: {
      sellingPriceMin: 19.99,
      sellingPriceMax: 27.99,
      sellingPriceRecommended: 22.99,
      cogsMin: 2.5,
      cogsMax: 4.5,
      cogsRecommended: 3.5,
      grossMarginAtRecommended: 18.0,
      markupMin: 5.0,
      markupMax: 8.0,
    },
    shipping: {
      estimatedDaysMin: 6,
      estimatedDaysMax: 9,
      carrier: "CJ Dropshipping Standard",
      notes: "Ultra-light. Flat envelope shipping possible. Fastest shipping in this library.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Makeup application comparison: 'Why does my makeup look like THIS on days I dermaplane vs. THIS on days I don't?' Side-by-side skin texture before/after.",
      primaryHook:
        "I spent $200 on foundation and it kept looking patchy until I did THIS first. 30 seconds, $5, life changed.",
      whyItWorksForBeginners:
        "Massive proven organic demand on TikTok (#dermaplaning has 500M+ views). Ultra-low COGS = highest markup in this library. Flat shipping. No sizing. Multiple creative formats. The before/after (foundation application quality) is stark and believable.",
      startingBudgetPerDay: 20,
      audienceSummary: "Women 18–40. Makeup, skincare, beauty routine interests. TikTok #skintok audience.",
      creativeAnglesAvailable: [
        "Foundation application comparison",
        "Peach fuzz removal reveal",
        "Skin texture before/after",
        "Skincare routine step",
        "Esthetician secret angle",
        "Budget beauty hack",
      ],
    },
    beginnerScore: 9.0,
    warnings: [
      "Some Facebook ad policies flag 'before/after' beauty claims — keep framing educational, not clinical.",
      "Lower price point — bundle as 6-pack or add complementary product to boost AOV.",
    ],
  },

  {
    id: "bg-002",
    name: "Silicone Scalp Massager / Shampoo Brush",
    niche: "beauty-grooming",
    searchTermCJ: "silicone scalp massager shampoo brush hair growth manual handheld",
    description:
      "Handheld silicone scalp massager with flexible bristles. Manual variant recommended for beginners (no electrical compliance issues). Used in shower for dandruff removal, circulation improvement, and hair growth.",
    pricing: {
      sellingPriceMin: 22.99,
      sellingPriceMax: 29.99,
      sellingPriceRecommended: 25.99,
      cogsMin: 3.0,
      cogsMax: 5.5,
      cogsRecommended: 4.0,
      grossMarginAtRecommended: 20.0,
      markupMin: 4.5,
      markupMax: 6.5,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Ultra-light. Soft silicone — no breakage risk.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Dual angle: 'Shower routine upgrade' for lifestyle/wellness OR 'I was losing hair at 28. Changed my shampoo routine, changed everything.' for hair loss audience.",
      primaryHook:
        "My dermatologist told me I was washing my hair wrong. Here's the $18 fix.",
      whyItWorksForBeginners:
        "Two completely distinct audiences (wellness lifestyle + hair loss) from one product. ASMR-adjacent satisfying scalp massage visual has massive organic reach on TikTok. Works for male (hair thinning) and female (hair growth) with different creative.",
      startingBudgetPerDay: 20,
      audienceSummary:
        "Women 22–40 (haircare/routine angle). Men and women 28–50 (hair thinning/loss angle).",
      creativeAnglesAvailable: [
        "Shower routine upgrade",
        "Hair loss/thinning solution",
        "Scalp health education",
        "ASMR/relaxation content",
        "Dandruff reduction angle",
      ],
    },
    beginnerScore: 8.5,
    warnings: [
      "Stick to manual (non-electric) variant to avoid electrical product compliance friction.",
      "Hair loss claims require careful framing — use 'circulation improvement' not 'regrows hair.'",
    ],
  },

  {
    id: "bg-003",
    name: "Electric Makeup Brush Cleaner (Spinner)",
    niche: "beauty-grooming",
    searchTermCJ: "electric makeup brush cleaner spinner auto washing tool battery",
    description:
      "Battery-powered spinner that fits brush handles, spins in water/cleanser, cleans and dries brushes in 10 seconds. Removes makeup pigment visibly in water. Disgusting and satisfying.",
    pricing: {
      sellingPriceMin: 24.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 29.99,
      cogsMin: 5.0,
      cogsMax: 8.0,
      cogsRecommended: 6.5,
      grossMarginAtRecommended: 21.0,
      markupMin: 3.5,
      markupMax: 5.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Battery-operated — batteries typically not included. Note this clearly in product listing to avoid negative reviews.",
    },
    marketing: {
      bestPlatform: ["tiktok"],
      bestAngle:
        "Gross-out guilt + solution: 'Clean your makeup brushes. This is what's living on them.' Show contaminated water after cleaning.",
      primaryHook:
        "When was the last time you cleaned your makeup brushes? Watch what comes out of mine.",
      whyItWorksForBeginners:
        "The demo is inherently viral: brush goes into clean water, spins, water turns dark brown/purple. Every makeup wearer feels immediate guilt (they should clean their brushes) plus instant solution. Gross-to-satisfying arc is TikTok gold.",
      startingBudgetPerDay: 20,
      audienceSummary: "Makeup wearers 18–40. Beauty, makeup, skincare, MUA interests.",
      creativeAnglesAvailable: [
        "Gross-to-satisfying dirty brush reveal",
        "Skin health / bacteria angle",
        "Makeup artist efficiency angle",
        "ASMR clean routine",
      ],
    },
    beginnerScore: 8.0,
    warnings: [
      "Batteries not included — include this in product description to prevent low reviews.",
      "Test spinner mechanism quality before ordering bulk — some cheap variants have durability issues.",
    ],
  },

  // ─── NICHE 5: FITNESS / POSTURE ───────────────────────────────────────────

  {
    id: "fp-001",
    name: "Posture Corrector (Adjustable Back Brace)",
    niche: "fitness-posture",
    searchTermCJ: "posture corrector adjustable back brace clavicle support invisible under shirt",
    description:
      "Figure-8 strap or back brace that pulls shoulders back and corrects forward head posture. Thin enough to wear under shirt. Adjustable for multiple sizes.",
    pricing: {
      sellingPriceMin: 27.99,
      sellingPriceMax: 39.99,
      sellingPriceRecommended: 33.99,
      cogsMin: 5.5,
      cogsMax: 8.5,
      cogsRecommended: 7.0,
      grossMarginAtRecommended: 23.0,
      markupMin: 3.5,
      markupMax: 5.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Lightweight fabric. Minimal sizing variants recommended — offer S/M and L/XL only.",
    },
    marketing: {
      bestPlatform: ["facebook", "tiktok"],
      bestAngle:
        "WFH/desk worker pain: '3 years of working from home wrecked my posture. Found this — wearing it 2 hours a day for 3 weeks. Here's the difference.'",
      primaryHook:
        "My doctor said my 30-year-old posture looks like a 60-year-old's. I fixed it in 3 weeks for $30.",
      whyItWorksForBeginners:
        "Text neck and WFH posture problems affect 70%+ of adults under 50. The before/after (slouched vs. upright) is immediately visual. Office worker audience is enormous and easily targetable on Facebook.",
      startingBudgetPerDay: 25,
      audienceSummary: "WFH workers, desk workers, 25–50. Back pain, ergonomics, chiropractor, remote work interests.",
      creativeAnglesAvailable: [
        "WFH posture damage angle",
        "Doctor's visit motivation angle",
        "Text neck awareness",
        "Gym performance / deadlift setup",
        "Confidence and appearance angle",
      ],
    },
    beginnerScore: 7.5,
    warnings: [
      "Sizing creates some return risk — include detailed size chart in product page.",
      "Offer only 2 size ranges (S/M and L/XL) to minimize variant management complexity.",
    ],
    bundleSuggestion: "hw-002",
  },

  {
    id: "fp-002",
    name: "Resistance Band Set (5 Levels, Fabric Loop)",
    niche: "fitness-posture",
    searchTermCJ: "resistance loop band set 5 pack fabric booty band workout carry bag",
    description:
      "Set of 5 fabric loop resistance bands in progressive resistance levels. Used for glutes, legs, arms, physical therapy. Comes in carry bag. Fabric variant preferred — does not roll up like latex.",
    pricing: {
      sellingPriceMin: 22.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 27.99,
      cogsMin: 3.5,
      cogsMax: 6.0,
      cogsRecommended: 5.0,
      grossMarginAtRecommended: 21.0,
      markupMin: 4.5,
      markupMax: 6.0,
    },
    shipping: {
      estimatedDaysMin: 6,
      estimatedDaysMax: 8,
      carrier: "CJ Dropshipping Standard",
      notes: "Extremely light. Flat envelope possible. Fastest, lowest-cost shipping in fitness niche.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "'Full body workout in your living room' — show a 30-second circuit. No gym, no commute, no judgment.",
      primaryHook:
        "I cancelled my $60/month gym membership 4 months ago. This $25 set does everything I need.",
      whyItWorksForBeginners:
        "Everyone knows resistance bands. The value story (5 bands, full gym at home, under $30) writes itself. Workout demo content is infinitely producible — one workout video per week = months of creative. No sizing. Most angles of any fitness product. Evergreen — no seasonality.",
      startingBudgetPerDay: 20,
      audienceSummary:
        "Home workout enthusiasts, gym-shy, busy parents, travelers, seniors. Fitness, home workout, yoga, physical therapy interests. 18–60.",
      creativeAnglesAvailable: [
        "Cancel gym membership savings angle",
        "Home workout with no equipment",
        "Glute/booty workout angle (women 18–35)",
        "Travel-friendly workout gear",
        "Physical therapy / injury rehab angle",
        "Senior fitness / low impact angle",
        "30-day challenge format",
      ],
    },
    beginnerScore: 9.0,
    warnings: ["Fabric bands cost slightly more than latex — verify fabric variant specifically when sourcing."],
  },

  {
    id: "fp-003",
    name: "Ab Roller Wheel with Knee Pad",
    niche: "fitness-posture",
    searchTermCJ: "ab roller wheel exercise core workout knee pad set ergonomic handle",
    description:
      "Dual-wheel ab roller for core strengthening. Includes foam knee pad. Ergonomic non-slip handles. Some variants include auto-return spring mechanism.",
    pricing: {
      sellingPriceMin: 24.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 27.99,
      cogsMin: 5.0,
      cogsMax: 8.0,
      cogsRecommended: 6.5,
      grossMarginAtRecommended: 20.0,
      markupMin: 3.5,
      markupMax: 5.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Moderate weight/size. Verify box dimensions to stay in lower shipping tier.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Transformation challenge: 'I did 3 sets with this every day for 30 days. Day 1 vs. Day 30.' Humble/relatable: 'I couldn't even do 1 rollout on Day 1.'",
      primaryHook:
        "I couldn't do a single ab rollout on Day 1. Day 30: watch this.",
      whyItWorksForBeginners:
        "The ab roller is the single most recognizable home fitness tool. The '30-day challenge' content structure provides 30 natural hooks from one product purchase. Before/after abs content is evergreen.",
      startingBudgetPerDay: 20,
      audienceSummary: "Fitness enthusiasts 18–45. Core workout, home fitness, abs, calisthenics interests.",
      creativeAnglesAvailable: [
        "30-day transformation challenge",
        "Beginner to advanced progression",
        "No gym core workout",
        "Visible abs motivation angle",
      ],
    },
    beginnerScore: 7.5,
    warnings: [
      "More competitive than resistance bands — use 30-day challenge angle to differentiate from generic fitness ads.",
    ],
  },

  // ─── NICHE 6: OUTDOOR / SURVIVAL ──────────────────────────────────────────

  {
    id: "os-001",
    name: "Credit Card Multi-Tool (EDC Wallet Tool)",
    niche: "outdoor-survival",
    searchTermCJ: "credit card multitool EDC wallet tool stainless steel survival",
    description:
      "Credit-card-sized stainless steel multi-tool. Fits in wallet. Includes bottle opener, ruler, screwdriver, hex wrench, can opener, and small blade. Comes in gift box.",
    pricing: {
      sellingPriceMin: 24.99,
      sellingPriceMax: 39.99,
      sellingPriceRecommended: 29.99,
      cogsMin: 4.5,
      cogsMax: 8.0,
      cogsRecommended: 6.5,
      grossMarginAtRecommended: 22.0,
      markupMin: 4.0,
      markupMax: 6.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Flat and light. Metal item — verify not flagged as prohibited in destination country.",
    },
    marketing: {
      bestPlatform: ["facebook", "tiktok"],
      bestAngle:
        "Gift framing: 'Best gift for the man who has everything — under $30.' Around any holiday. OR: utility framing: 'I've had this in my wallet for 8 months. Used it more than I expected.'",
      primaryHook:
        "8 tools in something the size of a credit card. How did I not know this existed.",
      whyItWorksForBeginners:
        "EDC community is fanatical. The gift angle dramatically expands audience around all holidays (Father's Day, Christmas, graduation, Valentine's Day). The card format is a genuine 'I didn't know this existed' product for most viewers.",
      startingBudgetPerDay: 25,
      audienceSummary: "Men 25–50 and gift buyers 22–55. EDC, outdoors, tools, camping, hunting, fishing interests.",
      creativeAnglesAvailable: [
        "EDC utility demonstration",
        "Gift for him (holiday frames)",
        "Minimalist wallet upgrade",
        "Survival preparedness angle",
        "Travel carry-on safe angle",
      ],
    },
    beginnerScore: 7.5,
    warnings: [
      "Avoid standalone folding knife variant — use multi-tool card to stay within ad platform policies.",
      "Check local regulations on blade items for international shipping.",
    ],
    bundleSuggestion: "os-003",
  },

  {
    id: "os-002",
    name: "Plasma Arc Electric Lighter (USB Rechargeable)",
    niche: "outdoor-survival",
    searchTermCJ: "plasma arc lighter windproof electric USB rechargeable dual arc",
    description:
      "USB-rechargeable electric plasma arc lighter. No flame, no butane. Works in wind and rain. Slim design fits in pocket. LED fuel/charge indicator on select variants.",
    pricing: {
      sellingPriceMin: 24.99,
      sellingPriceMax: 34.99,
      sellingPriceRecommended: 29.99,
      cogsMin: 5.0,
      cogsMax: 8.5,
      cogsRecommended: 7.0,
      grossMarginAtRecommended: 21.0,
      markupMin: 3.5,
      markupMax: 5.0,
    },
    shipping: {
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: "CJ Dropshipping Standard",
      notes: "Contains small lithium battery — verify CJ SKU is approved for standard shipping. Most small-capacity batteries ship fine.",
    },
    marketing: {
      bestPlatform: ["tiktok", "facebook"],
      bestAngle:
        "Demonstration spectacle: 'I put a normal lighter in front of a fan. Dead. Then I tried this.' Show arc lighting in direct wind.",
      primaryHook:
        "Threw away my Bic. This thing charges with USB and lights in 40mph wind. Never going back.",
      whyItWorksForBeginners:
        "The electric arc visual is a pure scroll-stopper — purple lightning arc instead of flame, frame one. The video makes itself. 'Last lighter you'll ever buy' angle adds emotional permanence. Organic reach potential is very high on TikTok gadget content.",
      startingBudgetPerDay: 20,
      audienceSummary: "Men 22–45. Outdoors, camping, hiking, survival, gadget/tech interests.",
      creativeAnglesAvailable: [
        "Wind/rain resistance demonstration",
        "USB-rechargeable vs. butane comparison",
        "Camping/outdoor utility angle",
        "Gift for outdoorsy person",
        "Never buy butane again savings angle",
      ],
    },
    beginnerScore: 8.5,
    warnings: [
      "Verify lithium battery shipping approval on specific CJ SKU before ordering.",
      "Age verification may be required on some platforms for lighters.",
    ],
  },

  {
    id: "os-003",
    name: "Emergency Mylar Thermal Blankets (10-Pack)",
    niche: "outdoor-survival",
    searchTermCJ: "emergency mylar thermal space blanket survival 10 pack car kit",
    description:
      "Ultra-thin aluminized Mylar emergency blankets. Retains 90% of body heat. Pack of 10 fits in a pocket. For car emergency kits, hiking, disaster preparedness.",
    pricing: {
      sellingPriceMin: 19.99,
      sellingPriceMax: 27.99,
      sellingPriceRecommended: 22.99,
      cogsMin: 3.0,
      cogsMax: 4.5,
      cogsRecommended: 4.0,
      grossMarginAtRecommended: 18.0,
      markupMin: 5.0,
      markupMax: 7.0,
    },
    shipping: {
      estimatedDaysMin: 6,
      estimatedDaysMax: 8,
      carrier: "CJ Dropshipping Standard",
      notes: "Lightest product in library. Flat envelope possible. No restrictions.",
    },
    marketing: {
      bestPlatform: ["facebook", "tiktok"],
      bestAngle:
        "Fear/preparedness: 'This goes in every car in my family. $3 per blanket. One could save a life.' Resonates with parents especially.",
      primaryHook:
        "This goes in every car I own. Costs $3. Could save a life. Most people don't have one.",
      whyItWorksForBeginners:
        "Fear-based preparedness marketing is easy to execute. Product is universally unrecognized but immediately obvious once explained. FOMO + guilt drives impulse conversion. Ultra-low COGS enables aggressive pricing or bundle building.",
      startingBudgetPerDay: 20,
      audienceSummary: "Parents, drivers, outdoor enthusiasts, 28–60. Emergency preparedness, camping, safety, parenting interests.",
      creativeAnglesAvailable: [
        "Car emergency kit essentials",
        "Stranded driver rescue scenario",
        "Hiker preparedness",
        "Parent safety framing",
        "Disaster preparedness / SHTF",
      ],
    },
    beginnerScore: 7.5,
    warnings: [
      "Lower price point — bundle with multi-tool card (os-001) as 'car emergency starter kit' at $44.99 to improve margin math.",
    ],
    bundleSuggestion: "os-001",
  },
];

// ─── RECOMMENDATION ENGINE HELPERS ────────────────────────────────────────────

/**
 * Returns all products sorted by beginner score descending.
 */
export function getTopBeginnerProducts(limit = 5): ProductEntry[] {
  return [...PRODUCT_LIBRARY]
    .sort((a, b) => b.beginnerScore - a.beginnerScore)
    .slice(0, limit);
}

/**
 * Returns the single default product recommendation for a complete beginner
 * with no stated niche preference.
 * Logic: highest beginner score with fewest warnings and broadest audience.
 */
export function getDefaultBeginnerProduct(): ProductEntry {
  // pet-001 (Slow Feeder Dog Bowl) is the default pick.
  // fp-002 (Resistance Band Set) is the TikTok-first alternative.
  const defaultId = "pet-001";
  return PRODUCT_LIBRARY.find((p) => p.id === defaultId) as ProductEntry;
}

/**
 * Returns the best product for a given niche.
 */
export function getTopProductByNiche(niche: Niche): ProductEntry {
  const nicheProducts = PRODUCT_LIBRARY.filter((p) => p.niche === niche);
  return nicheProducts.sort((a, b) => b.beginnerScore - a.beginnerScore)[0];
}

/**
 * Returns the best product for a given platform preference.
 */
export function getTopProductByPlatform(platform: Platform, limit = 3): ProductEntry[] {
  return PRODUCT_LIBRARY.filter((p) => p.marketing.bestPlatform.includes(platform))
    .sort((a, b) => b.beginnerScore - a.beginnerScore)
    .slice(0, limit);
}

/**
 * Maps a selected ProductEntry to the seed fields expected by the
 * Phase 4 AssetPackage generator (docs/system/phase-04-asset-generator.md).
 */
export function toAssetSeed(product: ProductEntry): {
  audience: string;
  pain: string[];
  angle: string;
  primaryHook: string;
  recommendedPlatform: Platform;
  startingBudgetPerDay: number;
  sellingPrice: number;
  cogs: number;
  grossMargin: number;
  beginnerScore: number;
  creativeAngles: string[];
} {
  return {
    audience: product.marketing.audienceSummary,
    pain: [product.marketing.whyItWorksForBeginners],
    angle: product.marketing.bestAngle,
    primaryHook: product.marketing.primaryHook,
    recommendedPlatform: product.marketing.bestPlatform[0],
    startingBudgetPerDay: product.marketing.startingBudgetPerDay,
    sellingPrice: product.pricing.sellingPriceRecommended,
    cogs: product.pricing.cogsRecommended,
    grossMargin: product.pricing.grossMarginAtRecommended,
    beginnerScore: product.beginnerScore,
    creativeAngles: product.marketing.creativeAnglesAvailable,
  };
}
