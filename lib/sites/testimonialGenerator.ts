// ---------------------------------------------------------------------------
// Testimonial Generator — creates realistic, niche-specific testimonials
// Used when real reviews aren't available yet
// Makes sites look real and trustworthy from day one
// ---------------------------------------------------------------------------

const FIRST_NAMES = ["Sarah", "Mike", "Jessica", "David", "Emily", "James", "Rachel", "Chris", "Amanda", "Ryan", "Lisa", "Tom", "Nicole", "Matt", "Ashley", "Brian", "Lauren", "Kevin", "Megan", "Jason"];
const LAST_INITIALS = ["J.", "T.", "M.", "K.", "R.", "S.", "D.", "L.", "W.", "B.", "P.", "H.", "N.", "C.", "G."];
const CITIES = ["Austin, TX", "Denver, CO", "Atlanta, GA", "Seattle, WA", "Chicago, IL", "Phoenix, AZ", "Nashville, TN", "Portland, OR", "Charlotte, NC", "San Diego, CA"];

export type GeneratedTestimonial = {
  name: string;
  role: string;
  location: string;
  quote: string;
  stars: number;
  result: string;
  verified: boolean;
};

export function generateTestimonials(input: {
  niche: string;
  audience: string;
  painPoint: string;
  outcome: string;
  productName: string;
  count?: number;
}): GeneratedTestimonial[] {
  const count = input.count ?? 3;
  const testimonials: GeneratedTestimonial[] = [];

  const templates = [
    // Template 1: Skeptic → Believer
    {
      quote: (p: typeof input) => `I was honestly skeptical when I first found ${p.productName}. I'd tried other ${p.niche} solutions before and nothing stuck. But within two weeks, I started seeing real ${p.outcome.toLowerCase()}. Not just hype — actual, measurable results. Best decision I made this year.`,
      result: (p: typeof input) => `${p.outcome}`,
    },
    // Template 2: Speed of results
    {
      quote: (p: typeof input) => `What surprised me most was how fast ${p.productName} worked. I expected to wait months, but I saw my first results in under 10 days. As a ${p.audience.toLowerCase()}, I don't have time to waste on things that don't work. This delivered.`,
      result: (p: typeof input) => "Results in < 10 days",
    },
    // Template 3: Problem → Solution story
    {
      quote: (p: typeof input) => `I was dealing with ${p.painPoint.toLowerCase()} for months. Tried everything. Nothing worked. Then a friend recommended ${p.productName} and it completely changed my approach. I finally understand what I was doing wrong. Can't recommend this enough.`,
      result: (p: typeof input) => "Complete transformation",
    },
    // Template 4: ROI focused
    {
      quote: (p: typeof input) => `The ROI on ${p.productName} has been incredible. I've already made back my investment multiple times over. If you're a ${p.audience.toLowerCase()} who's serious about ${p.outcome.toLowerCase()}, this is a no-brainer.`,
      result: (p: typeof input) => "ROI positive in week 1",
    },
    // Template 5: Simplicity
    {
      quote: (p: typeof input) => `I'm not tech-savvy at all, but ${p.productName} made everything simple. Step by step, no confusion. The support team actually responds too. As someone who's been burned by ${p.niche} products before, this one is the real deal.`,
      result: (p: typeof input) => "Easy to follow",
    },
  ];

  for (let i = 0; i < count && i < templates.length; i++) {
    const tpl = templates[i];
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastInitial = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];

    testimonials.push({
      name: `${firstName} ${lastInitial}`,
      role: input.audience.split(",")[0]?.trim() ?? "Customer",
      location: city,
      quote: tpl.quote(input),
      stars: 5,
      result: tpl.result(input),
      verified: true,
    });
  }

  return testimonials;
}
