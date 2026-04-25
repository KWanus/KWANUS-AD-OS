export type NicheGuide = {
  id: string;
  name: string;
  tagline: string;
  overview: string;
  idealFor: string[];
  revenueModel: {
    howYouMakeMoneyTitle: string;
    howYouMakeMoneyDesc: string;
    revenueStreams: { name: string; amount: string; frequency: string }[];
    mathToTarget: string;
    timeToFirstRevenue: string;
  };
  strategy: {
    primary: string;
    secondary: string;
    keyInsight: string;
  };
  dailyRoutine: { time: string; task: string; why: string }[];
  weekByWeek: { week: string; focus: string; actions: string[]; milestone: string }[];
  toolsNeeded: { name: string; cost: string; purpose: string }[];
  commonMistakes: string[];
  kpis: { metric: string; target: string; why: string }[];
  systemsToUse: { page: string; label: string; why: string }[];
};

export const NICHE_GUIDES: Record<string, NicheGuide> = {
  agency: {
    id: "agency",
    name: "AI Automation Agency",
    tagline: "Sell AI-powered workflow automation to local businesses",
    overview: "You build AI chatbots, email automation, CRM systems, and workflow automation for small businesses. Charge $2K-$5K setup + $500-$2K/month retainer. 2-3 clients = $10K/month.",
    idealFor: [
      "Can code or use no-code tools",
      "Comfortable with cold outreach",
      "Don't want to be on camera",
      "Want high-ticket recurring revenue",
    ],
    revenueModel: {
      howYouMakeMoneyTitle: "Setup fees + monthly retainers",
      howYouMakeMoneyDesc: "You charge a one-time setup fee to build the automation, then a monthly retainer to maintain, optimize, and expand it. As you prove results, you raise prices.",
      revenueStreams: [
        { name: "Setup fee", amount: "$2,000 - $5,000", frequency: "one-time per client" },
        { name: "Monthly retainer", amount: "$500 - $2,000", frequency: "recurring" },
        { name: "Upsells (new automations)", amount: "$500 - $2,000", frequency: "quarterly" },
      ],
      mathToTarget: "3 clients x $3,000/month retainer = $9,000/month + setup fees",
      timeToFirstRevenue: "2-4 weeks (from first cold email to first payment)",
    },
    strategy: {
      primary: "Cold email outreach to local businesses (50/day). Use hyper-personalization — mention their specific website, Google rating, or a problem you spotted. Include a 2-minute Loom video showing what you'd automate for them.",
      secondary: "LinkedIn content + DMs. Post 2x/week about automation results. DM warm connections.",
      keyInsight: "In 2026, cold outreach converts at 1.7% with generic messages but 14.6% with inbound-led outbound (engaging with their content first, THEN emailing). Warm them up on LinkedIn before the cold email lands.",
    },
    dailyRoutine: [
      { time: "9:00 AM", task: "Check replies from yesterday's outreach", why: "Hot leads go cold fast. Respond within 1 hour." },
      { time: "9:30 AM", task: "Engage with 10 prospects on LinkedIn", why: "Warm them up before your email arrives. Comment on their posts." },
      { time: "10:00 AM", task: "Send 50 cold emails", why: "500 emails = 5-10 conversations = 1-3 clients. Volume matters." },
      { time: "11:00 AM", task: "Record 3 personalized Loom videos", why: "Show prospects exactly what you'd automate. This is your closer." },
      { time: "12:00 PM", task: "Follow up with warm leads", why: "80% of sales happen after the 5th contact." },
      { time: "2:00 PM", task: "Work on client deliverables", why: "Happy clients = referrals = free growth." },
      { time: "4:00 PM", task: "Post on LinkedIn", why: "Build authority. Share a quick automation tip or client win." },
    ],
    weekByWeek: [
      { week: "Week 1", focus: "Foundation", actions: ["Pick one niche (dentists, HVAC, med spas, law firms)", "Build 2 demo automations you can show anyone", "Record a 3-min Loom: manual way vs automated way", "Set up cold email infrastructure (domain, warmup, tool)"], milestone: "2 demos ready, email infrastructure live" },
      { week: "Week 2", focus: "Outreach begins", actions: ["Scrape 500 businesses using Himalaya Outreach", "Send 50 cold emails/day with Loom link", "Engage with 10 prospects/day on LinkedIn", "Track open rates and replies"], milestone: "250 emails sent, first 2-3 replies" },
      { week: "Week 3", focus: "Close first client", actions: ["Get on calls with 5-10 replies", "Offer discounted pilot: $500-$1500 setup + $300/mo", "In exchange: case study + testimonial", "Start building for first client"], milestone: "First client signed" },
      { week: "Week 4", focus: "Deliver + scale", actions: ["Deliver first client's automation", "Collect testimonial and case study", "Raise prices to full rate ($2K+ setup)", "Continue sending 50 emails/day"], milestone: "First client live, case study ready" },
      { week: "Month 2", focus: "Scale to 3 clients", actions: ["Use case study in all outreach", "Ask first client for referrals", "Start LinkedIn content with real results", "Close 2 more clients at full rate"], milestone: "$6K-$9K MRR" },
      { week: "Month 3+", focus: "Systemize", actions: ["Create SOPs for delivery", "Consider hiring a VA for outreach", "Build recurring revenue to $10K+", "Start upselling existing clients"], milestone: "$10K+ MRR" },
    ],
    toolsNeeded: [
      { name: "Himalaya (this platform)", cost: "Free-$29/mo", purpose: "Outreach pipeline, CRM, proposals, client management" },
      { name: "Instantly or Smartlead", cost: "$30-$97/mo", purpose: "Cold email sending at scale" },
      { name: "n8n or Make.com", cost: "$10-$29/mo", purpose: "Build the actual automations for clients" },
      { name: "Claude API", cost: "$50-$100/mo", purpose: "Power the AI chatbots and automation logic" },
      { name: "Loom", cost: "Free", purpose: "Record personalized videos for prospects" },
      { name: "Cal.com or Calendly", cost: "Free", purpose: "Book discovery calls" },
    ],
    commonMistakes: [
      "Sending generic cold emails. Personalize every single one — mention their Google rating, a broken page on their site, or a specific thing you'd automate.",
      "Trying to serve every niche. Pick ONE and go deep. 'AI for dentists' beats 'AI for everyone.'",
      "Pricing too low. $500/month feels safe but you need 20 clients to hit $10K. $2K/month means you need 5.",
      "Giving up after 100 emails. The math says 500 emails = 1-3 clients. Most people quit at 100.",
      "Building before selling. Don't build the automation until someone pays you. Sell first, build second.",
      "Not following up. 80% of sales happen after the 5th follow-up. Most people stop after 1.",
    ],
    kpis: [
      { metric: "Emails sent/day", target: "50", why: "Volume is the input. Revenue is the output." },
      { metric: "Reply rate", target: "2-5%", why: "Below 1% = your message needs work. Above 5% = you're doing great." },
      { metric: "Calls booked/week", target: "3-5", why: "Each call is a potential $3K+ client." },
      { metric: "Close rate", target: "20-30%", why: "If you're below 20%, your offer or pricing needs adjustment." },
      { metric: "Monthly retainer revenue", target: "$10K+", why: "This is the number that lets you quit your job." },
    ],
    systemsToUse: [
      { page: "/outreach", label: "Outreach Pipeline", why: "Find businesses, generate cold emails, send in bulk" },
      { page: "/agency", label: "Agency Dashboard", why: "Run audits, generate proposals, pricing strategies" },
      { page: "/clients", label: "Client CRM", why: "Track pipeline, manage clients, delivery checklists" },
      { page: "/agency/templates", label: "Service Templates", why: "Generate SOWs and delivery checklists" },
      { page: "/bookings", label: "Booking Calendar", why: "Let prospects book discovery calls" },
      { page: "/emails", label: "Email Automation", why: "Set up follow-up sequences for cold leads" },
    ],
  },

  affiliate: {
    id: "affiliate",
    name: "Affiliate Marketing",
    tagline: "Promote other people's products and earn commissions",
    overview: "You create content (blog posts, videos, social media) that recommends products. When people buy through your link, you earn 20-75% commission. No product creation, no customer support, no inventory.",
    idealFor: [
      "Don't want to create their own product",
      "Comfortable writing or creating content",
      "Want passive income that compounds over time",
      "Low budget to start ($0-$50/month)",
    ],
    revenueModel: {
      howYouMakeMoneyTitle: "Commissions on every sale",
      howYouMakeMoneyDesc: "You get a unique affiliate link. When someone clicks it and buys, you earn a commission. Digital products pay 30-75%. Physical products pay 3-15%. SaaS recurring commissions pay 20-40% monthly.",
      revenueStreams: [
        { name: "Product commissions", amount: "$20 - $200 per sale", frequency: "per conversion" },
        { name: "Recurring SaaS commissions", amount: "$10 - $100/month per referral", frequency: "monthly recurring" },
        { name: "Digital product commissions", amount: "$50 - $500 per sale", frequency: "per conversion" },
      ],
      mathToTarget: "100 sales/month x $50 avg commission = $5,000/month. Scale to 200 sales = $10K",
      timeToFirstRevenue: "1-3 months (depends on traffic strategy)",
    },
    strategy: {
      primary: "SEO-driven content: write comparison articles, 'best of' lists, and how-to guides targeting buyer-intent keywords. These rank in Google and bring free, targeted traffic 24/7.",
      secondary: "Faceless short-form video on TikTok and YouTube Shorts. Use AI to generate scripts, screen recordings, or text-over-stock-footage. No camera needed.",
      keyInsight: "In 2026, Q&A platforms (Reddit, Quora) are massively underused. Google ranks Reddit/Quora answers on page 1. Answer questions in your niche with genuine help + your affiliate link. Free traffic, zero following required.",
    },
    dailyRoutine: [
      { time: "9:00 AM", task: "Write one SEO article (1,500+ words)", why: "Each article is a permanent traffic asset. 50 articles = a full-time income." },
      { time: "11:00 AM", task: "Answer 5 questions on Reddit/Quora", why: "Free traffic from Google. Each answer can rank for years." },
      { time: "12:00 PM", task: "Create 2 short-form videos (faceless)", why: "TikTok/YouTube algorithm doesn't care about followers — only content quality." },
      { time: "1:00 PM", task: "Optimize existing content (update, add links)", why: "Google rewards fresh, updated content with better rankings." },
      { time: "2:00 PM", task: "Build email list (lead magnet, opt-in)", why: "Email converts 3-5x better than social. Own your audience." },
      { time: "3:00 PM", task: "Research trending products in your niche", why: "First-mover advantage on trending products = easy commissions." },
    ],
    weekByWeek: [
      { week: "Week 1", focus: "Foundation", actions: ["Pick a niche (health, finance, tech, software)", "Join 3 affiliate programs (ClickBank, Amazon, niche-specific)", "Set up your site with Himalaya", "Write your first 5 articles targeting buyer keywords"], milestone: "Site live, 5 articles published" },
      { week: "Week 2", focus: "Content velocity", actions: ["Write 5 more articles (10 total)", "Create 10 short-form videos (faceless)", "Answer 20 Quora/Reddit questions", "Set up email opt-in with lead magnet"], milestone: "10 articles, first organic traffic" },
      { week: "Week 3", focus: "Traffic building", actions: ["Write 5 more articles (15 total)", "Post daily on TikTok/YouTube Shorts", "Start Pinterest pins for evergreen articles", "Guest post on 2 blogs in your niche"], milestone: "First affiliate clicks" },
      { week: "Week 4", focus: "First sales", actions: ["Optimize top 5 performing articles", "Add comparison tables and CTAs", "Send first email to subscribers", "Track which products convert best"], milestone: "First commission earned" },
      { week: "Month 2", focus: "Scale what works", actions: ["Double down on content types that drive clicks", "Build email sequence (5-part value series)", "Create product review videos", "Hit 30+ articles published"], milestone: "$100-$500/month" },
      { week: "Month 3+", focus: "Compound growth", actions: ["Content is ranking, traffic growing", "Email list converting at 2-5%", "Focus on high-commission products", "Consider paid ads on winning content"], milestone: "$500-$2,000/month" },
    ],
    toolsNeeded: [
      { name: "Himalaya (this platform)", cost: "Free-$29/mo", purpose: "Website, email automation, ad creatives, analytics" },
      { name: "Affiliate networks", cost: "Free", purpose: "ClickBank, Amazon Associates, ShareASale, Impact" },
      { name: "Keyword research", cost: "Free-$30/mo", purpose: "Google Keyword Planner, Ubersuggest, or Ahrefs" },
      { name: "AI content tools", cost: "$20/mo", purpose: "Claude/ChatGPT for article drafts and video scripts" },
      { name: "Canva", cost: "Free", purpose: "Pinterest pins, article images, social graphics" },
    ],
    commonMistakes: [
      "Promoting low-commission products. $5 commissions mean you need 2,000 sales/month for $10K. Promote $50-$200 commission products.",
      "Writing content nobody searches for. Use keyword research — target 'best X for Y' and 'X vs Y' keywords with buyer intent.",
      "Not building an email list. Social platforms can ban you overnight. Email is yours forever.",
      "Spreading across too many niches. Pick ONE niche and become the go-to resource.",
      "Expecting results in week 1. SEO takes 2-4 months to kick in. The first 60 days feel like nothing is working. Keep going.",
      "Not disclosing affiliate relationships. Always disclose — it's legally required and builds trust.",
    ],
    kpis: [
      { metric: "Articles published/week", target: "3-5", why: "Content is your inventory. More content = more traffic = more commissions." },
      { metric: "Monthly organic traffic", target: "5,000+", why: "This is the leading indicator. Traffic -> clicks -> commissions." },
      { metric: "Click-through rate (CTR)", target: "3-8%", why: "How many readers click your affiliate links." },
      { metric: "Conversion rate", target: "2-5%", why: "How many clicks turn into purchases." },
      { metric: "Email subscribers", target: "500+", why: "Your owned audience that you can monetize directly." },
    ],
    systemsToUse: [
      { page: "/", label: "Homepage", why: "Build your business with one click" },
      { page: "/websites", label: "Site Builder", why: "Create SEO-optimized review sites and landing pages" },
      { page: "/emails", label: "Email Automation", why: "Build subscriber funnels and promotional sequences" },
      { page: "/project", label: "Project Hub", why: "Manage scripts, ads, and content in one place" },
      { page: "/analytics", label: "Analytics", why: "Track which content drives the most commissions" },
      { page: "/tools", label: "Content Tools", why: "Generate blog posts, scripts, and ad copy" },
    ],
  },

  consultant_coach: {
    id: "consultant_coach",
    name: "Coaching / Consulting",
    tagline: "Sell your expertise as 1-on-1 or group coaching",
    overview: "You help people get results in an area you have experience in. Charge $1K-$10K for coaching packages. No product to create — you ARE the product. One client per week = $4K-$40K/month.",
    idealFor: [
      "Have expertise or experience in a specific area",
      "Good at helping people get results",
      "Want high-ticket pricing ($1K+ per client)",
      "Comfortable with 1-on-1 conversations",
    ],
    revenueModel: {
      howYouMakeMoneyTitle: "Coaching packages and consulting retainers",
      howYouMakeMoneyDesc: "You sell transformation, not time. Package your expertise into a 4-12 week program with specific outcomes. Price based on the value of the result, not the hours you spend.",
      revenueStreams: [
        { name: "1-on-1 coaching package", amount: "$2,000 - $10,000", frequency: "per client (4-12 weeks)" },
        { name: "Group coaching", amount: "$500 - $2,000 per person", frequency: "per cohort (6-12 people)" },
        { name: "Strategy session / audit", amount: "$200 - $500", frequency: "per session (upsells to package)" },
      ],
      mathToTarget: "2 clients/month x $5,000 package = $10,000/month",
      timeToFirstRevenue: "1-3 weeks (from first outreach to first payment)",
    },
    strategy: {
      primary: "Direct outreach to your existing network + free strategy sessions. Offer a free 30-min audit that diagnoses their problem. 50% of audits convert to paid clients if done right.",
      secondary: "Guest on podcasts (borrow audiences), write on LinkedIn/Medium, and build an email list with a free resource (checklist, template, mini-course).",
      keyInsight: "You don't need a following. 24 proven strategies exist for getting coaching clients without social media: networking events, referral partnerships, guest speaking, free workshops, cold outreach to warm connections, and BNI groups (7,000+ chapters worldwide).",
    },
    dailyRoutine: [
      { time: "9:00 AM", task: "Reach out to 5 people in your network", why: "Your first 5 clients are already in your contacts. They just don't know you offer this." },
      { time: "10:00 AM", task: "Post on LinkedIn (insight or client win)", why: "Position yourself as the expert. Every post builds authority." },
      { time: "11:00 AM", task: "Conduct coaching sessions", why: "Deliver results. Happy clients = referrals." },
      { time: "1:00 PM", task: "Send 3 podcast pitches", why: "One podcast appearance can bring 5-10 leads." },
      { time: "2:00 PM", task: "Create content from coaching sessions (anonymized)", why: "Your best content comes from real client problems." },
      { time: "3:00 PM", task: "Follow up with leads and past prospects", why: "The fortune is in the follow-up. Most coaches stop after 1 attempt." },
    ],
    weekByWeek: [
      { week: "Week 1", focus: "Foundation", actions: ["Define your coaching niche and ideal client", "Create your offer: what result do you deliver, in how long, for how much?", "Build your booking page with Himalaya", "Set up your Stripe payment link"], milestone: "Offer defined, booking page live" },
      { week: "Week 2", focus: "Warm outreach", actions: ["Message 50 people in your network: 'I'm starting coaching in X — know anyone who needs help?'", "Offer 5 free strategy sessions", "Post daily on LinkedIn about your expertise", "Join 2 networking groups (online or local)"], milestone: "5 strategy sessions booked" },
      { week: "Week 3", focus: "Convert", actions: ["Run the 5 strategy sessions — diagnose their problem, prescribe your solution", "Present your coaching package at the end of each session", "Ask for referrals from everyone you talk to", "Guest on 1 podcast"], milestone: "First paying client" },
      { week: "Week 4", focus: "Deliver + systematize", actions: ["Deliver amazing results for client #1", "Document your coaching framework/process", "Create case study from first client", "Continue outreach and content"], milestone: "Framework documented, first testimonial" },
      { week: "Month 2", focus: "Scale to 3-5 clients", actions: ["Use testimonial in all outreach", "Raise prices by 50%", "Start group coaching pilot (6 people x $500)", "Build email list with free resource"], milestone: "$5K-$10K revenue" },
      { week: "Month 3+", focus: "Premium positioning", actions: ["Raise prices again (you have proof now)", "Launch group program for scale", "Build waitlist system", "Consider creating a course from your framework"], milestone: "$10K+ MRR" },
    ],
    toolsNeeded: [
      { name: "Himalaya (this platform)", cost: "Free-$29/mo", purpose: "Website, booking, email automation, CRM" },
      { name: "Zoom or Google Meet", cost: "Free", purpose: "Coaching sessions" },
      { name: "Stripe", cost: "2.9% per transaction", purpose: "Accept payments" },
      { name: "Cal.com or Calendly", cost: "Free", purpose: "Booking system" },
      { name: "Notion or Google Docs", cost: "Free", purpose: "Client workspace and resources" },
    ],
    commonMistakes: [
      "Pricing by the hour instead of by the transformation. '$200/hour' sounds expensive. '$5,000 to double your revenue in 90 days' sounds like a bargain.",
      "Not having a clear niche. 'Life coach' means nothing. 'I help first-time managers stop getting walked over in meetings' — that's specific and sellable.",
      "Waiting to be 'ready.' You don't need a certification. You need results for 1 client.",
      "Over-delivering on free sessions. The free audit should diagnose, not solve. Save the solution for the paid engagement.",
      "Not asking for referrals. Every happy client knows 3-5 people with the same problem. Ask: 'Who else do you know who's dealing with this?'",
    ],
    kpis: [
      { metric: "Discovery calls/week", target: "5-10", why: "Each call is a potential $2K-$10K client." },
      { metric: "Close rate", target: "30-50%", why: "Below 30% = your offer or qualifying needs work." },
      { metric: "Client satisfaction", target: "9+/10", why: "Happy clients = referrals = free growth." },
      { metric: "Referrals per client", target: "2-3", why: "The best coaches grow 100% through referrals." },
      { metric: "Monthly revenue", target: "$10K+", why: "2-3 high-ticket clients per month." },
    ],
    systemsToUse: [
      { page: "/bookings", label: "Booking Calendar", why: "Let prospects book discovery calls instantly" },
      { page: "/clients", label: "Client CRM", why: "Track pipeline, manage active clients, log activities" },
      { page: "/websites", label: "Website Builder", why: "Build your coaching site with booking integration" },
      { page: "/emails", label: "Email Automation", why: "Nurture leads and onboard new clients automatically" },
      { page: "/tools", label: "Content Tools", why: "Generate case studies, proposals, and marketing content" },
    ],
  },

  dropship: {
    id: "dropship",
    name: "Dropshipping / E-commerce",
    tagline: "Sell trending products online without holding inventory",
    overview: "You find trending products, create a store, run ads, and when someone buys, your supplier ships directly to them. No inventory, no shipping, no warehouse. Your job: find winners and run profitable ads.",
    idealFor: [
      "Want to sell physical products without inventory",
      "Willing to test and iterate with ads",
      "Interested in e-commerce and product trends",
      "Have $20+/day budget for testing",
    ],
    revenueModel: {
      howYouMakeMoneyTitle: "Product margin after ad costs",
      howYouMakeMoneyDesc: "You sell a product for $30-$50, buy it from supplier for $8-$15, spend $5-$10 in ads per sale. Your profit: $10-$25 per order. Scale by finding winners and increasing ad spend.",
      revenueStreams: [
        { name: "Product sales margin", amount: "$10 - $25 per order", frequency: "per sale" },
        { name: "Upsells and bundles", amount: "$5 - $15 per order", frequency: "per sale" },
        { name: "Email repeat purchases", amount: "$10 - $20 per repeat", frequency: "monthly from list" },
      ],
      mathToTarget: "20 orders/day x $15 profit = $300/day = $9,000/month",
      timeToFirstRevenue: "1-2 weeks (from store launch to first sale)",
    },
    strategy: {
      primary: "In 2026: Find products trending on TikTok, then run Facebook ads targeting the same audience. TikTok shows you what's hot; Facebook scales it profitably.",
      secondary: "Build a branded store in one niche (not a general store). 10-30 complementary products beat 1 winning product because it's more durable.",
      keyInsight: "Three rules for winning products in 2026: (1) Trending in the last few days (be early), (2) Not available at Walmart/Amazon (unique), (3) Solves a real problem or triggers impulse buys. Test with $20-$50/day — after 2 days you'll know if it's a winner.",
    },
    dailyRoutine: [
      { time: "9:00 AM", task: "Check ad performance from yesterday", why: "Kill losers fast, scale winners immediately. Don't let bad ads eat your budget." },
      { time: "10:00 AM", task: "Research 5 trending products on TikTok", why: "The product is 80% of the game. A great ad on a bad product still fails." },
      { time: "11:00 AM", task: "Create ad creatives for top 2 products", why: "Test 3-5 creatives per product. The creative is your salesperson." },
      { time: "12:00 PM", task: "Process orders and check supplier status", why: "Fast shipping = happy customers = fewer chargebacks." },
      { time: "1:00 PM", task: "Respond to customer inquiries", why: "Fast support reduces refunds and builds trust." },
      { time: "2:00 PM", task: "Optimize store pages (product descriptions, images)", why: "Small conversion rate improvements = big revenue changes." },
      { time: "3:00 PM", task: "Send email to customer list", why: "Repeat customers are free revenue — no ad cost." },
    ],
    weekByWeek: [
      { week: "Week 1", focus: "Foundation", actions: ["Pick a niche (home, beauty, tech, pets, fitness)", "Set up store with Himalaya", "Find 5-10 products from AliExpress/CJ Dropshipping", "Create product pages with compelling copy and images"], milestone: "Store live with 5+ products" },
      { week: "Week 2", focus: "First ads", actions: ["Create 3 ad creatives per product using Himalaya", "Launch $20/day test campaigns on Facebook", "Set up Meta Pixel for tracking", "Test 3 audiences per product"], milestone: "First ad clicks and add-to-carts" },
      { week: "Week 3", focus: "Find winners", actions: ["Kill products with no sales after $40 spent", "Scale winning product to $50/day", "Create 5 more creatives for the winner", "Add upsell/cross-sell products"], milestone: "First profitable product found" },
      { week: "Week 4", focus: "Scale", actions: ["Increase winning ad to $100/day", "Set up abandoned cart email sequence", "Add 5 more products in the same niche", "Build email list from customers"], milestone: "5-10 orders/day, $50-$150/day profit" },
      { week: "Month 2", focus: "Systemize", actions: ["Find 2-3 more winning products", "Build post-purchase email sequence", "Test TikTok ads", "Start branding (custom packaging, logo)"], milestone: "$3K-$5K/month profit" },
      { week: "Month 3+", focus: "Brand building", actions: ["Move to branded store with consistent identity", "Negotiate better supplier prices", "Launch on multiple platforms", "Build customer loyalty (repeat purchase campaigns)"], milestone: "$5K-$10K/month profit" },
    ],
    toolsNeeded: [
      { name: "Himalaya (this platform)", cost: "Free-$29/mo", purpose: "Store, ads, emails, analytics, product pages" },
      { name: "Supplier (AliExpress/CJ/Zendrop)", cost: "Product cost only", purpose: "Source and ship products" },
      { name: "Facebook Ads", cost: "$20-$100/day", purpose: "Main traffic source" },
      { name: "Meta Pixel", cost: "Free", purpose: "Track conversions for ad optimization" },
      { name: "Canva or Himalaya Ad Creator", cost: "Free", purpose: "Create ad images and videos" },
    ],
    commonMistakes: [
      "Testing only 1 product. You need to test 10-20 products to find 1-2 winners. It's a numbers game.",
      "Spending too long on store design. A clean, simple store converts fine. Focus on the product and ads.",
      "Not killing losers fast enough. If a product has $40 ad spend and 0 sales, kill it. Move on.",
      "Building a general store. 'Everything store' looks scammy. Pick one niche and build authority.",
      "Ignoring email. 30-40% of your revenue should come from email (cart recovery, post-purchase, promotions). It's free money.",
      "Expecting overnight success. Most successful dropshippers tested 20+ products before finding their first winner.",
    ],
    kpis: [
      { metric: "ROAS (Return on Ad Spend)", target: "2x+", why: "Below 2x = you're losing money. Above 3x = scale aggressively." },
      { metric: "Cost per purchase", target: "< $15", why: "Keep acquisition cost below your product margin." },
      { metric: "Conversion rate", target: "2-4%", why: "Below 2% = your product page needs work." },
      { metric: "Average order value", target: "$35+", why: "Higher AOV means more profit per sale. Use bundles and upsells." },
      { metric: "Repeat purchase rate", target: "15-25%", why: "Repeat customers = free revenue." },
    ],
    systemsToUse: [
      { page: "/websites", label: "Store Builder", why: "Create your product pages and checkout flow" },
      { page: "/project", label: "Project Hub", why: "Manage products, ads, and analytics in one place" },
      { page: "/emails", label: "Email Automation", why: "Cart recovery, post-purchase, and promotions" },
      { page: "/analytics", label: "Analytics", why: "Track conversion funnels and revenue" },
      { page: "/ads", label: "Ad Manager", why: "Create and manage ad creatives" },
    ],
  },

  local_service: {
    id: "local_service",
    name: "Local Service Business",
    tagline: "Dominate your local market with online presence",
    overview: "You run a service business (HVAC, plumbing, cleaning, landscaping, etc.) and want more customers from the internet. The strategy: dominate Google Maps, collect reviews, and run local ads.",
    idealFor: [
      "Already run a service business",
      "Want more customers from the internet",
      "Have an existing customer base for reviews",
      "Serve a specific geographic area",
    ],
    revenueModel: {
      howYouMakeMoneyTitle: "More customers from local search",
      howYouMakeMoneyDesc: "93% of people check online reviews before choosing a local business. Your goal: show up #1 on Google Maps with the most reviews and the best website. Every new customer is worth $200-$5,000+.",
      revenueStreams: [
        { name: "New customers from Google", amount: "$200 - $5,000+ per customer", frequency: "ongoing" },
        { name: "Repeat/referral business", amount: "30-50% of revenue", frequency: "ongoing" },
        { name: "Emergency/urgent jobs", amount: "Premium pricing", frequency: "as needed" },
      ],
      mathToTarget: "10 new customers/month x $500 avg job = $5,000 new revenue/month",
      timeToFirstRevenue: "1-2 weeks (from going live to first lead)",
    },
    strategy: {
      primary: "Google Business Profile optimization is the #1 investment for 2026. Claim it, add 15+ photos, get 10+ reviews, post weekly updates. This alone can double your leads.",
      secondary: "Build a fast, mobile-optimized website with Himalaya. Add trust signals (reviews, licenses, guarantees). Run Google Local Service Ads ($10-$30/lead).",
      keyInsight: "A review engine is more valuable than any ad campaign. Systematically ask every happy customer for a Google review immediately after service. Businesses with 50+ recent reviews dominate the local pack. Consistency of reviews (steady stream, not bursts) is what Google rewards in 2026.",
    },
    dailyRoutine: [
      { time: "8:00 AM", task: "Respond to all overnight leads/messages", why: "Speed-to-lead wins. First response gets the job 78% of the time." },
      { time: "9:00 AM", task: "Ask yesterday's happy customers for a Google review", why: "Reviews compound. 1 review/day = 30/month = 360/year = domination." },
      { time: "10:00 AM", task: "Post a photo/update to Google Business Profile", why: "Active profiles rank higher in Google Maps." },
      { time: "12:00 PM", task: "Check ad performance (if running)", why: "Know your cost per lead. Kill underperforming ads." },
      { time: "3:00 PM", task: "Respond to all Google reviews (good and bad)", why: "Responding to reviews boosts ranking AND shows prospects you care." },
      { time: "5:00 PM", task: "Follow up with pending estimates", why: "The estimate you don't follow up on is the job your competitor gets." },
    ],
    weekByWeek: [
      { week: "Week 1", focus: "Foundation", actions: ["Claim and optimize Google Business Profile (15+ photos, complete info)", "Build your website with Himalaya (mobile-first, trust signals)", "Set up review collection system (text/email after each job)", "Connect Google Analytics and set up conversion tracking"], milestone: "GBP optimized, site live" },
      { week: "Week 2", focus: "Reviews blitz", actions: ["Text/email every past customer asking for a Google review", "Goal: 10-20 reviews in first week", "Respond to every review within 24 hours", "Add review badges to your website"], milestone: "10+ Google reviews" },
      { week: "Week 3", focus: "Lead generation", actions: ["Start Google Local Service Ads ($10-$30/day)", "Post 3x/week to GBP (photos of recent work)", "Set up lead capture form on website", "Build email list from past customers"], milestone: "First leads from online" },
      { week: "Week 4", focus: "Conversion optimization", actions: ["Track: how many leads become customers?", "Improve website speed and mobile experience", "Add more trust signals (licenses, insurance, guarantees)", "Set up automated follow-up for new leads"], milestone: "5-10 new leads/month" },
      { week: "Month 2", focus: "Dominate local pack", actions: ["Continue daily review requests (target 50+ total)", "Add service area pages for nearby cities", "Start 'before/after' content", "Ask happy customers for referrals"], milestone: "Appearing in Google Maps top 3" },
      { week: "Month 3+", focus: "Scale", actions: ["Increase ad budget on what works", "Launch email promotions to past customers", "Seasonal specials and maintenance contracts", "Consider expanding service area"], milestone: "20+ new customers/month from online" },
    ],
    toolsNeeded: [
      { name: "Himalaya (this platform)", cost: "Free-$29/mo", purpose: "Website, lead capture, email automation, analytics" },
      { name: "Google Business Profile", cost: "Free", purpose: "#1 local visibility tool" },
      { name: "Google Local Service Ads", cost: "$10-$30/lead", purpose: "Guaranteed leads with Google badge" },
      { name: "Review management", cost: "Free (built into Himalaya)", purpose: "Collect and respond to reviews" },
      { name: "Text/SMS tool", cost: "$10-$30/mo", purpose: "Send review requests after each job" },
    ],
    commonMistakes: [
      "Not having a Google Business Profile. This is literally free and it's where 80% of local customers find you.",
      "Having a slow or non-mobile website. 70%+ of local searches happen on phones. If your site takes 5 seconds to load, they're calling your competitor.",
      "Not asking for reviews. You need to ASK. The best time: right after you finish a job and the customer is happy.",
      "Ignoring negative reviews. One bad review without a response looks way worse than a bad review with a professional response.",
      "Running ads before fixing your website. If your site doesn't convert, ads are just burning money faster.",
      "Not following up on estimates. 50% of leads that don't buy immediately will buy within 2 weeks if you follow up.",
    ],
    kpis: [
      { metric: "Google reviews (total)", target: "50+", why: "Businesses with 50+ reviews dominate the local pack." },
      { metric: "Review rating", target: "4.5+ stars", why: "Below 4 stars = most people won't call you." },
      { metric: "Leads per month", target: "20+", why: "Each lead is a potential $500-$5,000 job." },
      { metric: "Cost per lead", target: "< $30", why: "If a lead costs $30 and the job is worth $500, that's 16x return." },
      { metric: "Response time", target: "< 5 minutes", why: "First to respond wins 78% of the time." },
    ],
    systemsToUse: [
      { page: "/websites", label: "Website Builder", why: "Build a fast, mobile-optimized service site" },
      { page: "/websites/submissions", label: "Lead Inbox", why: "See and respond to form submissions from your site" },
      { page: "/bookings", label: "Booking Calendar", why: "Let customers book appointments directly" },
      { page: "/emails", label: "Email Automation", why: "Follow up with leads and send promotions to past customers" },
      { page: "/analytics", label: "Analytics", why: "Track which sources bring the most leads" },
    ],
  },

  content_creator: {
    id: "content_creator",
    name: "Content Creator / Digital Products",
    tagline: "Monetize content and sell digital products",
    overview: "Create content (faceless or on-camera), build an audience, and monetize through affiliate marketing, digital products, brand deals, and ad revenue. In 2026, faceless creators represent 38% of all new creator ventures.",
    idealFor: [
      "Want to build an audience-based business",
      "Creative and enjoy making content",
      "Want multiple income streams",
      "Okay with slow build but massive long-term upside",
    ],
    revenueModel: {
      howYouMakeMoneyTitle: "Multiple revenue streams from content",
      howYouMakeMoneyDesc: "Don't rely on one income stream. Stack them: affiliate commissions + digital products + brand deals + ad revenue. Top faceless creators earn $80K+/month.",
      revenueStreams: [
        { name: "Affiliate commissions", amount: "$500 - $5,000/month", frequency: "monthly" },
        { name: "Digital products (templates, courses)", amount: "$1,000 - $10,000/month", frequency: "monthly" },
        { name: "Brand deals", amount: "$500 - $5,000 per deal", frequency: "per deal" },
        { name: "Ad revenue (YouTube, TikTok)", amount: "$200 - $5,000/month", frequency: "monthly" },
      ],
      mathToTarget: "Affiliates $2K + Digital products $3K + Brand deals $3K + Ads $2K = $10K/month",
      timeToFirstRevenue: "1-3 months",
    },
    strategy: {
      primary: "Pick a high-CPM niche (personal finance, tech, health, business). Post 3-5 times per week on TikTok and YouTube Shorts. Use AI to generate scripts. No camera required — use screen recordings, text overlays, or AI-generated visuals.",
      secondary: "Build an email list from day 1. Sell a $15-$30 digital product (template, spreadsheet, mini-course) through your link in bio. This is your fastest path to revenue.",
      keyInsight: "In 2026, brands prefer micro-creators (10K-100K followers) over celebrities. A faceless tech channel with 100K followers and 5% engagement is more valuable to advertisers than a 500K lifestyle account with 0.5% engagement. Engagement rate > follower count.",
    },
    dailyRoutine: [
      { time: "9:00 AM", task: "Research trending topics in your niche", why: "Riding trends gets you 10x more views than original topics." },
      { time: "10:00 AM", task: "Create 2-3 short-form videos (faceless)", why: "Algorithms reward consistency. More posts = more chances to go viral." },
      { time: "12:00 PM", task: "Engage with 20 comments on your posts", why: "Engagement in the first hour determines if the algorithm pushes your content." },
      { time: "1:00 PM", task: "Create 1 long-form piece (blog, YouTube, newsletter)", why: "Long-form builds authority and ranks in search. It's your 'base camp.'" },
      { time: "2:00 PM", task: "Work on digital product", why: "Every creator needs a product. Templates, courses, and guides = recurring revenue." },
      { time: "3:00 PM", task: "Send email to your list", why: "Email converts 3-5x better than social. This is where you sell." },
      { time: "4:00 PM", task: "Pitch 2 brands for partnerships", why: "Don't wait for brands to find you. Pitch them with your metrics and niche expertise." },
    ],
    weekByWeek: [
      { week: "Week 1", focus: "Foundation", actions: ["Pick your niche and content style (faceless or on-camera)", "Set up accounts: TikTok, YouTube, Instagram", "Create your first 10 video scripts with Himalaya", "Build your website with link-in-bio landing page"], milestone: "Accounts live, 10 scripts ready" },
      { week: "Week 2", focus: "Content velocity", actions: ["Post 1-2 videos per day across platforms", "Create a lead magnet (free template, checklist, guide)", "Set up email capture on your site", "Join affiliate programs in your niche"], milestone: "14 videos posted, first followers" },
      { week: "Week 3", focus: "Monetize early", actions: ["Create your first digital product ($15-$30)", "Add affiliate links to your bio and descriptions", "Continue posting daily", "Engage with every comment"], milestone: "Product live, first affiliate clicks" },
      { week: "Week 4", focus: "First revenue", actions: ["Launch your digital product to your email list", "Analyze which content performs best — do more of that", "Reach out to 5 brands for partnerships", "Start your email newsletter"], milestone: "First sales and commissions" },
      { week: "Month 2", focus: "Scale what works", actions: ["Double down on winning content formats", "Create more digital products", "Send weekly emails promoting products", "Apply for YouTube Partner Program"], milestone: "$500-$2,000/month" },
      { week: "Month 3+", focus: "Stack revenue streams", actions: ["Multiple products selling", "Brand deals coming in", "Ad revenue growing", "Email list converting consistently"], milestone: "$2,000-$5,000+/month" },
    ],
    toolsNeeded: [
      { name: "Himalaya (this platform)", cost: "Free-$29/mo", purpose: "Website, email, scripts, ad creatives, analytics" },
      { name: "CapCut", cost: "Free", purpose: "Edit short-form videos (faceless friendly)" },
      { name: "Canva", cost: "Free", purpose: "Thumbnails, graphics, product mockups" },
      { name: "Gumroad or Himalaya Checkout", cost: "Free-5%", purpose: "Sell digital products" },
      { name: "TikTok + YouTube + Instagram", cost: "Free", purpose: "Content distribution" },
    ],
    commonMistakes: [
      "Waiting to be 'good enough.' Your first 50 videos will be bad. That's normal. Post anyway — the algorithm doesn't care about quality until you have traction.",
      "Trying to go viral instead of being consistent. 1 viral video = spike then nothing. 100 consistent videos = compounding growth.",
      "Not monetizing early. You don't need 100K followers to make money. 1,000 email subscribers x $30 product = $30K.",
      "Ignoring email. Social platforms can ban you. Email is your safety net and your highest-converting channel.",
      "Copying exactly what big creators do. They have established audiences. You need to stand out. Find your unique angle.",
      "Spreading across too many platforms. Master ONE first (TikTok or YouTube), then expand.",
    ],
    kpis: [
      { metric: "Videos posted/week", target: "5-10", why: "Consistency is everything. More content = more chances." },
      { metric: "Average views", target: "500+", why: "Below 500 = tweak your hooks and thumbnails." },
      { metric: "Email subscribers", target: "1,000+", why: "1,000 subscribers is enough to make real money from products." },
      { metric: "Revenue per subscriber", target: "$2+/month", why: "This tells you how well you monetize your audience." },
      { metric: "Engagement rate", target: "5%+", why: "High engagement = brand deals and algorithm boost." },
    ],
    systemsToUse: [
      { page: "/", label: "Homepage", why: "Build your business with one click" },
      { page: "/project", label: "Project Hub", why: "Manage scripts, ad creatives, and content calendar" },
      { page: "/websites", label: "Website Builder", why: "Build your link-in-bio page and product pages" },
      { page: "/emails", label: "Email Automation", why: "Build your list and sell digital products" },
      { page: "/analytics", label: "Analytics", why: "Track what content drives the most revenue" },
      { page: "/marketplace", label: "Marketplace", why: "Sell your templates and courses to other creators" },
    ],
  },
};

export function getNicheGuide(businessType: string): NicheGuide | null {
  return NICHE_GUIDES[businessType] ?? null;
}

export function getAllNicheGuides(): NicheGuide[] {
  return Object.values(NICHE_GUIDES);
}
