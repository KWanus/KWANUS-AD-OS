// ---------------------------------------------------------------------------
// Local Business Path — COMPLETE automated pipeline
// From "I'm a plumber in Houston" → GMB optimization → local site →
// review collection → local ads → appointment booking → scale
//
// Different from others: geo-targeted, review-focused, booking-first
// ---------------------------------------------------------------------------

export type LocalBusinessConfig = {
  businessName: string;
  niche: string;        // "plumber", "dentist", "restaurant", etc.
  location: string;     // "Houston, TX"
  phone: string;
  serviceArea: string[];
  services: string[];
  hours: string;
};

/** Generate local business site blocks */
export function generateLocalSiteBlocks(config: LocalBusinessConfig): object[] {
  return [
    // Hero with phone + location
    { type: "hero", data: {
      headline: `${config.location}'s Trusted ${config.niche.charAt(0).toUpperCase() + config.niche.slice(1)}`,
      subheadline: `${config.businessName} — serving ${config.serviceArea.join(", ")} with reliable, affordable ${config.niche} services. Call now or book online.`,
      ctaText: `Call ${config.phone}`,
      ctaUrl: `tel:${config.phone.replace(/[^0-9+]/g, "")}`,
    }},
    // Trust bar with local signals
    { type: "trust", data: { items: [
      `Serving ${config.location}`,
      "Licensed & Insured",
      "5-Star Rated",
      "Same-Day Service Available",
      config.hours,
    ]}},
    // Services
    { type: "features", data: {
      eyebrow: "What We Do",
      title: "Our Services",
      items: config.services.map((s) => ({ title: s, description: `Professional ${s.toLowerCase()} services in ${config.location}.` })),
    }},
    // Service areas
    { type: "text", data: {
      headline: "Areas We Serve",
      body: `${config.businessName} proudly serves ${config.serviceArea.join(", ")}. Whether you're in the heart of ${config.location} or the surrounding areas, we're here for you.\n\nCall us at ${config.phone} or book online — we typically respond within 15 minutes.`,
    }},
    // Social proof
    { type: "testimonials", data: {
      eyebrow: "What Our Customers Say",
      title: `Why ${config.location} Trusts Us`,
      items: [
        { name: "[Customer Name]", role: `${config.location} Resident`, quote: `Best ${config.niche} service in ${config.location}. On time, fair pricing, and quality work. Highly recommend!`, stars: 5, result: "5-Star Service", verified: true },
        { name: "[Customer Name]", role: "Business Owner", quote: `Called ${config.businessName} for an emergency and they were here within an hour. Professional, honest, and reliable.`, stars: 5, result: "Same-Day Response", verified: true },
      ],
    }},
    // Guarantee
    { type: "guarantee", data: {
      icon: "🛡️",
      headline: "Our Guarantee",
      body: `If you're not 100% satisfied with our ${config.niche} service, we'll come back and make it right — free of charge. That's the ${config.businessName} promise.`,
    }},
    // Booking / Contact
    { type: "form", data: {
      headline: "Book Your Appointment",
      subtitle: `Fill out the form and we'll call you back within 15 minutes. Or call us directly at ${config.phone}.`,
      fields: [
        { name: "name", type: "text", placeholder: "Your Name", required: true },
        { name: "phone", type: "tel", placeholder: "Phone Number", required: true },
        { name: "email", type: "email", placeholder: "Email Address" },
        { name: "message", type: "textarea", placeholder: `Describe your ${config.niche} need...` },
      ],
      buttonText: "Request Appointment",
    }},
    // Map area (text placeholder — would embed Google Maps)
    { type: "text", data: {
      headline: `Find Us in ${config.location}`,
      body: `${config.businessName}\n${config.location}\nPhone: ${config.phone}\nHours: ${config.hours}\n\nServing: ${config.serviceArea.join(" · ")}`,
    }},
  ];
}

/** Generate local business email sequence */
export function generateLocalEmails(config: LocalBusinessConfig): { subject: string; body: string; timing: string }[] {
  return [
    {
      timing: "Immediate",
      subject: `Thanks for contacting ${config.businessName}`,
      body: `Hey {firstName},\n\nThanks for reaching out to ${config.businessName}! We received your request and will call you back within 15 minutes during business hours (${config.hours}).\n\nIf it's urgent, call us directly at ${config.phone}.\n\nWe look forward to helping you!\n\n— ${config.businessName} Team`,
    },
    {
      timing: "Day 3",
      subject: `How was your experience with ${config.businessName}?`,
      body: `Hey {firstName},\n\nHope everything went well! If we recently completed work for you, we'd love to hear about your experience.\n\nA quick Google review helps other ${config.location} residents find quality ${config.niche} service:\n\n[REVIEW_LINK]\n\nTakes 30 seconds and means the world to our small business.\n\nThank you!\n— ${config.businessName}`,
    },
    {
      timing: "Day 30",
      subject: `Seasonal ${config.niche} checkup — ${config.location}`,
      body: `Hey {firstName},\n\nJust a friendly reminder: regular ${config.niche} maintenance prevents expensive emergencies.\n\n${config.businessName} offers seasonal checkups for existing customers at a special rate. Book before the end of the month and save 15%.\n\nCall ${config.phone} or reply to this email to schedule.\n\n— ${config.businessName} Team`,
    },
  ];
}

/** Generate local ad hooks */
export function generateLocalAdHooks(config: LocalBusinessConfig): { platform: string; text: string }[] {
  return [
    { platform: "Google", text: `${config.businessName} — ${config.location}'s #1 ${config.niche}. Same-day service. Licensed & insured. Call ${config.phone}.` },
    { platform: "Facebook", text: `Need a ${config.niche} in ${config.location}? ${config.businessName} — 5-star rated, same-day service, fair pricing. Book online or call ${config.phone}.` },
    { platform: "Google", text: `Emergency ${config.niche} in ${config.location}? ${config.businessName} responds in under 1 hour. Licensed, insured, guaranteed. ${config.phone}` },
    { platform: "Facebook", text: `${config.location} homeowners: stop overpaying for ${config.niche} service. ${config.businessName} — transparent pricing, quality work, 5-star reviews.` },
    { platform: "Google", text: `Best ${config.niche} in ${config.location}. Free estimates. ${config.businessName} — serving ${config.serviceArea[0] ?? config.location} for years. ${config.phone}` },
  ];
}

/** Generate local SEO structured data */
export function generateLocalSchema(config: LocalBusinessConfig): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: config.businessName,
    description: `${config.businessName} provides professional ${config.niche} services in ${config.location} and surrounding areas.`,
    telephone: config.phone,
    address: { "@type": "PostalAddress", addressLocality: config.location.split(",")[0], addressRegion: config.location.split(",")[1]?.trim() },
    areaServed: config.serviceArea.map((a) => ({ "@type": "City", name: a })),
    openingHours: config.hours,
    priceRange: "$$",
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "50" },
  }, null, 2);
}
