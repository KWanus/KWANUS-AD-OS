export type BusinessType =
  | "local_service"
  | "consultant_coach"
  | "affiliate"
  | "dropship"
  | "agency"
  | "ecommerce"
  | "saas"
  | "content_creator"
  | "financial"
  | "real_estate";

export type SystemSlug =
  | "website"
  | "google_ads"
  | "facebook_ads"
  | "tiktok_ads"
  | "email_sequence"
  | "sms_followup"
  | "crm_pipeline"
  | "review_system"
  | "gmb_optimization"
  | "content_calendar"
  | "affiliate_funnel"
  | "bridge_page"
  | "product_page"
  | "abandoned_cart"
  | "lead_magnet"
  | "booking_flow"
  | "proposal_system"
  | "retainer_model"
  | "case_studies"
  | "referral_system"
  | "upsell_flow"
  | "appointment_reminder"
  | "citation_builder"
  | "youtube_channel"
  | "podcast_system"
  | "white_label_reports";

export interface SystemBlueprint {
  slug: SystemSlug;
  name: string;
  description: string;
  priority: "essential" | "recommended" | "optional";
  estimatedImpact: string;
  timeToActivate: string;
  why: string;
}

export interface FunnelStage {
  name: string;
  goal: string;
  conversionTriggers: string[];
}

export interface BusinessArchetype {
  type: BusinessType;
  label: string;
  emoji: string;
  description: string;
  acquisitionModel: string;
  salesProcess: string;
  decisionWindow: string;
  trustRequirements: string[];
  conversionTriggers: string[];
  buyerAwarenessLevel: string;
  averageDealSize: string;
  funnelType: string;
  crmStages: string[];
  contentStyle: string;
  topObjections: string[];
  winningAngles: string[];
  systems: SystemBlueprint[];
  niches: string[];
  psychologyPrinciples: string[];
}

export const ARCHETYPES: Record<BusinessType, BusinessArchetype> = {
  local_service: {
    type: "local_service",
    label: "Local Service Business",
    emoji: "🔧",
    description: "HVAC, plumbing, roofing, landscaping, cleaning, electrical, pest control, and similar trade/home service businesses.",
    acquisitionModel: "Google search intent + local visibility + referrals",
    salesProcess: "Lead → Phone call → Quote → Book → Complete → Review",
    decisionWindow: "immediate",
    trustRequirements: ["Local reviews", "Licensed/insured badge", "Before/after photos", "Response time", "Local number"],
    conversionTriggers: ["Urgency (broken/emergency)", "Price clarity", "Social proof from neighbors", "Speed of response", "Guarantee"],
    buyerAwarenessLevel: "Problem aware to solution aware",
    averageDealSize: "$200–$5,000",
    funnelType: "Direct response lead generation → phone/form → fast follow-up",
    crmStages: ["New Lead", "Called", "Quoted", "Booked", "In Progress", "Completed", "Review Requested", "Referred"],
    contentStyle: "Educational + proof-based. Before/afters. How-to tips. Local community focus.",
    topObjections: ["Too expensive", "Can you come today?", "Are you licensed?", "Will you show up?", "I got a cheaper quote"],
    winningAngles: ["Emergency/urgency", "Neighborhood trust ('your neighbors use us')", "Price + speed guarantee", "Same-day service"],
    systems: [
      { slug: "website", name: "Local Lead Gen Website", description: "Call-focused site with trust signals, reviews, and service area pages", priority: "essential", estimatedImpact: "3-5x more inbound calls", timeToActivate: "15 min", why: "98% of local buyers check the website before calling. No website = no trust = no job." },
      { slug: "google_ads", name: "Google Search Ads", description: "Capture emergency buyers searching right now", priority: "essential", estimatedImpact: "Immediate lead flow within 24 hours", timeToActivate: "20 min", why: "Local service buyers have high intent and small decision windows. Google captures them at peak urgency." },
      { slug: "review_system", name: "Automated Review System", description: "SMS + email review requests after each job", priority: "essential", estimatedImpact: "10-20 new Google reviews/month", timeToActivate: "5 min", why: "Reviews are the #1 trust factor for local buyers. More 5-stars = more calls without ads." },
      { slug: "gmb_optimization", name: "Google Business Profile", description: "Fully optimized GMB with posts, photos, Q&A", priority: "essential", estimatedImpact: "2-3x more organic local leads", timeToActivate: "30 min", why: "GMB is free traffic from buyers in your area actively looking for your service." },
      { slug: "sms_followup", name: "Lead Follow-Up Sequence", description: "Instant SMS + 3-touch email follow-up for every new lead", priority: "essential", estimatedImpact: "40-60% more leads converted", timeToActivate: "10 min", why: "78% of customers hire the first company to respond. Speed kills. Every minute costs money." },
      { slug: "facebook_ads", name: "Facebook/Instagram Ads", description: "Brand awareness + offer ads for service area", priority: "recommended", estimatedImpact: "20-30% more leads at lower CPL", timeToActivate: "15 min", why: "Facebook retargets website visitors and targets homeowners in your zip codes." },
      { slug: "citation_builder", name: "Citation & Directory Listings", description: "Yelp, BBB, Angi, HomeAdvisor, and 15 more directories", priority: "recommended", estimatedImpact: "30% boost in local SEO rankings", timeToActivate: "20 min", why: "NAP consistency across directories is a top local SEO ranking factor." },
      { slug: "referral_system", name: "Customer Referral Program", description: "Systemized referral ask + reward after each completed job", priority: "recommended", estimatedImpact: "$0 CAC leads — highest quality", timeToActivate: "10 min", why: "Referred customers have 16% higher lifetime value and trust you before calling." },
      { slug: "content_calendar", name: "Local Content Calendar", description: "Monthly GMB posts, tips, seasonal promos", priority: "optional", estimatedImpact: "Steady organic visibility growth", timeToActivate: "10 min", why: "Consistent posting keeps you top of mind and improves GMB ranking over time." },
      { slug: "upsell_flow", name: "Upsell & Maintenance Plan", description: "Post-job upsell offer + annual maintenance package pitch", priority: "optional", estimatedImpact: "30-50% more revenue per customer", timeToActivate: "10 min", why: "Existing customers are 5x easier to sell to. Maintenance contracts create recurring revenue." },
    ],
    niches: ["HVAC", "Plumbing", "Roofing", "Electrical", "Landscaping", "Cleaning", "Pest Control", "Pool Service", "Garage Door", "Painting", "Flooring", "Windows", "Gutters", "Tree Service", "Handyman"],
    psychologyPrinciples: ["Social proof", "Urgency", "Authority (licensed/insured)", "Liking (local, friendly)", "Scarcity (slots today)"],
  },
  consultant_coach: {
    type: "consultant_coach",
    label: "Consultant / Coach",
    emoji: "🎯",
    description: "Business coaches, life coaches, consultants, strategists, therapists, and any high-ticket service sold on relationships and outcomes.",
    acquisitionModel: "Authority content → lead magnet → nurture → discovery call → close",
    salesProcess: "Content → Opt-in → Email nurture → Application/Call → Close → Onboard",
    decisionWindow: "weeks",
    trustRequirements: ["Case studies and results", "Credentials/experience story", "Testimonials with specifics", "Free value first", "Personal brand"],
    conversionTriggers: ["Transformation story", "Specificity of results ('clients get X in Y days')", "Exclusivity", "Social proof", "Risk reversal"],
    buyerAwarenessLevel: "Awareness varies — focus on problem-aware to solution-aware",
    averageDealSize: "$1,000–$25,000",
    funnelType: "Content → Lead magnet → Nurture → Call → High-ticket close",
    crmStages: ["Lead", "Opted In", "Nurturing", "Application Sent", "Call Booked", "Call Complete", "Proposal Sent", "Active Client", "Alumni"],
    contentStyle: "Authority + transformation. Personal stories. Client results. Frameworks and methodology.",
    topObjections: ["Is this right for me?", "Too expensive", "I can do it myself", "I've tried before", "I need to think about it"],
    winningAngles: ["Specific transformation + timeline", "Done-with-you vs done-alone", "ROI framing", "Access to you personally"],
    systems: [
      { slug: "lead_magnet", name: "Lead Magnet + Opt-in", description: "High-value free resource that attracts ideal clients", priority: "essential", estimatedImpact: "2-5x more qualified leads", timeToActivate: "15 min", why: "Without a lead magnet, you're asking cold traffic to buy. Give value first to earn trust." },
      { slug: "email_sequence", name: "Nurture Email Sequence", description: "7-14 email sequence that builds authority and books calls", priority: "essential", estimatedImpact: "30-50% of leads booked within 14 days", timeToActivate: "20 min", why: "Most buyers need 7+ touchpoints. Email nurture does this on autopilot while you sleep." },
      { slug: "website", name: "Authority Website", description: "Personal brand site with story, results, and call booking", priority: "essential", estimatedImpact: "Converts skeptics into believers", timeToActivate: "15 min", why: "High-ticket buyers research extensively. A weak site kills trust before you even talk." },
      { slug: "booking_flow", name: "Discovery Call Funnel", description: "Application page + booking system + confirmation sequence", priority: "essential", estimatedImpact: "50-80% show rate on booked calls", timeToActivate: "10 min", why: "The application pre-qualifies and creates commitment. Better calls = higher close rate." },
      { slug: "proposal_system", name: "Proposal System", description: "AI-generated proposals with 3-tier pricing", priority: "essential", estimatedImpact: "2-3x close rate vs verbal offers", timeToActivate: "10 min", why: "Written proposals with anchored pricing close more than verbal. Gives prospects time to 'say yes' without pressure." },
      { slug: "case_studies", name: "Case Study Library", description: "3-5 detailed client success stories", priority: "essential", estimatedImpact: "3x higher conversion on sales calls", timeToActivate: "15 min", why: "Specific results ('John went from $8k to $47k/mo in 90 days') are more persuasive than any feature." },
      { slug: "facebook_ads", name: "Facebook/Instagram Lead Ads", description: "Retargeting + lookalike audience ads to your opt-in", priority: "recommended", estimatedImpact: "Scale leads 2-5x", timeToActivate: "20 min", why: "Once organic gets traction, paid ads amplify it. Facebook audience targeting for demographics is unmatched." },
      { slug: "content_calendar", name: "Content Authority Calendar", description: "LinkedIn/Instagram/YouTube content plan", priority: "recommended", estimatedImpact: "Organic leads at $0 CAC", timeToActivate: "10 min", why: "Authority content builds long-term inbound. Every post is a 24/7 salesperson." },
      { slug: "referral_system", name: "Client Referral System", description: "Structured referral ask + incentive for existing clients", priority: "recommended", estimatedImpact: "1-2 new clients/month from referrals", timeToActivate: "5 min", why: "Your best clients know others just like them. Referred clients close at 3x the rate of cold leads." },
      { slug: "upsell_flow", name: "Retainer / Continuation Offer", description: "Post-program offer to continue or upgrade", priority: "optional", estimatedImpact: "40-60% client retention rate", timeToActivate: "10 min", why: "A client finishing a program is your warmest prospect. Make continuing easy." },
    ],
    niches: ["Business Coach", "Life Coach", "Executive Coach", "Marketing Consultant", "Sales Coach", "Mindset Coach", "Health Coach", "Financial Consultant", "Career Coach", "Relationship Coach", "Leadership Consultant"],
    psychologyPrinciples: ["Authority", "Social proof", "Reciprocity (free value)", "Commitment (application)", "Scarcity (limited spots)"],
  },
  affiliate: {
    type: "affiliate",
    label: "Affiliate Marketer",
    emoji: "💰",
    description: "Affiliate marketers promoting ClickBank, Amazon, JVZoo, WarriorPlus, or CPA offers through content, paid ads, or email.",
    acquisitionModel: "Paid ads / SEO / Content → Bridge page → Offer → Email list → Promote more",
    salesProcess: "Traffic → Presell/Bridge → Offer Page → Purchase → Follow-up for repeat buys",
    decisionWindow: "immediate",
    trustRequirements: ["Honest review positioning", "Personal story/results", "Comparison credibility", "FTC disclosure (trust signal)", "Bonuses"],
    conversionTriggers: ["Pain amplification", "Desire for fast result", "Curiosity gap", "Scarcity/deadline", "Bonus stack value"],
    buyerAwarenessLevel: "All levels — target problem-aware to product-aware depending on traffic source",
    averageDealSize: "$27–$197 per conversion, recurring commissions",
    funnelType: "Traffic → Bridge/Presell page → Affiliate offer → Email list → Promo sequence",
    crmStages: ["Subscriber", "Clicked Offer", "Purchased", "Ascended", "Repeat Buyer", "VIP"],
    contentStyle: "Curiosity + pain + desire. Review-style. Story-based. Problem-solution.",
    topObjections: ["Does this really work?", "Is this a scam?", "I've tried things before", "Why should I trust you?"],
    winningAngles: ["Unlikely hero story", "The missing piece", "What the gurus won't tell you", "Simple system", "Fast result"],
    systems: [
      { slug: "bridge_page", name: "Bridge/Presell Page", description: "Story-based page that warm up cold traffic before the offer", priority: "essential", estimatedImpact: "2-4x higher EPC vs direct linking", timeToActivate: "15 min", why: "Cold traffic doesn't convert on affiliate pages. The bridge warms them up, tells the story, and pre-sells the offer." },
      { slug: "email_sequence", name: "Affiliate Email Sequence", description: "7-day promo sequence + ongoing broadcast system", priority: "essential", estimatedImpact: "3-5x more revenue per subscriber", timeToActivate: "20 min", why: "The money is in the list. One-time visitors rarely buy. Email lets you promote multiple offers to the same audience." },
      { slug: "lead_magnet", name: "List-Building Lead Magnet", description: "Free report/video that captures email before sending to offer", priority: "essential", estimatedImpact: "Email list = long-term income asset", timeToActivate: "10 min", why: "Building a list means you own the audience. Algorithm changes and ad bans can't take your list." },
      { slug: "facebook_ads", name: "Facebook/Instagram Ads", description: "Paid traffic to bridge page with audience targeting", priority: "essential", estimatedImpact: "Scalable, predictable traffic flow", timeToActivate: "20 min", why: "Organic takes months. Paid ads let you validate an offer in 48 hours and scale winners fast." },
      { slug: "content_calendar", name: "Content + SEO System", description: "Review posts, comparison content, YouTube videos", priority: "recommended", estimatedImpact: "Free organic traffic compound growth", timeToActivate: "10 min", why: "Ranking for '[product] review' captures buyers at peak purchase intent — highest converting traffic source." },
      { slug: "tiktok_ads", name: "TikTok Organic + Ads", description: "Short-form video content for the offer niche", priority: "recommended", estimatedImpact: "Viral reach + lower CPMs than Facebook", timeToActivate: "15 min", why: "TikTok has lower ad costs and huge organic reach. Some niches convert 3x better on TikTok than Facebook." },
      { slug: "upsell_flow", name: "OTO / Bonus Stack", description: "Exclusive bonus + OTO promotion after opt-in", priority: "recommended", estimatedImpact: "20-30% revenue increase per buyer", timeToActivate: "10 min", why: "Buyers are in buying mode. A well-positioned bonus offer immediately after purchase captures that momentum." },
      { slug: "website", name: "Authority Review Site", description: "SEO-optimized authority site for review content", priority: "optional", estimatedImpact: "Long-term passive income asset", timeToActivate: "15 min", why: "A review site ranks for product keywords and captures organic buyer intent 24/7." },
    ],
    niches: ["Weight Loss", "Make Money Online", "Crypto", "Survival/Prepping", "Dog Training", "Relationships", "Skin Care", "Muscle Building", "Anxiety/Mental Health", "Golf", "Guitar", "Language Learning"],
    psychologyPrinciples: ["Curiosity", "Pain-Agitate-Solution", "Social proof", "Scarcity/urgency", "Desire + transformation"],
  },
  dropship: {
    type: "dropship",
    label: "Dropshipper",
    emoji: "📦",
    description: "Dropshipping store owners using AliExpress, CJDropshipping, Spocket, or custom suppliers to sell physical products.",
    acquisitionModel: "Paid ads → Product page → Purchase → Upsell → Retention",
    salesProcess: "Ad → Product Page → Cart → Checkout → Post-purchase → Reorder",
    decisionWindow: "immediate",
    trustRequirements: ["Product photos/video", "Reviews (real or imported)", "Shipping clarity", "Return policy", "Trust badges"],
    conversionTriggers: ["Impulse (cool/unique product)", "Problem-solving", "Scarcity/urgency", "Price anchor (compare price)", "Free shipping threshold"],
    buyerAwarenessLevel: "Unaware to problem-aware — create the want, then fulfill it",
    averageDealSize: "$30–$150 per order",
    funnelType: "Ad → Product page → Checkout → Upsell → Email retention",
    crmStages: ["Visitor", "Added to Cart", "Purchased", "Post-Purchase Sequence", "Repeat Buyer", "VIP"],
    contentStyle: "Benefit-focused. Lifestyle imagery. Problem-solution. Unboxing. Before/after.",
    topObjections: ["Shipping time too long", "Is this legit?", "I can find this cheaper on Amazon", "What if it doesn't work?"],
    winningAngles: ["Solves a specific problem", "Unique/novelty", "Gift angle", "Self-improvement", "Saves time/money"],
    systems: [
      { slug: "product_page", name: "High-Converting Product Page", description: "Full Shopify product page with compelling copy, bullets, FAQ, guarantee", priority: "essential", estimatedImpact: "2-3x higher conversion rate", timeToActivate: "15 min", why: "Most dropship stores use manufacturer descriptions. Custom copy that sells benefits vs features converts 2-3x better." },
      { slug: "facebook_ads", name: "Facebook/Instagram Ads", description: "Product video/image ads with winning hooks and targeting", priority: "essential", estimatedImpact: "Primary traffic and revenue driver", timeToActivate: "20 min", why: "Facebook is the proven channel for dropship. Interest + lookalike targeting finds buyers for virtually any product." },
      { slug: "abandoned_cart", name: "Abandoned Cart Recovery", description: "3-email + SMS cart abandonment sequence", priority: "essential", estimatedImpact: "Recover 15-25% of abandoned carts", timeToActivate: "10 min", why: "70% of shoppers abandon cart. Recovery emails alone can add 15% to revenue with zero extra ad spend." },
      { slug: "email_sequence", name: "Post-Purchase Sequence", description: "Delivery updates, upsell, review request, reorder prompt", priority: "essential", estimatedImpact: "30-40% more revenue per customer", timeToActivate: "15 min", why: "Post-purchase customers are your warmest audience. Upsell + review requests dramatically increase LTV." },
      { slug: "tiktok_ads", name: "TikTok Ads + UGC", description: "Product demos and UGC-style ads for TikTok", priority: "recommended", estimatedImpact: "Lower CPMs + viral potential", timeToActivate: "20 min", why: "TikTok has exploded for dropship. Some products go viral organically. Paid TikTok often beats Facebook CPL by 50%." },
      { slug: "upsell_flow", name: "Post-Purchase Upsell", description: "Complementary product upsell immediately after purchase", priority: "recommended", estimatedImpact: "20-35% AOV increase", timeToActivate: "10 min", why: "The buy button click is the highest-trust moment. A relevant upsell here converts at 20-35% — pure profit." },
      { slug: "website", name: "Branded Store Build", description: "Full branded dropship store with trust elements", priority: "recommended", estimatedImpact: "2x conversion rate vs generic stores", timeToActivate: "20 min", why: "Branded stores outperform generic ones. Customers trust a brand. Professional design = credibility = sales." },
      { slug: "sms_followup", name: "SMS Marketing", description: "Cart recovery + promo + reorder SMS campaigns", priority: "optional", estimatedImpact: "98% open rate vs 20% email", timeToActivate: "10 min", why: "SMS gets seen. Simple as that. Cart recovery SMS typically outperforms email by 3-5x." },
    ],
    niches: ["Home & Garden", "Pet Products", "Beauty & Skincare", "Fitness & Wellness", "Kitchen Gadgets", "Tech Accessories", "Baby Products", "Car Accessories", "Jewelry", "Outdoor/Camping"],
    psychologyPrinciples: ["Impulse buying", "FOMO/scarcity", "Social proof (reviews)", "Price anchoring", "Convenience"],
  },
  agency: {
    type: "agency",
    label: "Marketing Agency",
    emoji: "🏢",
    description: "Digital marketing agencies, social media agencies, SEO agencies, and full-service marketing firms selling to local or online businesses.",
    acquisitionModel: "Outbound prospecting + referrals + case studies + paid ads",
    salesProcess: "Prospect → Free audit → Strategy call → Proposal → Close → Onboard → Retain",
    decisionWindow: "weeks",
    trustRequirements: ["Proof of results (case studies)", "Clear process explanation", "Testimonials from similar businesses", "White-label credibility", "Guarantees"],
    conversionTriggers: ["ROI math (spend X get Y)", "Pain of staying same", "Competitive advantage framing", "Risk reversal", "Urgency (limited spots)"],
    buyerAwarenessLevel: "Problem-aware — they know they need marketing help but distrust agencies",
    averageDealSize: "$1,500–$10,000/month retainer",
    funnelType: "Audit → Strategy call → Proposal with 3 tiers → Close → Monthly retainer",
    crmStages: ["Prospect", "Audit Sent", "Call Booked", "Proposal Sent", "Negotiating", "Active Client", "At Risk", "Churned", "Referred"],
    contentStyle: "ROI-focused. Data-driven. Case study heavy. 'We did X for Y business' proof.",
    topObjections: ["We had a bad experience before", "How do I know you'll deliver?", "Too expensive", "We do it in-house", "I need to think about it"],
    winningAngles: ["Performance-based pricing", "Vertical specialization ('we only work with HVAC companies')", "Specific ROI guarantees", "No long-term contracts"],
    systems: [
      { slug: "proposal_system", name: "Automated Proposal System", description: "AI-generated proposals with audit data and 3 engagement tiers", priority: "essential", estimatedImpact: "3x close rate vs verbal offers", timeToActivate: "10 min", why: "Agencies that send proposals same-day close at 3x the rate. Speed + professionalism = trust." },
      { slug: "website", name: "Agency Authority Website", description: "Case study-heavy site with specialization positioning", priority: "essential", estimatedImpact: "24/7 lead qualification machine", timeToActivate: "15 min", why: "Prospects always check the website after a call. A weak site kills trust you built on the phone." },
      { slug: "email_sequence", name: "Outreach Sequence", description: "Cold email + follow-up sequence for prospecting", priority: "essential", estimatedImpact: "5-15% reply rate on targeted lists", timeToActivate: "15 min", why: "Consistent outreach is the fastest path to agency clients. 80% of deals close after 5+ follow-ups." },
      { slug: "case_studies", name: "Case Study System", description: "Documented client results with before/after metrics", priority: "essential", estimatedImpact: "Removes objection 'do you have proof?'", timeToActivate: "15 min", why: "Specific numbers ('went from 12 to 47 leads/month') close more than any feature list." },
      { slug: "white_label_reports", name: "White-Label Reporting", description: "Branded monthly reports for each client", priority: "essential", estimatedImpact: "50% lower churn rate", timeToActivate: "10 min", why: "Clients stay when they see results clearly. Monthly reports make value visible and reduce 'what am I paying for?'" },
      { slug: "booking_flow", name: "Free Audit Booking Flow", description: "Landing page + audit form + auto-booking", priority: "recommended", estimatedImpact: "2-3x more discovery calls", timeToActivate: "10 min", why: "A free audit lowers commitment barrier. Getting them to book is 80% of the battle." },
      { slug: "facebook_ads", name: "Lead Gen Ads", description: "Facebook/Instagram ads targeting business owners", priority: "recommended", estimatedImpact: "Consistent inbound pipeline", timeToActivate: "20 min", why: "Business owner targeting on Facebook is powerful. Free audit ads are a proven lead gen angle." },
      { slug: "referral_system", name: "Client Referral Program", description: "Structured referral ask + incentive program", priority: "recommended", estimatedImpact: "30-50% of new clients from referrals", timeToActivate: "5 min", why: "Agency referrals close at 70%+ vs 20% for cold. Every happy client is a salesperson." },
    ],
    niches: ["Local Service Agencies", "E-commerce Agencies", "Real Estate Marketing", "Healthcare Marketing", "Restaurant Marketing", "SaaS Marketing", "Legal Marketing", "Financial Marketing"],
    psychologyPrinciples: ["Authority", "Social proof", "Risk reversal", "Reciprocity (free audit)", "Loss aversion (ROI framing)"],
  },
  ecommerce: {
    type: "ecommerce",
    label: "E-commerce Brand",
    emoji: "🛍️",
    description: "Branded e-commerce stores selling their own products (not dropship) through Shopify or similar platforms.",
    acquisitionModel: "Paid social + SEO + influencer + email list",
    salesProcess: "Ad → PDP → Cart → Checkout → Post-purchase → Retention",
    decisionWindow: "immediate",
    trustRequirements: ["Product photography", "Detailed reviews", "Brand story", "Shipping policy", "Return guarantee"],
    conversionTriggers: ["Brand identity", "Lifestyle aspiration", "Reviews volume", "Urgency (low stock)", "Bundle deals"],
    buyerAwarenessLevel: "Unaware to product-aware",
    averageDealSize: "$50–$300 per order",
    funnelType: "Ad → Collection/PDP → Cart → Checkout → Email → Retention",
    crmStages: ["Subscriber", "First Purchase", "Second Purchase", "VIP", "Lapsed", "Reactivated"],
    contentStyle: "Lifestyle + aspirational. UGC. Behind the scenes. Community building.",
    topObjections: ["Is the quality good?", "Shipping time?", "Can I return it?", "Why not just buy from Amazon?"],
    winningAngles: ["Brand story/mission", "Sustainability/values", "Community", "Quality vs price", "Uniqueness"],
    systems: [
      { slug: "website", name: "Branded Store", description: "Full e-commerce store with brand story and conversion optimization", priority: "essential", estimatedImpact: "Foundation of entire business", timeToActivate: "20 min", why: "Your store IS your business. Every other channel drives here." },
      { slug: "email_sequence", name: "Email Marketing System", description: "Welcome flow + browse abandon + post-purchase + VIP", priority: "essential", estimatedImpact: "30-40% of total revenue from email", timeToActivate: "20 min", why: "Email is the highest-ROI channel for e-commerce. Top brands generate 30-40% of revenue from email alone." },
      { slug: "facebook_ads", name: "Facebook/Instagram Ads", description: "Prospecting + retargeting campaigns", priority: "essential", estimatedImpact: "Primary paid growth channel", timeToActivate: "20 min", why: "Meta ads with strong creative and audience targeting remain the most scalable channel for product brands." },
      { slug: "abandoned_cart", name: "Cart Recovery System", description: "Email + SMS cart and browse abandonment", priority: "essential", estimatedImpact: "Recover 15-25% of lost revenue", timeToActivate: "10 min", why: "70% abandon. Recovering even 20% of them is massive incremental revenue at near-zero cost." },
      { slug: "upsell_flow", name: "Post-Purchase Upsell", description: "Bundle offers and product recommendations", priority: "recommended", estimatedImpact: "20-35% AOV increase", timeToActivate: "10 min", why: "Upselling to existing buyers is 5x cheaper than acquiring new ones. AOV is your profitability lever." },
      { slug: "tiktok_ads", name: "TikTok UGC + Ads", description: "UGC-style creative + TikTok Shop", priority: "recommended", estimatedImpact: "High-volume low-CPM awareness", timeToActivate: "15 min", why: "TikTok Shop and UGC content are the fastest growing acquisition channels for product brands." },
      { slug: "referral_system", name: "Loyalty & Referral Program", description: "Points, VIP tiers, and refer-a-friend rewards", priority: "recommended", estimatedImpact: "2x LTV for VIP customers", timeToActivate: "10 min", why: "Loyalty programs increase purchase frequency and LTV dramatically. Referred customers have higher order values." },
    ],
    niches: ["Apparel", "Beauty", "Health & Wellness", "Home Goods", "Food & Beverage", "Pets", "Baby", "Sports & Fitness", "Jewelry", "Art & Prints"],
    psychologyPrinciples: ["Identity/aspiration", "Social proof", "Scarcity", "Reciprocity (loyalty points)", "Community belonging"],
  },
  saas: {
    type: "saas",
    label: "SaaS Product",
    emoji: "💻",
    description: "Software-as-a-service products with monthly or annual subscriptions, free trials, and product-led growth.",
    acquisitionModel: "SEO + content + paid ads + product virality + partnerships",
    salesProcess: "Awareness → Free trial/freemium → Activation → Upgrade → Retain → Expand",
    decisionWindow: "days",
    trustRequirements: ["Product demo/screenshots", "G2/Capterra reviews", "Integration badges", "Security/compliance", "Customer logos"],
    conversionTriggers: ["Aha moment in trial", "ROI calculator", "Competitor comparison", "Free tier removes risk", "Annual discount"],
    buyerAwarenessLevel: "Solution-aware to product-aware",
    averageDealSize: "$50–$500/month",
    funnelType: "Content/ad → Trial → Onboarding → Activation → Paid upgrade",
    crmStages: ["Lead", "Trial Started", "Activated", "Power User", "Churned", "Reactivated", "Expanded"],
    contentStyle: "Educational. Feature benefit. ROI focused. Comparison content. Use-case showcases.",
    topObjections: ["We already use X", "Too complex", "Too expensive", "Our team won't adopt it", "Data security"],
    winningAngles: ["Time savings ROI", "Replace 3 tools with 1", "Integration with existing stack", "White-glove onboarding", "No credit card trial"],
    systems: [
      { slug: "website", name: "SaaS Marketing Site", description: "Conversion-optimized site with demo, pricing, testimonials", priority: "essential", estimatedImpact: "Primary conversion engine", timeToActivate: "20 min", why: "SaaS buyers spend 30+ minutes researching before trialing. The website must answer every objection." },
      { slug: "email_sequence", name: "Trial Onboarding Sequence", description: "Activation emails, feature tips, upgrade nudges", priority: "essential", estimatedImpact: "2-3x trial-to-paid conversion", timeToActivate: "20 min", why: "Most trials fail because users don't reach the Aha moment. Guided email sequences drive activation and conversion." },
      { slug: "content_calendar", name: "SEO Content Strategy", description: "Blog + comparison pages + use case content", priority: "essential", estimatedImpact: "Compounding organic traffic over 6-12 months", timeToActivate: "10 min", why: "SEO is the most cost-effective SaaS acquisition channel at scale. Comparison and how-to content captures buyers." },
      { slug: "facebook_ads", name: "Retargeting Ads", description: "Trial + demo CTA retargeting for website visitors", priority: "recommended", estimatedImpact: "3-5x higher conversion vs cold traffic", timeToActivate: "15 min", why: "Retargeting SaaS prospects who visited pricing/features pages has extremely high intent and low CPL." },
      { slug: "upsell_flow", name: "Expansion Revenue System", description: "Upgrade prompts, usage limits, annual plan offers", priority: "recommended", estimatedImpact: "Net revenue retention > 100%", timeToActivate: "10 min", why: "Expanding existing accounts is the SaaS growth flywheel. NRR > 100% means the company grows even with churn." },
    ],
    niches: ["Marketing Tools", "Productivity", "CRM", "HR/Recruiting", "Finance", "Analytics", "E-commerce", "Communication", "Project Management"],
    psychologyPrinciples: ["Risk reversal (free trial)", "Social proof (reviews)", "Authority (G2 badges)", "Commitment (onboarding investment)", "Loss aversion (data migration)"],
  },
  content_creator: {
    type: "content_creator",
    label: "Content Creator",
    emoji: "🎥",
    description: "YouTubers, podcasters, bloggers, newsletter writers, and personal brands monetizing through sponsorships, courses, memberships, or products.",
    acquisitionModel: "Organic content → Audience → Email list → Monetization",
    salesProcess: "Content → Follow → Email → Offer → Course/membership/product purchase",
    decisionWindow: "weeks",
    trustRequirements: ["Consistent content quality", "Audience engagement", "Personal authenticity", "Proof of expertise", "Community"],
    conversionTriggers: ["Parasocial trust built over time", "Exclusive access", "Transformation promise", "Community belonging", "Scarcity of time/cohort"],
    buyerAwarenessLevel: "All levels — mostly warm audience",
    averageDealSize: "$97–$2,000 (courses, memberships, products)",
    funnelType: "Content → Email list → Launch/evergreen funnel → Community",
    crmStages: ["Subscriber", "Email Opt-in", "Course Buyer", "Community Member", "VIP", "Brand Partner"],
    contentStyle: "Authentic + educational + entertaining. Personal stories. Behind the scenes. Value-first.",
    topObjections: ["I can find this on YouTube for free", "Too expensive", "Do I have time?", "Will this work for me?"],
    winningAngles: ["Your unique framework/method", "Community access", "Done-with-you model", "Access to you"],
    systems: [
      { slug: "lead_magnet", name: "Email List Growth System", description: "Lead magnet + opt-in + welcome sequence", priority: "essential", estimatedImpact: "Foundation of monetization", timeToActivate: "15 min", why: "The email list is the only audience you own. Platform algorithms change. Your list is forever." },
      { slug: "email_sequence", name: "Nurture + Launch Sequence", description: "Ongoing nurture + product launch email system", priority: "essential", estimatedImpact: "Email drives 50-80% of course revenue", timeToActivate: "20 min", why: "The most successful creators monetize through email. It's the most trusted and highest-converting channel they own." },
      { slug: "website", name: "Personal Brand Hub", description: "Creator website with content, courses, and offers", priority: "essential", estimatedImpact: "SEO + course sales + media kit", timeToActivate: "15 min", why: "Your website ranks for your name, hosts your courses, and acts as your media kit for brand deals." },
      { slug: "content_calendar", name: "Content System", description: "Consistent multi-platform publishing calendar", priority: "essential", estimatedImpact: "Audience growth + algorithm favor", timeToActivate: "10 min", why: "Consistency beats virality. Creators who publish consistently 3-5x/week grow 10x faster than sporadic posters." },
      { slug: "upsell_flow", name: "Product Suite / Ascension", description: "Low → mid → high ticket product ladder", priority: "recommended", estimatedImpact: "5-10x revenue per audience member", timeToActivate: "15 min", why: "A product ladder captures buyers at every budget level. A $27 product buyer is your best $2,000 course prospect." },
    ],
    niches: ["Finance/Investing", "Fitness", "Business/Entrepreneurship", "Cooking", "Travel", "Tech/Gaming", "Beauty/Fashion", "Personal Development", "Parenting", "Arts/Crafts"],
    psychologyPrinciples: ["Parasocial trust", "Community belonging", "Transformation promise", "Exclusivity", "Consistency bias"],
  },
  financial: {
    type: "financial",
    label: "Financial / Insurance",
    emoji: "📊",
    description: "Financial advisors, insurance agents, mortgage brokers, credit repair specialists, and tax professionals.",
    acquisitionModel: "Referrals + content + paid leads + local SEO",
    salesProcess: "Lead → Education → Trust building → Consultation → Close → Review/refer",
    decisionWindow: "weeks",
    trustRequirements: ["Credentials/licensing prominently displayed", "Compliance-safe messaging", "Client testimonials", "Clear pricing", "Privacy commitment"],
    conversionTriggers: ["Fear of financial loss", "Desire for security", "Life event triggers (home purchase, baby, retirement)", "Tax savings/ROI", "Simplicity"],
    buyerAwarenessLevel: "Problem-aware — know they need help but intimidated",
    averageDealSize: "$500–$10,000+ (ongoing AUM/premium)",
    funnelType: "Content/referral → Education → Trust → Consultation → Long-term relationship",
    crmStages: ["Lead", "Educational Phase", "Consultation Booked", "Proposal Sent", "Client", "Annual Review", "Referring Client"],
    contentStyle: "Educational + trust-building. Demystifying complex topics. Plain language wins.",
    topObjections: ["Too complex", "I'll do it myself", "I don't trust financial people", "What are your fees?", "Is my money safe?"],
    winningAngles: ["Simplified education", "Specific outcome ('save $X in taxes')", "Fiduciary/no commission", "Local trusted advisor"],
    systems: [
      { slug: "lead_magnet", name: "Financial Education Lead Magnet", description: "Free guide/calculator that attracts qualified leads", priority: "essential", estimatedImpact: "2-5x qualified leads", timeToActivate: "15 min", why: "Financial buyers want education before trust. A free resource pre-qualifies and begins the relationship." },
      { slug: "email_sequence", name: "Trust Nurture Sequence", description: "Long-form educational email series building credibility", priority: "essential", estimatedImpact: "Consistent consultation bookings", timeToActivate: "20 min", why: "Financial decisions require trust. Email nurture that educates converts 3x better than hard-sell sequences." },
      { slug: "booking_flow", name: "Free Consultation Booking", description: "Simple booking page with pre-qualification questions", priority: "essential", estimatedImpact: "40-60% more consultations booked", timeToActivate: "10 min", why: "A frictionless booking system converts more website visitors into real consultations." },
      { slug: "website", name: "Trust Authority Website", description: "Credentials, reviews, education content, booking", priority: "essential", estimatedImpact: "24/7 credibility builder", timeToActivate: "15 min", why: "People research financial advisors extensively. Your website is your virtual office — it must project absolute professionalism." },
      { slug: "referral_system", name: "Client Referral System", description: "Structured referral program for existing clients", priority: "essential", estimatedImpact: "40-60% of new clients from referrals", timeToActivate: "5 min", why: "Referred financial clients have zero trust barrier. They're pre-sold by someone they already trust." },
    ],
    niches: ["Tax Preparation", "Insurance", "Mortgage", "Credit Repair", "Investment Advising", "Retirement Planning", "Life Insurance", "Bookkeeping"],
    psychologyPrinciples: ["Authority/credentials", "Social proof", "Fear of loss", "Reciprocity (education)", "Liking (local, personal)"],
  },
  real_estate: {
    type: "real_estate",
    label: "Real Estate",
    emoji: "🏠",
    description: "Real estate agents, investors, wholesalers, property managers, and developers.",
    acquisitionModel: "Sphere of influence + paid leads + content + direct mail",
    salesProcess: "Lead → Nurture → Appointment → Show/offer → Close → Refer",
    decisionWindow: "months",
    trustRequirements: ["Local market expertise", "Track record (sold homes)", "Availability", "Communication style", "Neighborhood knowledge"],
    conversionTriggers: ["Market timing fear/opportunity", "Life event (moving, growing family)", "Investment ROI", "Trust in representation", "First-time buyer education"],
    buyerAwarenessLevel: "Problem-aware — know they want to buy/sell, uncertain when/how",
    averageDealSize: "$5,000–$25,000+ per transaction",
    funnelType: "Lead → CRM nurture (months) → Ready → Close → Refer",
    crmStages: ["New Lead", "Not Ready (6mo+)", "Actively Looking", "Under Contract", "Closed", "Post-Close Nurture", "Referring Client"],
    contentStyle: "Local expertise. Market updates. Listings. Buyer/seller education. Community content.",
    topObjections: ["Market is too crazy right now", "Wait for rates to drop", "I can sell myself (FSBO)", "I don't trust agents", "Commission is too high"],
    winningAngles: ["Local expert (specific neighborhood/city)", "Investor network", "First-time buyer specialist", "Off-market deals", "Guaranteed offer"],
    systems: [
      { slug: "crm_pipeline", name: "Long-Cycle CRM System", description: "Multi-stage CRM with automated nurture for long decision cycles", priority: "essential", estimatedImpact: "Convert leads 12-18 months later", timeToActivate: "10 min", why: "Real estate buyers take months. A CRM that nurtures them consistently is the difference between a $15k commission and losing to a competitor." },
      { slug: "email_sequence", name: "Drip Nurture Campaign", description: "Monthly market updates + education + check-in sequence", priority: "essential", estimatedImpact: "Stay top-of-mind over months/years", timeToActivate: "20 min", why: "The agent who stays in contact wins. 63% of buyers use the first agent they contact — but most aren't ready for months." },
      { slug: "website", name: "Real Estate Authority Site", description: "IDX listings + neighborhood guides + lead capture", priority: "essential", estimatedImpact: "Inbound buyer + seller leads", timeToActivate: "15 min", why: "94% of buyers use the internet in their search. Your website positions you as THE local expert." },
      { slug: "content_calendar", name: "Local Market Content", description: "Market updates, neighborhood spotlights, buyer/seller tips", priority: "recommended", estimatedImpact: "Organic leads + referral credibility", timeToActivate: "10 min", why: "Consistent content positions you as the local authority. People call the agent they feel they already know." },
      { slug: "referral_system", name: "Past Client Referral System", description: "Annual check-in + referral ask + anniversary touch", priority: "recommended", estimatedImpact: "30-40% of business from past clients", timeToActivate: "5 min", why: "Real estate referrals are gold. A simple annual check-in system keeps you in past clients' minds when friends ask 'do you know an agent?'" },
    ],
    niches: ["Residential Buyer Agent", "Listing Agent", "Real Estate Investor", "Wholesaler", "Property Manager", "Commercial RE", "Vacation Rentals"],
    psychologyPrinciples: ["Trust/liking", "Social proof", "Market urgency (FOMO)", "Loss aversion (missing the market)", "Authority (local expert)"],
  },
};

export function getArchetype(type: BusinessType): BusinessArchetype {
  return ARCHETYPES[type];
}

export function getEssentialSystems(type: BusinessType): SystemBlueprint[] {
  return ARCHETYPES[type].systems.filter((system) => system.priority === "essential");
}

export function getRecommendedSystems(type: BusinessType): SystemBlueprint[] {
  return ARCHETYPES[type].systems.filter((system) => system.priority === "recommended");
}

export function getAllBusinessTypes(): Array<{ type: BusinessType; label: string; emoji: string; description: string }> {
  return Object.values(ARCHETYPES).map((archetype) => ({
    type: archetype.type,
    label: archetype.label,
    emoji: archetype.emoji,
    description: archetype.description,
  }));
}
