/**
 * STANDARD WEBSITE TEMPLATES (100+ Templates)
 *
 * Base templates covering every major business type and niche.
 * These are the foundation templates that will be improved with proven conversion patterns.
 *
 * Categories:
 * - E-Commerce (30 templates): Fashion, Electronics, Beauty, Food, Home, etc.
 * - SaaS (20 templates): Productivity, Marketing, Dev Tools, Analytics, etc.
 * - Local Service (25 templates): Home Services, Professional Services, Health & Wellness, etc.
 * - Consultant/Coach (15 templates): Business, Life, Fitness, Career, etc.
 * - Agency (10 templates): Marketing, Design, Development, Consulting, etc.
 */

import { ProvenWebsiteTemplate } from "./provenWebsiteTemplates";

// Helper function to generate standard templates
function createStandardTemplate(
  id: string,
  name: string,
  category: ProvenWebsiteTemplate["category"],
  niche: string,
  options?: Partial<ProvenWebsiteTemplate>
): ProvenWebsiteTemplate {
  return {
    id: `std-${id}`,
    name,
    category,
    niche,

    // Standard performance metrics (industry averages)
    avgConversionRate: 2.5,
    conversionRange: "2.0-3.0%",
    avgCartRate: 7.5,
    avgBounceRate: 45,

    brandExamples: options?.brandExamples || ["Industry Standard"],

    designTheme: options?.designTheme || "dawn",
    colorScheme: options?.colorScheme || {
      primary: "#2C3E50",
      secondary: "#3498DB",
      background: "#FFFFFF",
      text: "#333333",
      accent: "#E74C3C",
    },
    typography: options?.typography || {
      headingFont: "Inter",
      bodyFont: "Inter",
      headingWeight: 600,
      bodyWeight: 400,
    },

    heroSection: options?.heroSection || {
      layout: "centered",
      headline: `Professional ${niche} Solutions`,
      subheadline: "Quality service you can trust",
      ctaPrimary: "Get Started",
      visualType: "product-grid",
      trustElements: ["Trusted by thousands", "Money-back guarantee"],
    },

    sections: options?.sections || [
      { id: "hero", name: "Hero Section", purpose: "First impression", conversionImpact: "critical" },
      { id: "features", name: "Features Grid", purpose: "Show capabilities", conversionImpact: "high" },
      { id: "testimonials", name: "Customer Reviews", purpose: "Social proof", conversionImpact: "high" },
      { id: "cta", name: "Call to Action", purpose: "Convert visitors", conversionImpact: "critical" },
    ],

    trustSignals: options?.trustSignals || {
      reviews: true,
      ratings: true,
      testimonials: true,
      socialProof: true,
      badges: ["Secure Checkout", "Money Back Guarantee"],
    },

    seoOptimization: options?.seoOptimization || {
      titleFormula: `${name} | Professional ${niche}`,
      metaDescFormula: `Professional ${niche} services. Quality guaranteed.`,
      h1Formula: `Professional ${niche}`,
      schemaTypes: ["Organization", "Product"],
    },

    mobileOptimization: options?.mobileOptimization || {
      mobileConversionRate: 2.0,
      loadTime: "< 3.0s",
      coreTechScore: 85,
    },

    conversionElements: options?.conversionElements || {
      urgency: [],
      incentives: ["Free Shipping"],
      exitIntent: false,
      cartRecovery: false,
      liveChat: false,
    },

    isPro: false,
    difficulty: "beginner",
    buildTime: "45 min",

    ...options,
  };
}

// ============================================================================
// E-COMMERCE TEMPLATES (30)
// ============================================================================

export const ECOMMERCE_STANDARD_TEMPLATES: ProvenWebsiteTemplate[] = [
  // Fashion & Apparel (10)
  createStandardTemplate("ec-fashion-1", "Men's Fashion Store", "ecommerce", "mens-fashion", {
    brandExamples: ["Bonobos", "Frank And Oak", "Buck Mason"],
    designTheme: "dawn",
  }),
  createStandardTemplate("ec-fashion-2", "Women's Fashion Boutique", "ecommerce", "womens-fashion", {
    brandExamples: ["Reformation", "Everlane", "& Other Stories"],
    designTheme: "sense",
  }),
  createStandardTemplate("ec-fashion-3", "Kids Clothing Store", "ecommerce", "kids-fashion", {
    brandExamples: ["Primary", "Monica + Andy", "Tea Collection"],
  }),
  createStandardTemplate("ec-fashion-4", "Athletic Wear Shop", "ecommerce", "activewear", {
    brandExamples: ["Gymshark", "Outdoor Voices", "Vuori"],
  }),
  createStandardTemplate("ec-fashion-5", "Luxury Fashion Retailer", "ecommerce", "luxury-fashion", {
    brandExamples: ["Net-a-Porter", "Farfetch", "SSENSE"],
  }),
  createStandardTemplate("ec-fashion-6", "Streetwear Store", "ecommerce", "streetwear", {
    brandExamples: ["Supreme", "Kith", "BAPE"],
  }),
  createStandardTemplate("ec-fashion-7", "Sustainable Fashion", "ecommerce", "sustainable-fashion", {
    brandExamples: ["Patagonia", "Girlfriend Collective", "Reformation"],
  }),
  createStandardTemplate("ec-fashion-8", "Plus Size Fashion", "ecommerce", "plus-size", {
    brandExamples: ["Eloquii", "Universal Standard", "Good American"],
  }),
  createStandardTemplate("ec-fashion-9", "Shoe Store", "ecommerce", "footwear", {
    brandExamples: ["Allbirds", "Rothy's", "Thursday Boots"],
  }),
  createStandardTemplate("ec-fashion-10", "Accessories Shop", "ecommerce", "accessories", {
    brandExamples: ["Cuyana", "Senreve", "Bellroy"],
  }),

  // Beauty & Personal Care (5)
  createStandardTemplate("ec-beauty-1", "Skincare Brand", "ecommerce", "skincare", {
    brandExamples: ["The Ordinary", "Drunk Elephant", "Glow Recipe"],
    designTheme: "sense",
  }),
  createStandardTemplate("ec-beauty-2", "Makeup Store", "ecommerce", "makeup", {
    brandExamples: ["Glossier", "Fenty Beauty", "Rare Beauty"],
  }),
  createStandardTemplate("ec-beauty-3", "Haircare Products", "ecommerce", "haircare", {
    brandExamples: ["Olaplex", "Briogeo", "Prose"],
  }),
  createStandardTemplate("ec-beauty-4", "Men's Grooming", "ecommerce", "mens-grooming", {
    brandExamples: ["Beardbrand", "Harry's", "Hawthorne"],
  }),
  createStandardTemplate("ec-beauty-5", "Natural Beauty", "ecommerce", "natural-beauty", {
    brandExamples: ["Herbivore", "Youth to the People", "Tata Harper"],
  }),

  // Electronics & Tech (5)
  createStandardTemplate("ec-tech-1", "Tech Gadgets Store", "ecommerce", "tech-gadgets", {
    brandExamples: ["Anker", "Nomad", "Peak Design"],
  }),
  createStandardTemplate("ec-tech-2", "Smart Home Shop", "ecommerce", "smart-home", {
    brandExamples: ["Wyze", "Ring", "Arlo"],
  }),
  createStandardTemplate("ec-tech-3", "Audio Equipment", "ecommerce", "audio", {
    brandExamples: ["Audio-Technica", "Sennheiser", "Focal"],
  }),
  createStandardTemplate("ec-tech-4", "Phone Accessories", "ecommerce", "phone-accessories", {
    brandExamples: ["Moment", "Pitaka", "Casetify"],
  }),
  createStandardTemplate("ec-tech-5", "Gaming Gear", "ecommerce", "gaming", {
    brandExamples: ["Razer", "SteelSeries", "HyperX"],
  }),

  // Home & Living (5)
  createStandardTemplate("ec-home-1", "Furniture Store", "ecommerce", "furniture", {
    brandExamples: ["Article", "Burrow", "Interior Define"],
  }),
  createStandardTemplate("ec-home-2", "Home Decor Shop", "ecommerce", "home-decor", {
    brandExamples: ["West Elm", "CB2", "Schoolhouse"],
  }),
  createStandardTemplate("ec-home-3", "Bedding & Linens", "ecommerce", "bedding", {
    brandExamples: ["Brooklinen", "Parachute", "Boll & Branch"],
  }),
  createStandardTemplate("ec-home-4", "Kitchenware", "ecommerce", "kitchenware", {
    brandExamples: ["Great Jones", "Our Place", "Made In"],
  }),
  createStandardTemplate("ec-home-5", "Indoor Plants", "ecommerce", "plants", {
    brandExamples: ["The Sill", "Bloomscape", "Léon & George"],
  }),

  // Food & Beverage (5)
  createStandardTemplate("ec-food-1", "Coffee Subscription", "ecommerce", "coffee", {
    brandExamples: ["Trade Coffee", "Atlas Coffee Club", "Blue Bottle"],
  }),
  createStandardTemplate("ec-food-2", "Meal Kit Delivery", "ecommerce", "meal-kits", {
    brandExamples: ["HelloFresh", "Blue Apron", "Sunbasket"],
  }),
  createStandardTemplate("ec-food-3", "Specialty Foods", "ecommerce", "gourmet-food", {
    brandExamples: ["Goldbelly", "Mouth Foods", "Rare Tea Cellar"],
  }),
  createStandardTemplate("ec-food-4", "Snack Subscription", "ecommerce", "snacks", {
    brandExamples: ["Graze", "Naturebox", "SnackNation"],
  }),
  createStandardTemplate("ec-food-5", "Wine & Spirits", "ecommerce", "wine", {
    brandExamples: ["Winc", "Firstleaf", "Drizly"],
  }),
];

// ============================================================================
// SAAS TEMPLATES (20)
// ============================================================================

export const SAAS_STANDARD_TEMPLATES: ProvenWebsiteTemplate[] = [
  // Productivity Tools (5)
  createStandardTemplate("saas-prod-1", "Project Management Tool", "saas", "project-management", {
    brandExamples: ["Asana", "Monday.com", "ClickUp"],
  }),
  createStandardTemplate("saas-prod-2", "Note-Taking App", "saas", "note-taking", {
    brandExamples: ["Notion", "Evernote", "Roam Research"],
  }),
  createStandardTemplate("saas-prod-3", "Time Tracking Software", "saas", "time-tracking", {
    brandExamples: ["Toggl", "Harvest", "Clockify"],
  }),
  createStandardTemplate("saas-prod-4", "Calendar Scheduling", "saas", "scheduling", {
    brandExamples: ["Calendly", "Acuity", "Doodle"],
  }),
  createStandardTemplate("saas-prod-5", "Document Collaboration", "saas", "collaboration", {
    brandExamples: ["Google Docs", "Dropbox Paper", "Confluence"],
  }),

  // Marketing Tools (5)
  createStandardTemplate("saas-mkt-1", "Email Marketing Platform", "saas", "email-marketing", {
    brandExamples: ["Mailchimp", "ConvertKit", "ActiveCampaign"],
  }),
  createStandardTemplate("saas-mkt-2", "Social Media Management", "saas", "social-media", {
    brandExamples: ["Buffer", "Hootsuite", "Sprout Social"],
  }),
  createStandardTemplate("saas-mkt-3", "SEO Tool Suite", "saas", "seo", {
    brandExamples: ["Ahrefs", "SEMrush", "Moz"],
  }),
  createStandardTemplate("saas-mkt-4", "Landing Page Builder", "saas", "landing-pages", {
    brandExamples: ["Unbounce", "Instapage", "Leadpages"],
  }),
  createStandardTemplate("saas-mkt-5", "Marketing Automation", "saas", "automation", {
    brandExamples: ["HubSpot", "Marketo", "Pardot"],
  }),

  // Developer Tools (5)
  createStandardTemplate("saas-dev-1", "Code Repository", "saas", "version-control", {
    brandExamples: ["GitHub", "GitLab", "Bitbucket"],
  }),
  createStandardTemplate("saas-dev-2", "API Platform", "saas", "api-management", {
    brandExamples: ["Postman", "Insomnia", "Paw"],
  }),
  createStandardTemplate("saas-dev-3", "Hosting Platform", "saas", "web-hosting", {
    brandExamples: ["Vercel", "Netlify", "Railway"],
  }),
  createStandardTemplate("saas-dev-4", "Error Monitoring", "saas", "monitoring", {
    brandExamples: ["Sentry", "Rollbar", "Bugsnag"],
  }),
  createStandardTemplate("saas-dev-5", "CI/CD Pipeline", "saas", "devops", {
    brandExamples: ["CircleCI", "Travis CI", "Jenkins"],
  }),

  // Analytics & Data (5)
  createStandardTemplate("saas-data-1", "Web Analytics", "saas", "analytics", {
    brandExamples: ["Google Analytics", "Plausible", "Fathom"],
  }),
  createStandardTemplate("saas-data-2", "Business Intelligence", "saas", "bi-tools", {
    brandExamples: ["Tableau", "Looker", "Metabase"],
  }),
  createStandardTemplate("saas-data-3", "Customer Data Platform", "saas", "cdp", {
    brandExamples: ["Segment", "mParticle", "RudderStack"],
  }),
  createStandardTemplate("saas-data-4", "A/B Testing Tool", "saas", "ab-testing", {
    brandExamples: ["Optimizely", "VWO", "AB Tasty"],
  }),
  createStandardTemplate("saas-data-5", "Heatmap & Session Recording", "saas", "user-analytics", {
    brandExamples: ["Hotjar", "FullStory", "Mouseflow"],
  }),
];

// ============================================================================
// LOCAL SERVICE TEMPLATES (25)
// ============================================================================

export const LOCAL_SERVICE_STANDARD_TEMPLATES: ProvenWebsiteTemplate[] = [
  // Home Services (10)
  createStandardTemplate("local-home-1", "HVAC Contractor", "local-service", "hvac", {
    brandExamples: ["Local HVAC Pros"],
  }),
  createStandardTemplate("local-home-2", "Plumbing Service", "local-service", "plumbing", {
    brandExamples: ["Roto-Rooter", "Mr. Rooter"],
  }),
  createStandardTemplate("local-home-3", "Electrical Services", "local-service", "electrical", {
    brandExamples: ["Mister Sparky"],
  }),
  createStandardTemplate("local-home-4", "Roofing Company", "local-service", "roofing", {
    brandExamples: ["Local Roofers"],
  }),
  createStandardTemplate("local-home-5", "Cleaning Service", "local-service", "cleaning", {
    brandExamples: ["Merry Maids", "Molly Maid"],
  }),
  createStandardTemplate("local-home-6", "Landscaping & Lawn Care", "local-service", "landscaping", {
    brandExamples: ["TruGreen", "Local Landscapers"],
  }),
  createStandardTemplate("local-home-7", "Pest Control", "local-service", "pest-control", {
    brandExamples: ["Terminix", "Orkin"],
  }),
  createStandardTemplate("local-home-8", "Painting Contractor", "local-service", "painting", {
    brandExamples: ["CertaPro Painters"],
  }),
  createStandardTemplate("local-home-9", "Handyman Services", "local-service", "handyman", {
    brandExamples: ["Mr. Handyman"],
  }),
  createStandardTemplate("local-home-10", "Moving Company", "local-service", "moving", {
    brandExamples: ["Two Men and a Truck"],
  }),

  // Professional Services (5)
  createStandardTemplate("local-prof-1", "Law Firm", "local-service", "legal", {
    brandExamples: ["Local Attorneys"],
  }),
  createStandardTemplate("local-prof-2", "Accounting Firm", "local-service", "accounting", {
    brandExamples: ["H&R Block", "Local CPAs"],
  }),
  createStandardTemplate("local-prof-3", "Real Estate Agent", "local-service", "real-estate", {
    brandExamples: ["Keller Williams", "RE/MAX"],
  }),
  createStandardTemplate("local-prof-4", "Insurance Agency", "local-service", "insurance", {
    brandExamples: ["State Farm", "Allstate"],
  }),
  createStandardTemplate("local-prof-5", "Financial Advisor", "local-service", "financial-planning", {
    brandExamples: ["Edward Jones"],
  }),

  // Health & Wellness (10)
  createStandardTemplate("local-health-1", "Dental Practice", "local-service", "dentistry", {
    brandExamples: ["Aspen Dental", "Local Dentists"],
  }),
  createStandardTemplate("local-health-2", "Medical Clinic", "local-service", "medical", {
    brandExamples: ["Urgent Care", "Family Practice"],
  }),
  createStandardTemplate("local-health-3", "Chiropractic Office", "local-service", "chiropractic", {
    brandExamples: ["The Joint Chiropractic"],
  }),
  createStandardTemplate("local-health-4", "Physical Therapy", "local-service", "physical-therapy", {
    brandExamples: ["ATI Physical Therapy"],
  }),
  createStandardTemplate("local-health-5", "Veterinary Clinic", "local-service", "veterinary", {
    brandExamples: ["Banfield Pet Hospital"],
  }),
  createStandardTemplate("local-health-6", "Spa & Salon", "local-service", "spa-salon", {
    brandExamples: ["Massage Envy", "European Wax Center"],
  }),
  createStandardTemplate("local-health-7", "Fitness Studio", "local-service", "fitness", {
    brandExamples: ["Orangetheory", "Pure Barre"],
  }),
  createStandardTemplate("local-health-8", "Yoga Studio", "local-service", "yoga", {
    brandExamples: ["CorePower Yoga"],
  }),
  createStandardTemplate("local-health-9", "Mental Health Counseling", "local-service", "counseling", {
    brandExamples: ["Talkspace", "BetterHelp"],
  }),
  createStandardTemplate("local-health-10", "Nutrition Coaching", "local-service", "nutrition", {
    brandExamples: ["Precision Nutrition"],
  }),
];

// ============================================================================
// CONSULTANT/COACH TEMPLATES (15)
// ============================================================================

export const CONSULTANT_STANDARD_TEMPLATES: ProvenWebsiteTemplate[] = [
  // Business Coaching (5)
  createStandardTemplate("coach-biz-1", "Business Strategy Consultant", "consultant", "business-strategy", {
    brandExamples: ["Top Business Coaches"],
  }),
  createStandardTemplate("coach-biz-2", "Marketing Consultant", "consultant", "marketing-consulting", {
    brandExamples: ["Marketing Experts"],
  }),
  createStandardTemplate("coach-biz-3", "Sales Coach", "consultant", "sales-coaching", {
    brandExamples: ["Sales Training Pros"],
  }),
  createStandardTemplate("coach-biz-4", "Leadership Coach", "consultant", "leadership", {
    brandExamples: ["Executive Coaches"],
  }),
  createStandardTemplate("coach-biz-5", "Startup Advisor", "consultant", "startup-consulting", {
    brandExamples: ["Startup Mentors"],
  }),

  // Life Coaching (5)
  createStandardTemplate("coach-life-1", "Life Coach", "consultant", "life-coaching", {
    brandExamples: ["Tony Robbins", "Brendon Burchard"],
  }),
  createStandardTemplate("coach-life-2", "Career Coach", "consultant", "career-coaching", {
    brandExamples: ["Career Advisors"],
  }),
  createStandardTemplate("coach-life-3", "Relationship Coach", "consultant", "relationship-coaching", {
    brandExamples: ["Relationship Experts"],
  }),
  createStandardTemplate("coach-life-4", "Mindfulness Coach", "consultant", "mindfulness", {
    brandExamples: ["Headspace Coaches"],
  }),
  createStandardTemplate("coach-life-5", "Financial Coach", "consultant", "financial-coaching", {
    brandExamples: ["Dave Ramsey"],
  }),

  // Specialized Coaching (5)
  createStandardTemplate("coach-spec-1", "Fitness Coach", "consultant", "fitness-coaching", {
    brandExamples: ["Personal Trainers"],
  }),
  createStandardTemplate("coach-spec-2", "Nutrition Coach", "consultant", "nutrition-coaching", {
    brandExamples: ["Registered Dietitians"],
  }),
  createStandardTemplate("coach-spec-3", "Public Speaking Coach", "consultant", "public-speaking", {
    brandExamples: ["Toastmasters Coaches"],
  }),
  createStandardTemplate("coach-spec-4", "Writing Coach", "consultant", "writing-coaching", {
    brandExamples: ["Author Mentors"],
  }),
  createStandardTemplate("coach-spec-5", "Productivity Coach", "consultant", "productivity", {
    brandExamples: ["GTD Coaches"],
  }),
];

// ============================================================================
// AGENCY TEMPLATES (10)
// ============================================================================

export const AGENCY_STANDARD_TEMPLATES: ProvenWebsiteTemplate[] = [
  createStandardTemplate("agency-1", "Digital Marketing Agency", "agency", "digital-marketing", {
    brandExamples: ["Marketing Agencies"],
  }),
  createStandardTemplate("agency-2", "Web Design Agency", "agency", "web-design", {
    brandExamples: ["Design Studios"],
  }),
  createStandardTemplate("agency-3", "Web Development Agency", "agency", "web-development", {
    brandExamples: ["Dev Shops"],
  }),
  createStandardTemplate("agency-4", "Branding Agency", "agency", "branding", {
    brandExamples: ["Brand Studios"],
  }),
  createStandardTemplate("agency-5", "SEO Agency", "agency", "seo-agency", {
    brandExamples: ["SEO Firms"],
  }),
  createStandardTemplate("agency-6", "Social Media Agency", "agency", "social-media-agency", {
    brandExamples: ["Social Agencies"],
  }),
  createStandardTemplate("agency-7", "Content Marketing Agency", "agency", "content-marketing", {
    brandExamples: ["Content Studios"],
  }),
  createStandardTemplate("agency-8", "Video Production Agency", "agency", "video-production", {
    brandExamples: ["Production Companies"],
  }),
  createStandardTemplate("agency-9", "PR Agency", "agency", "public-relations", {
    brandExamples: ["PR Firms"],
  }),
  createStandardTemplate("agency-10", "Full-Service Agency", "agency", "full-service", {
    brandExamples: ["Creative Agencies"],
  }),
];

// ============================================================================
// COMBINE ALL STANDARD TEMPLATES
// ============================================================================

export const ALL_STANDARD_TEMPLATES = [
  ...ECOMMERCE_STANDARD_TEMPLATES,
  ...SAAS_STANDARD_TEMPLATES,
  ...LOCAL_SERVICE_STANDARD_TEMPLATES,
  ...CONSULTANT_STANDARD_TEMPLATES,
  ...AGENCY_STANDARD_TEMPLATES,
];

export const STANDARD_TEMPLATES_COUNT = ALL_STANDARD_TEMPLATES.length;
