// ─────────────────────────────────────────────────────────────────────────────
// KWANUS AD OS — Site Templates
// Pre-built page structures for the website builder.
// Each template defines an array of blocks matching the BlockType system
// in components/site-builder/BlockRenderer.tsx
// ─────────────────────────────────────────────────────────────────────────────

export type TemplateCategory = "landing" | "funnel" | "store" | "portfolio" | "service";

export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string; // emoji for now
  pages: {
    name: string;
    slug: string;
    blocks: {
      type: string;
      props: Record<string, unknown>;
    }[];
  }[];
}

// ─── Template: High-Converting Landing Page ──────────────────────────────────

const highConvertingLanding: SiteTemplate = {
  id: "high-converting-landing",
  name: "High-Converting Landing Page",
  description: "Proven structure: urgency bar → hero → social proof → features → testimonials → CTA → FAQ → guarantee → footer.",
  category: "landing",
  thumbnail: "🎯",
  pages: [
    {
      name: "Home",
      slug: "home",
      blocks: [
        {
          type: "urgency",
          props: {
            text: "⚡ Limited Time — Get 50% Off Today Only!",
            items: ["Offer ends at midnight", "Only 12 spots left"],
          },
        },
        {
          type: "hero",
          props: {
            headline: "Stop Losing Customers to Your Competitors",
            subheadline: "Get a professional growth system that brings in leads on autopilot — no tech skills required.",
            buttonText: "Get Started Free",
            buttonUrl: "#pricing",
            textAlign: "center",
            socialProofText: "Trusted by 500+ businesses",
            trustItems: ["No contracts", "Cancel anytime", "Results in 14 days"],
          },
        },
        {
          type: "stats",
          props: {
            stats: [
              { number: "500+", label: "Businesses Served" },
              { number: "3x", label: "Average Lead Increase" },
              { number: "98%", label: "Client Satisfaction" },
              { number: "14 days", label: "To First Results" },
            ],
          },
        },
        {
          type: "before_after",
          props: {
            title: "The Difference We Make",
            beforeLabel: "Without Our System",
            afterLabel: "With Our System",
            beforeItems: [
              "No consistent lead flow",
              "Invisible to search engines",
              "Losing deals to competitors",
              "Wasting money on ads that don't convert",
            ],
            afterItems: [
              "Predictable stream of qualified leads",
              "Ranking above competitors locally",
              "Closing more deals with less effort",
              "Every marketing dollar tracked and optimized",
            ],
          },
        },
        {
          type: "features",
          props: {
            eyebrow: "Everything you need",
            title: "One System to Replace Them All",
            columns: 3,
            items: [
              { icon: "🎯", title: "Lead Generation", body: "Automated systems that find and qualify your ideal clients while you sleep." },
              { icon: "📊", title: "Smart Analytics", body: "Know exactly which campaigns are working and where every dollar goes." },
              { icon: "⚡", title: "Fast Deployment", body: "Go from zero to live campaign in under 48 hours. No waiting weeks." },
              { icon: "🔄", title: "Automated Follow-Up", body: "Never lose a lead again with intelligent email and SMS sequences." },
              { icon: "🛡️", title: "Proven Templates", body: "Battle-tested ad hooks, landing pages, and email sequences included." },
              { icon: "📱", title: "Mobile Optimized", body: "Everything looks perfect on every device. No extra work needed." },
            ],
          },
        },
        {
          type: "process",
          props: {
            eyebrow: "Simple as 1-2-3",
            title: "How It Works",
            steps: [
              { icon: "1", title: "Tell Us About Your Business", body: "Answer 5 quick questions and our AI builds a custom strategy for your niche." },
              { icon: "2", title: "We Build Your System", body: "Landing pages, ad campaigns, and email sequences — all tailored to your market." },
              { icon: "3", title: "Watch Leads Come In", body: "Launch and start seeing results within the first 14 days. Track everything in one dashboard." },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            eyebrow: "Real results",
            title: "What Our Clients Say",
            items: [
              { name: "Sarah Johnson", role: "Owner", company: "Green Valley Spa", quote: "Within 2 weeks of launching, our inquiries tripled. The system basically runs itself.", stars: 5, result: "+300% Leads", verified: true },
              { name: "Mike Torres", role: "Founder", company: "Torres HVAC", quote: "First time in 15 years I've been booked out 3 months ahead. This changed everything.", stars: 5, result: "Booked Out", verified: true },
              { name: "Lisa Chen", role: "CEO", company: "Bloom Beauty Co.", quote: "We went from 2 online sales per week to 15+. The email sequences are gold.", stars: 5, result: "+650% Sales", verified: true },
            ],
          },
        },
        {
          type: "pricing",
          props: {
            eyebrow: "Simple pricing",
            title: "Choose Your Plan",
            tiers: [
              { label: "Starter", price: "$0", period: "/mo", description: "Try it risk-free.", features: ["1 landing page", "Basic analytics", "Email support"], buttonText: "Start Free" },
              { label: "Growth", price: "$49", period: "/mo", description: "Everything to scale.", features: ["Unlimited pages", "Advanced analytics", "Priority support", "Custom domain", "AI content", "Email sequences"], buttonText: "Start Growing", highlight: true, badge: "Most Popular" },
              { label: "Agency", price: "$149", period: "/mo", description: "For teams & agencies.", features: ["Everything in Growth", "White-label", "Client management", "API access", "Dedicated support"], buttonText: "Go Agency" },
            ],
            guarantee: "30-day money-back guarantee — no questions asked.",
          },
        },
        {
          type: "faq",
          props: {
            eyebrow: "Questions?",
            title: "Frequently Asked Questions",
            items: [
              { q: "How quickly will I see results?", a: "Most clients see measurable improvement within 14 days. Website traffic typically starts climbing within the first week." },
              { q: "Do I need technical experience?", a: "None at all. Everything is done for you — no coding, no design skills required." },
              { q: "What if it doesn't work for my business?", a: "30-day money-back guarantee. If you don't see improvement, we refund every penny." },
              { q: "Can I cancel anytime?", a: "Yes. No contracts, no commitments. Cancel with one click whenever you want." },
            ],
            ctaText: "Still have questions?",
            ctaButtonText: "Chat With Us",
          },
        },
        {
          type: "guarantee",
          props: {
            icon: "🛡️",
            headline: "100% Money-Back Guarantee",
            body: "We stand behind every plan with a 30-day money-back guarantee. If you don't see real improvement in your lead flow, we'll refund every penny. No questions asked.",
          },
        },
        {
          type: "cta",
          props: {
            eyebrow: "Ready to grow?",
            headline: "Stop Losing Leads. Start Growing Today.",
            subheadline: "Join 500+ businesses already seeing results with our proven system.",
            buttonText: "Get Started Free →",
            secondaryButtonText: "See How It Works",
            trustItems: ["No credit card required", "Setup in 5 minutes", "Cancel anytime"],
          },
        },
        {
          type: "footer",
          props: {
            copyright: `© ${new Date().getFullYear()} All rights reserved.`,
            links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms of Service", url: "#" }],
            showPoweredBy: true,
          },
        },
      ],
    },
  ],
};

// ─── Template: Lead Magnet Opt-In ────────────────────────────────────────────

const leadMagnetOptIn: SiteTemplate = {
  id: "lead-magnet-optin",
  name: "Lead Magnet Opt-In Page",
  description: "Simple, focused opt-in page to capture emails with a free resource.",
  category: "landing",
  thumbnail: "📧",
  pages: [
    {
      name: "Home",
      slug: "home",
      blocks: [
        {
          type: "hero",
          props: {
            headline: "Free Guide: The 7-Step System to Double Your Revenue",
            subheadline: "Download the exact playbook used by 200+ businesses to grow faster without spending more on ads.",
            buttonText: "Download Free Guide →",
            buttonUrl: "#",
            textAlign: "center",
            socialProofText: "Downloaded 2,400+ times",
            trustItems: ["100% Free", "No spam ever", "Instant download"],
          },
        },
        {
          type: "features",
          props: {
            eyebrow: "Inside the guide",
            title: "What You'll Learn",
            columns: 2,
            items: [
              { icon: "📊", title: "The Revenue Formula", body: "The exact math behind scaling from $5K to $50K/month." },
              { icon: "🎯", title: "Client Acquisition", body: "3 proven channels that generate leads without cold calling." },
              { icon: "⚡", title: "Speed to Close", body: "How to cut your sales cycle in half with automated follow-up." },
              { icon: "🔄", title: "Retention Playbook", body: "Keep clients longer and increase lifetime value by 40%." },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            eyebrow: "From our readers",
            title: "What People Are Saying",
            items: [
              { name: "David Park", role: "Consultant", company: "Park Strategy", quote: "This guide had more actionable advice than courses I paid $2,000 for.", stars: 5, result: "Grew 2x", verified: true },
              { name: "Amy Rodriguez", role: "Owner", company: "Bright Dental", quote: "Implemented step 3 and got 40 new patient inquiries in one month.", stars: 5, result: "+40 Leads/mo", verified: true },
            ],
          },
        },
        {
          type: "cta",
          props: {
            eyebrow: "Get your copy",
            headline: "Download the Free Guide Now",
            subheadline: "Join 2,400+ business owners who already have the playbook.",
            buttonText: "Download Free Guide →",
            trustItems: ["Instant access", "No credit card", "Unsubscribe anytime"],
          },
        },
        {
          type: "footer",
          props: {
            copyright: `© ${new Date().getFullYear()} All rights reserved.`,
            links: [{ label: "Privacy", url: "#" }],
            showPoweredBy: true,
          },
        },
      ],
    },
  ],
};

// ─── Template: Service Business ──────────────────────────────────────────────

const serviceBusinessSite: SiteTemplate = {
  id: "service-business",
  name: "Local Service Business",
  description: "Multi-page site for local services: home, about, services, contact.",
  category: "service",
  thumbnail: "🏪",
  pages: [
    {
      name: "Home",
      slug: "home",
      blocks: [
        {
          type: "hero",
          props: {
            headline: "The #1 Rated [Service] in [City]",
            subheadline: "Family-owned, locally trusted. We deliver results you can see — guaranteed.",
            buttonText: "Get a Free Quote",
            buttonUrl: "#contact",
            textAlign: "center",
            socialProofText: "200+ 5-star reviews",
            trustItems: ["Licensed & insured", "Same-day service", "Free estimates"],
          },
        },
        {
          type: "stats",
          props: {
            stats: [
              { number: "15+", label: "Years Experience" },
              { number: "200+", label: "5-Star Reviews" },
              { number: "5,000+", label: "Jobs Completed" },
              { number: "100%", label: "Satisfaction Guarantee" },
            ],
          },
        },
        {
          type: "features",
          props: {
            eyebrow: "Our services",
            title: "What We Do",
            columns: 3,
            items: [
              { icon: "🔧", title: "Repairs", body: "Fast, reliable repairs for any issue. Most jobs completed same-day." },
              { icon: "🏗️", title: "Installation", body: "Professional installation with a workmanship warranty on every job." },
              { icon: "🔍", title: "Inspections", body: "Thorough inspections with detailed reports and honest recommendations." },
            ],
          },
        },
        {
          type: "process",
          props: {
            eyebrow: "Easy as",
            title: "How to Get Started",
            steps: [
              { icon: "1", title: "Call or Book Online", body: "Reach us anytime. We respond within 1 hour during business hours." },
              { icon: "2", title: "Free On-Site Estimate", body: "We come to you, assess the situation, and give you an honest quote." },
              { icon: "3", title: "We Get to Work", body: "Scheduled at your convenience. Clean, professional, guaranteed." },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            eyebrow: "Our customers",
            title: "What Homeowners Say",
            items: [
              { name: "Robert K.", role: "Homeowner", company: "Austin, TX", quote: "Called at 8am, they were here by 10. Problem fixed by noon. Best service I've had.", stars: 5, result: "Same-Day Fix", verified: true },
              { name: "Jennifer M.", role: "Homeowner", company: "Austin, TX", quote: "Fair pricing, honest assessment, quality work. They're my go-to now.", stars: 5, result: "Repeat Client", verified: true },
            ],
          },
        },
        {
          type: "guarantee",
          props: {
            icon: "🛡️",
            headline: "Our Guarantee",
            body: "Every job comes with our satisfaction guarantee. If you're not 100% happy with the work, we'll come back and make it right — free of charge.",
          },
        },
        {
          type: "cta",
          props: {
            eyebrow: "Get started",
            headline: "Ready for a Free Estimate?",
            subheadline: "Call now or book online. We respond within 1 hour.",
            buttonText: "Get Free Quote →",
            secondaryButtonText: "Call (555) 000-0000",
            trustItems: ["No obligation", "Licensed & insured", "Same-day availability"],
          },
        },
        {
          type: "footer",
          props: {
            copyright: `© ${new Date().getFullYear()} All rights reserved.`,
            links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms", url: "#" }, { label: "Sitemap", url: "#" }],
            showPoweredBy: true,
          },
        },
      ],
    },
  ],
};

// ─── Template: Product Sales Funnel ──────────────────────────────────────────

const productSalesFunnel: SiteTemplate = {
  id: "product-sales-funnel",
  name: "Product Sales Funnel",
  description: "High-converting product page with urgency, social proof, and checkout.",
  category: "funnel",
  thumbnail: "🛒",
  pages: [
    {
      name: "Sales Page",
      slug: "home",
      blocks: [
        {
          type: "urgency",
          props: {
            text: "🔥 Flash Sale — 60% Off Ends Tonight!",
            items: ["Limited stock available", "Price goes up at midnight"],
          },
        },
        {
          type: "hero",
          props: {
            headline: "Finally — A [Product] That Actually Works",
            subheadline: "Join 10,000+ happy customers who stopped settling for mediocre results.",
            buttonText: "Claim Your 60% Discount →",
            buttonUrl: "#checkout",
            textAlign: "center",
            socialProofText: "10,000+ sold",
            trustItems: ["Free shipping", "60-day guarantee", "Secure checkout"],
          },
        },
        {
          type: "before_after",
          props: {
            title: "See the Difference",
            beforeLabel: "Before",
            afterLabel: "After",
            beforeItems: ["Frustrating results", "Wasted money on alternatives", "No visible improvement", "Ready to give up"],
            afterItems: ["Visible results in days", "Best investment you'll make", "Consistent improvement", "Confidence restored"],
          },
        },
        {
          type: "features",
          props: {
            eyebrow: "Why it works",
            title: "What Makes This Different",
            columns: 3,
            items: [
              { icon: "🧬", title: "Premium Formula", body: "Developed with leading experts using only the highest quality ingredients." },
              { icon: "⚡", title: "Fast-Acting", body: "See real, measurable results within the first 7 days of use." },
              { icon: "✅", title: "Clinically Tested", body: "Backed by research and validated by independent testing." },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            eyebrow: "Real reviews",
            title: "What Customers Are Saying",
            items: [
              { name: "Jessica T.", role: "Verified Buyer", company: "", quote: "I was skeptical but this actually delivered. Seeing real results after just one week.", stars: 5, result: "Week 1 Results", verified: true },
              { name: "Marcus D.", role: "Verified Buyer", company: "", quote: "Best purchase I've made all year. Already ordered a second one for my wife.", stars: 5, result: "Repeat Buyer", verified: true },
              { name: "Karen L.", role: "Verified Buyer", company: "", quote: "The quality is incredible for the price, especially with the discount. Highly recommend.", stars: 5, result: "5 Stars", verified: true },
            ],
          },
        },
        {
          type: "trust_badges",
          props: {
            title: "Shop With Confidence",
            badges: [
              { icon: "🔒", label: "Secure Checkout" },
              { icon: "🚚", label: "Free Shipping" },
              { icon: "🔄", label: "60-Day Returns" },
              { icon: "✅", label: "Verified Reviews" },
              { icon: "💳", label: "All Cards Accepted" },
            ],
          },
        },
        {
          type: "checkout",
          props: {
            title: "Complete Your Order",
            productName: "Premium Product Bundle",
            price: "$39.97",
            buttonText: "Complete Purchase →",
            showOrderBump: true,
          },
        },
        {
          type: "guarantee",
          props: {
            icon: "🛡️",
            headline: "60-Day Money-Back Guarantee",
            body: "Try it completely risk-free. If you don't love it, send it back for a full refund. No questions, no hassle.",
          },
        },
        {
          type: "footer",
          props: {
            copyright: `© ${new Date().getFullYear()} All rights reserved.`,
            links: [{ label: "Privacy", url: "#" }, { label: "Terms", url: "#" }, { label: "Contact", url: "#" }],
            showPoweredBy: true,
          },
        },
      ],
    },
  ],
};

// ─── Template: Agency Portfolio ──────────────────────────────────────────────

const agencyPortfolio: SiteTemplate = {
  id: "agency-portfolio",
  name: "Agency Portfolio",
  description: "Modern dark portfolio for agencies: results-driven positioning, case studies, services.",
  category: "portfolio",
  thumbnail: "💼",
  pages: [
    {
      name: "Home",
      slug: "home",
      blocks: [
        {
          type: "hero",
          props: {
            headline: "We Build Growth Machines for Ambitious Brands",
            subheadline: "Strategy, creative, and performance marketing — all under one roof. We've generated $14M+ in trackable revenue for our clients.",
            buttonText: "See Our Work",
            buttonUrl: "#results",
            textAlign: "center",
            socialProofText: "$14M+ revenue generated",
            trustItems: ["Meta Partner", "Google Certified", "50+ active clients"],
          },
        },
        {
          type: "stats",
          props: {
            stats: [
              { number: "$14M+", label: "Revenue Generated" },
              { number: "50+", label: "Active Clients" },
              { number: "4.2x", label: "Average ROAS" },
              { number: "97%", label: "Retention Rate" },
            ],
          },
        },
        {
          type: "features",
          props: {
            eyebrow: "What we do",
            title: "Full-Stack Growth Services",
            columns: 3,
            items: [
              { icon: "📊", title: "Paid Media", body: "Facebook, Instagram, Google, TikTok — we manage $2M+/month in ad spend across platforms." },
              { icon: "🎨", title: "Creative Studio", body: "In-house creative team producing thumb-stopping ads, landing pages, and brand assets." },
              { icon: "📧", title: "Email & CRM", body: "Lifecycle marketing that turns one-time buyers into repeat customers." },
              { icon: "🔍", title: "SEO & Content", body: "Organic growth strategies that compound over time." },
              { icon: "⚡", title: "CRO", body: "Conversion rate optimization that squeezes more revenue from every visitor." },
              { icon: "📱", title: "Web Development", body: "Custom sites and funnels built for speed and conversion." },
            ],
          },
        },
        {
          type: "process",
          props: {
            eyebrow: "Our process",
            title: "How We Work",
            steps: [
              { icon: "1", title: "Discovery Call", body: "We learn your business, goals, and current challenges in a 30-minute call." },
              { icon: "2", title: "Strategy & Proposal", body: "Custom strategy with projected timelines, budgets, and expected outcomes." },
              { icon: "3", title: "Launch & Scale", body: "We execute, optimize, and report weekly. You focus on running your business." },
            ],
          },
        },
        {
          type: "testimonials",
          props: {
            eyebrow: "Client results",
            title: "Don't Take Our Word for It",
            items: [
              { name: "James Wright", role: "CEO", company: "NovaFit", quote: "They took our ROAS from 1.2x to 5.1x in 90 days. The best agency investment we've made.", stars: 5, result: "5.1x ROAS", verified: true },
              { name: "Priya Sharma", role: "Founder", company: "Bloom Skincare", quote: "From $30K/mo to $180K/mo in revenue in 6 months. Their email flows alone pay for the retainer.", stars: 5, result: "6x Revenue", verified: true },
            ],
          },
        },
        {
          type: "cta",
          props: {
            eyebrow: "Let's talk",
            headline: "Ready to Scale?",
            subheadline: "Book a free 30-minute strategy call. No pitch, just a roadmap.",
            buttonText: "Book Strategy Call →",
            trustItems: ["Free consultation", "No obligations", "Custom strategy"],
          },
        },
        {
          type: "footer",
          props: {
            copyright: `© ${new Date().getFullYear()} All rights reserved.`,
            links: [{ label: "Privacy", url: "#" }, { label: "Terms", url: "#" }, { label: "Careers", url: "#" }],
            showPoweredBy: true,
          },
        },
      ],
    },
  ],
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const SITE_TEMPLATES: SiteTemplate[] = [
  highConvertingLanding,
  leadMagnetOptIn,
  serviceBusinessSite,
  productSalesFunnel,
  agencyPortfolio,
];

export function getTemplateById(id: string): SiteTemplate | undefined {
  return SITE_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): SiteTemplate[] {
  return SITE_TEMPLATES.filter((t) => t.category === category);
}
