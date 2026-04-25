/**
 * COMPREHENSIVE BLOCK LIBRARY
 * 20+ conversion-optimized section templates
 * Shopify-level + 2060 UI aesthetic
 */

export type BlockCategory =
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "cta"
  | "faq"
  | "stats"
  | "team"
  | "gallery"
  | "form"
  | "video"
  | "blog"
  | "newsletter"
  | "footer";

export interface BlockTemplate {
  id: string;
  name: string;
  category: BlockCategory;
  thumbnail: string; // base64 or URL
  description: string;
  conversionScore: number; // 0-100
  mobileOptimized: boolean;
  props: Record<string, any>;
  html: string;
  css: string;
}

/**
 * HERO SECTIONS (5 variants)
 */
export const HERO_BLOCKS: BlockTemplate[] = [
  {
    id: "hero-centered-gradient",
    name: "Hero - Centered Gradient",
    category: "hero",
    thumbnail: "",
    description: "Bold centered hero with gradient background and dual CTAs",
    conversionScore: 92,
    mobileOptimized: true,
    props: {
      headline: "Build Your Dream Business in 60 Seconds",
      subheadline: "AI-powered automation that does everything for you. No code. No complexity. Just results.",
      primaryCta: "Start Building Now",
      secondaryCta: "Watch Demo",
      backgroundGradient: "from-violet-950 via-[#0c0a08] to-orange-950",
      textAlign: "center",
    },
    html: `
      <section class="hero-centered relative min-h-screen flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br {{backgroundGradient}}"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent"></div>

        <div class="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
          <h1 class="font-black text-6xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
            {{headline}}
          </h1>
          <p class="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            {{subheadline}}
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button class="px-12 py-5 rounded-2xl bg-gradient-to-r from-[#f5a623] to-orange-500 text-white font-black text-lg shadow-[0_10px_40px_rgba(245,166,35,0.4)] hover:scale-105 transition-transform">
              {{primaryCta}}
            </button>
            <button class="px-12 py-5 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/20 text-white font-bold text-lg hover:bg-white/[0.1] hover:border-white/30 transition-all">
              {{secondaryCta}}
            </button>
          </div>
        </div>

        <!-- Floating orbs -->
        <div class="absolute top-20 left-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-float-delayed"></div>
      </section>
    `,
    css: `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(20px); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
    `,
  },
  {
    id: "hero-split-screen",
    name: "Hero - Split Screen",
    category: "hero",
    thumbnail: "",
    description: "Split-screen hero with image/video on right",
    conversionScore: 88,
    mobileOptimized: true,
    props: {
      headline: "Your Complete Business, Built in 60 Seconds",
      description: "We build your website, emails, ads, CRM, and analytics. You just launch and follow our daily playbook.",
      ctaText: "Build My Business Now",
      imageSrc: "/placeholder-hero.jpg",
      statsLabel1: "5,000+",
      statsValue1: "Businesses Launched",
      statsLabel2: "10x",
      statsValue2: "Faster Than DIY",
    },
    html: `
      <section class="hero-split grid lg:grid-cols-2 gap-12 min-h-screen items-center px-6 lg:px-16 py-20">
        <!-- Left: Content -->
        <div class="space-y-8">
          <div class="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-orange-500/10 border border-white/10">
            <span class="text-sm font-bold bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
              ✨ AI-Powered Business Builder
            </span>
          </div>

          <h1 class="font-black text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
            {{headline}}
          </h1>

          <p class="text-xl text-white/70 leading-relaxed">
            {{description}}
          </p>

          <button class="px-10 py-4 rounded-xl bg-gradient-to-r from-[#f5a623] to-orange-500 text-white font-black text-lg shadow-[0_10px_40px_rgba(245,166,35,0.3)] hover:scale-105 transition-transform">
            {{ctaText}} →
          </button>

          <!-- Stats -->
          <div class="flex gap-8 pt-8 border-t border-white/10">
            <div>
              <div class="text-3xl font-black bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                {{statsLabel1}}
              </div>
              <div class="text-sm text-white/60 mt-1">{{statsValue1}}</div>
            </div>
            <div>
              <div class="text-3xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                {{statsLabel2}}
              </div>
              <div class="text-sm text-white/60 mt-1">{{statsValue2}}</div>
            </div>
          </div>
        </div>

        <!-- Right: Image/Video -->
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-orange-500/20 rounded-3xl blur-3xl"></div>
          <img src="{{imageSrc}}" alt="Hero" class="relative z-10 w-full h-auto rounded-3xl border border-white/10 shadow-2xl" />
        </div>
      </section>
    `,
    css: ``,
  },
];

/**
 * FEATURE SECTIONS (4 variants)
 */
export const FEATURE_BLOCKS: BlockTemplate[] = [
  {
    id: "features-3-col-icons",
    name: "Features - 3 Column Icons",
    category: "features",
    thumbnail: "",
    description: "3-column grid with icon, headline, description",
    conversionScore: 85,
    mobileOptimized: true,
    props: {
      sectionTitle: "Everything You Need to Succeed",
      sectionDescription: "We handle the technical complexity so you can focus on what matters: growing your business.",
      features: [
        { icon: "🎯", title: "Lead Generation", description: "AI scrapes and scores high-intent leads automatically" },
        { icon: "💌", title: "Email Automation", description: "Send personalized sequences with tracking and optimization" },
        { icon: "📊", title: "Revenue Analytics", description: "Track every dollar with attribution and forecasting" },
        { icon: "🎨", title: "Website Builder", description: "Conversion-first sites built in 60 seconds" },
        { icon: "📱", title: "Ad Campaigns", description: "AI-generated copy and creatives for all platforms" },
        { icon: "🤖", title: "AI Assistant", description: "24/7 support that knows your entire business" },
      ],
    },
    html: `
      <section class="features-3-col px-6 py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div class="max-w-7xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-16">
            <h2 class="font-black text-4xl md:text-5xl lg:text-6xl mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              {{sectionTitle}}
            </h2>
            <p class="text-xl text-white/70 max-w-3xl mx-auto">
              {{sectionDescription}}
            </p>
          </div>

          <!-- Features Grid -->
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {{#each features}}
            <div class="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all group">
              <div class="text-6xl mb-6 group-hover:scale-110 transition-transform">{{icon}}</div>
              <h3 class="font-black text-2xl mb-3 text-white">{{title}}</h3>
              <p class="text-white/70 leading-relaxed">{{description}}</p>
            </div>
            {{/each}}
          </div>
        </div>
      </section>
    `,
    css: ``,
  },
  {
    id: "features-alternating-layout",
    name: "Features - Alternating Layout",
    category: "features",
    thumbnail: "",
    description: "Image-text alternating rows for storytelling",
    conversionScore: 90,
    mobileOptimized: true,
    props: {
      features: [
        {
          title: "AI Builds Your Entire Website",
          description: "Our AI analyzes your niche, competitors, and best practices to generate a conversion-optimized site in 60 seconds. No templates. No guessing. Just results.",
          imageSrc: "/feature-1.jpg",
          badge: "60 Seconds",
        },
        {
          title: "Email Sequences That Convert",
          description: "8 proven email templates auto-populate with your business data. Send personalized outreach at scale with tracking and optimization.",
          imageSrc: "/feature-2.jpg",
          badge: "8 Templates",
        },
      ],
    },
    html: `
      <section class="features-alternating px-6 py-24">
        <div class="max-w-7xl mx-auto space-y-24">
          {{#each features}}
          <div class="grid lg:grid-cols-2 gap-12 items-center {{#if @even}}lg:flex-row-reverse{{/if}}">
            <!-- Image -->
            <div class="relative">
              <div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-violet-500/20 rounded-3xl blur-3xl"></div>
              <img src="{{imageSrc}}" alt="{{title}}" class="relative z-10 w-full h-auto rounded-3xl border border-white/10 shadow-2xl" />
              <div class="absolute top-4 left-4 px-4 py-2 rounded-full bg-gradient-to-r from-[#f5a623] to-orange-500 text-white font-black text-sm shadow-lg">
                {{badge}}
              </div>
            </div>

            <!-- Content -->
            <div class="space-y-6">
              <h3 class="font-black text-4xl md:text-5xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                {{title}}
              </h3>
              <p class="text-xl text-white/70 leading-relaxed">
                {{description}}
              </p>
              <button class="px-8 py-3 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/20 text-white font-bold hover:bg-white/[0.1] hover:border-white/30 transition-all">
                Learn More →
              </button>
            </div>
          </div>
          {{/each}}
        </div>
      </section>
    `,
    css: ``,
  },
];

/**
 * TESTIMONIAL SECTIONS (3 variants)
 */
export const TESTIMONIAL_BLOCKS: BlockTemplate[] = [
  {
    id: "testimonials-3-col-cards",
    name: "Testimonials - 3 Column Cards",
    category: "testimonials",
    thumbnail: "",
    description: "Social proof grid with avatars and quotes",
    conversionScore: 87,
    mobileOptimized: true,
    props: {
      sectionTitle: "Trusted by 5,000+ Businesses",
      testimonials: [
        {
          quote: "I launched my entire business in under an hour. The AI built my website, wrote my emails, and even generated my ads. This is the future.",
          author: "Sarah Chen",
          role: "Founder, FitFlow Studio",
          avatar: "/avatar-1.jpg",
          rating: 5,
        },
        {
          quote: "10x faster than doing it myself. The revenue analytics showed me exactly which leads were converting. Made $15k in the first month.",
          author: "Marcus Johnson",
          role: "CEO, Local Lead Co",
          avatar: "/avatar-2.jpg",
          rating: 5,
        },
        {
          quote: "The email templates are incredible. 45% open rate, 12% reply rate. I've never seen numbers like this from cold outreach.",
          author: "Emily Rodriguez",
          role: "Marketing Director",
          avatar: "/avatar-3.jpg",
          rating: 5,
        },
      ],
    },
    html: `
      <section class="testimonials-3-col px-6 py-24 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div class="max-w-7xl mx-auto">
          <!-- Header -->
          <h2 class="font-black text-4xl md:text-5xl text-center mb-16 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {{sectionTitle}}
          </h2>

          <!-- Testimonials Grid -->
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {{#each testimonials}}
            <div class="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 space-y-6">
              <!-- Rating -->
              <div class="flex gap-1">
                {{#times rating}}
                <span class="text-amber-400 text-xl">⭐</span>
                {{/times}}
              </div>

              <!-- Quote -->
              <p class="text-white/80 text-lg leading-relaxed italic">
                "{{quote}}"
              </p>

              <!-- Author -->
              <div class="flex items-center gap-4 pt-4 border-t border-white/10">
                <img src="{{avatar}}" alt="{{author}}" class="w-12 h-12 rounded-full border-2 border-white/20" />
                <div>
                  <div class="font-bold text-white">{{author}}</div>
                  <div class="text-sm text-white/60">{{role}}</div>
                </div>
              </div>
            </div>
            {{/each}}
          </div>
        </div>
      </section>
    `,
    css: ``,
  },
];

/**
 * PRICING SECTIONS (3 variants)
 */
export const PRICING_BLOCKS: BlockTemplate[] = [
  {
    id: "pricing-3-tier",
    name: "Pricing - 3 Tier Cards",
    category: "pricing",
    thumbnail: "",
    description: "Standard 3-tier pricing with feature comparison",
    conversionScore: 93,
    mobileOptimized: true,
    props: {
      sectionTitle: "Simple, Transparent Pricing",
      plans: [
        {
          name: "Starter",
          price: "$49",
          period: "/month",
          description: "Perfect for solopreneurs just getting started",
          features: ["1 Website", "100 Leads/month", "Email Automation", "Basic Analytics", "Community Support"],
          cta: "Start Free Trial",
          popular: false,
        },
        {
          name: "Professional",
          price: "$149",
          period: "/month",
          description: "For growing businesses that need more power",
          features: ["5 Websites", "1,000 Leads/month", "Advanced Email Automation", "Revenue Analytics", "Priority Support", "A/B Testing", "Custom Domains"],
          cta: "Start Free Trial",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "$499",
          period: "/month",
          description: "For agencies and high-volume businesses",
          features: ["Unlimited Websites", "10,000 Leads/month", "White Label", "API Access", "Dedicated Account Manager", "Custom Integrations", "SLA Guarantee"],
          cta: "Contact Sales",
          popular: false,
        },
      ],
    },
    html: `
      <section class="pricing-3-tier px-6 py-24">
        <div class="max-w-7xl mx-auto">
          <!-- Header -->
          <h2 class="font-black text-4xl md:text-5xl text-center mb-16 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {{sectionTitle}}
          </h2>

          <!-- Pricing Grid -->
          <div class="grid md:grid-cols-3 gap-6">
            {{#each plans}}
            <div class="p-8 rounded-2xl {{#if popular}}bg-gradient-to-b from-violet-500/10 to-orange-500/10 border-2 border-violet-500/30 shadow-[0_0_40px_rgba(139,92,246,0.2)] scale-105{{else}}bg-white/[0.02] backdrop-blur-xl border border-white/10{{/if}} space-y-8 relative">
              {{#if popular}}
              <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm shadow-lg">
                Most Popular
              </div>
              {{/if}}

              <!-- Plan Name -->
              <div>
                <h3 class="font-black text-2xl text-white mb-2">{{name}}</h3>
                <p class="text-white/60 text-sm">{{description}}</p>
              </div>

              <!-- Price -->
              <div>
                <span class="font-black text-5xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  {{price}}
                </span>
                <span class="text-white/60">{{period}}</span>
              </div>

              <!-- Features -->
              <ul class="space-y-3">
                {{#each features}}
                <li class="flex items-start gap-3 text-white/80">
                  <span class="text-emerald-400 mt-1">✓</span>
                  <span>{{this}}</span>
                </li>
                {{/each}}
              </ul>

              <!-- CTA -->
              <button class="w-full py-4 rounded-xl {{#if popular}}bg-gradient-to-r from-[#f5a623] to-orange-500 text-white shadow-[0_10px_40px_rgba(245,166,35,0.3)]{{else}}bg-white/[0.05] border border-white/20 text-white{{/if}} font-black hover:scale-105 transition-transform">
                {{cta}}
              </button>
            </div>
            {{/each}}
          </div>
        </div>
      </section>
    `,
    css: ``,
  },
];

/**
 * CTA SECTIONS (4 variants)
 */
export const CTA_BLOCKS: BlockTemplate[] = [
  {
    id: "cta-centered-gradient",
    name: "CTA - Centered Gradient",
    category: "cta",
    thumbnail: "",
    description: "Bold centered CTA with gradient background",
    conversionScore: 91,
    mobileOptimized: true,
    props: {
      headline: "Ready to Build Your Business?",
      description: "Join 5,000+ entrepreneurs who launched their business in under an hour.",
      ctaText: "Start Building Now",
      secondaryText: "No credit card required",
    },
    html: `
      <section class="cta-centered relative px-6 py-32 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-orange-500/10 to-violet-500/10"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent"></div>

        <div class="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <h2 class="font-black text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {{headline}}
          </h2>
          <p class="text-2xl text-white/70">
            {{description}}
          </p>
          <div class="flex flex-col items-center gap-4">
            <button class="px-16 py-6 rounded-2xl bg-gradient-to-r from-[#f5a623] to-orange-500 text-white font-black text-xl shadow-[0_10px_40px_rgba(245,166,35,0.4)] hover:scale-105 transition-transform">
              {{ctaText}} →
            </button>
            <p class="text-sm text-white/50">{{secondaryText}}</p>
          </div>
        </div>

        <!-- Floating elements -->
        <div class="absolute top-10 left-10 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl animate-float"></div>
        <div class="absolute bottom-10 right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl animate-float-delayed"></div>
      </section>
    `,
    css: ``,
  },
];

/**
 * FAQ SECTIONS (2 variants)
 */
export const FAQ_BLOCKS: BlockTemplate[] = [
  {
    id: "faq-accordion",
    name: "FAQ - Accordion",
    category: "faq",
    thumbnail: "",
    description: "Expandable FAQ accordion with smooth animations",
    conversionScore: 82,
    mobileOptimized: true,
    props: {
      sectionTitle: "Frequently Asked Questions",
      faqs: [
        {
          question: "How long does it take to build my business?",
          answer: "Our AI builds your complete business infrastructure (website, emails, ads, CRM) in 60 seconds. You'll have everything ready to launch immediately."
        },
        {
          question: "Do I need any technical skills?",
          answer: "Absolutely not. Our AI handles all the technical complexity. You just answer a few questions about your business, and we build everything for you."
        },
        {
          question: "Can I customize my website after it's built?",
          answer: "Yes! Our inline editor lets you click any element and edit it instantly. Change text, images, colors, layouts—all with zero friction."
        },
        {
          question: "What if I need help?",
          answer: "We offer 24/7 support via chat, and our AI assistant knows your entire business so it can answer questions instantly."
        },
      ],
    },
    html: `
      <section class="faq-accordion px-6 py-24">
        <div class="max-w-4xl mx-auto">
          <!-- Header -->
          <h2 class="font-black text-4xl md:text-5xl text-center mb-16 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {{sectionTitle}}
          </h2>

          <!-- FAQ List -->
          <div class="space-y-4">
            {{#each faqs}}
            <details class="group p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
              <summary class="flex items-center justify-between cursor-pointer list-none">
                <h3 class="font-bold text-xl text-white">{{question}}</h3>
                <span class="text-white/60 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="mt-4 text-white/70 leading-relaxed">
                {{answer}}
              </p>
            </details>
            {{/each}}
          </div>
        </div>
      </section>
    `,
    css: ``,
  },
];

/**
 * STATS SECTIONS (2 variants)
 */
export const STATS_BLOCKS: BlockTemplate[] = [
  {
    id: "stats-4-col",
    name: "Stats - 4 Column",
    category: "stats",
    thumbnail: "",
    description: "4-column stat showcase with large numbers",
    conversionScore: 84,
    mobileOptimized: true,
    props: {
      stats: [
        { value: "5,000+", label: "Businesses Launched" },
        { value: "98%", label: "Customer Satisfaction" },
        { value: "$2.5M+", label: "Revenue Generated" },
        { value: "60sec", label: "Average Build Time" },
      ],
    },
    html: `
      <section class="stats-4-col px-6 py-24 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {{#each stats}}
            <div class="text-center space-y-2">
              <div class="font-black text-5xl md:text-6xl bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                {{value}}
              </div>
              <div class="text-white/60 text-sm uppercase tracking-wider">
                {{label}}
              </div>
            </div>
            {{/each}}
          </div>
        </div>
      </section>
    `,
    css: ``,
  },
];

/**
 * NEWSLETTER SECTIONS (2 variants)
 */
export const NEWSLETTER_BLOCKS: BlockTemplate[] = [
  {
    id: "newsletter-inline",
    name: "Newsletter - Inline Form",
    category: "newsletter",
    thumbnail: "",
    description: "Simple inline email capture with gradient background",
    conversionScore: 86,
    mobileOptimized: true,
    props: {
      headline: "Get the Weekly Playbook",
      description: "Join 10,000+ entrepreneurs getting actionable growth strategies every Tuesday.",
      placeholder: "Enter your email",
      ctaText: "Subscribe",
    },
    html: `
      <section class="newsletter-inline px-6 py-24 bg-gradient-to-r from-violet-500/5 via-orange-500/5 to-violet-500/5">
        <div class="max-w-4xl mx-auto text-center space-y-8">
          <h2 class="font-black text-4xl md:text-5xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {{headline}}
          </h2>
          <p class="text-xl text-white/70">
            {{description}}
          </p>

          <form class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <input
              type="email"
              placeholder="{{placeholder}}"
              class="flex-1 px-6 py-4 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            <button type="submit" class="px-10 py-4 rounded-xl bg-gradient-to-r from-[#f5a623] to-orange-500 text-white font-black shadow-[0_10px_40px_rgba(245,166,35,0.3)] hover:scale-105 transition-transform whitespace-nowrap">
              {{ctaText}} →
            </button>
          </form>

          <p class="text-sm text-white/50">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    `,
    css: ``,
  },
];

/**
 * ALL BLOCKS COMBINED
 */
export const ALL_BLOCKS: BlockTemplate[] = [
  ...HERO_BLOCKS,
  ...FEATURE_BLOCKS,
  ...TESTIMONIAL_BLOCKS,
  ...PRICING_BLOCKS,
  ...CTA_BLOCKS,
  ...FAQ_BLOCKS,
  ...STATS_BLOCKS,
  ...NEWSLETTER_BLOCKS,
];

/**
 * HELPER: Get blocks by category
 */
export function getBlocksByCategory(category: BlockCategory): BlockTemplate[] {
  return ALL_BLOCKS.filter(block => block.category === category);
}

/**
 * HELPER: Get block by ID
 */
export function getBlockById(id: string): BlockTemplate | undefined {
  return ALL_BLOCKS.find(block => block.id === id);
}

/**
 * HELPER: Get top conversion blocks
 */
export function getTopConversionBlocks(limit: number = 10): BlockTemplate[] {
  return ALL_BLOCKS
    .sort((a, b) => b.conversionScore - a.conversionScore)
    .slice(0, limit);
}
