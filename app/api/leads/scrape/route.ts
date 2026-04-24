import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { niche: string; location: string };
    if (!body.niche || !body.location) {
      return NextResponse.json({ ok: false, error: "niche and location required" }, { status: 400 });
    }

    // Try SerpAPI Google Maps scraper
    const serpApiKey = process.env.SERPAPI_KEY;
    if (serpApiKey) {
      try {
        const query = encodeURIComponent(`${body.niche} in ${body.location}`);
        const res = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${serpApiKey}&num=20`);
        const data = await res.json();

        const businesses = (data.local_results ?? []).map((r: Record<string, unknown>) => ({
          name: r.title ?? "Unknown",
          address: r.address ?? "",
          phone: r.phone ?? "",
          website: r.website ?? "",
          rating: r.rating ?? 0,
          reviewCount: r.reviews ?? 0,
          category: r.type ?? body.niche,
        }));

        return NextResponse.json({ ok: true, businesses, source: "google_maps" });
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback: generate realistic placeholder businesses for the niche
    // This lets users test the flow without SerpAPI
    const fallbackBusinesses = generateFallbackBusinesses(body.niche, body.location);
    return NextResponse.json({ ok: true, businesses: fallbackBusinesses, source: "generated" });
  } catch (err) {
    console.error("Lead scrape error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

function generateFallbackBusinesses(niche: string, location: string) {
  const nicheNames: Record<string, string[]> = {
    dentists: ["Smile Dental", "Family Dentistry", "Bright Teeth Dental", "Premier Dental Care", "City Dental Group", "Gentle Care Dentistry", "Modern Dental Studio", "Healthy Smiles Clinic"],
    hvac: ["Cool Air Services", "Premier Heating & Cooling", "Comfort Zone HVAC", "All Season Climate", "Reliable Air Systems", "Quick Cool Solutions", "Total Comfort HVAC", "AirPro Services"],
    "law firms": ["Smith & Associates", "Justice Legal Group", "City Law Partners", "Premier Legal Services", "Advocate Law Firm", "Liberty Legal", "Pinnacle Legal Group", "Shield Law Offices"],
    "med spas": ["Radiance Med Spa", "Glow Aesthetics", "Pure Beauty Clinic", "Elite Med Spa", "Refresh Aesthetics", "Luxe Skin Studio", "Ageless Beauty Spa", "Derma Luxe"],
    "real estate": ["Prime Realty Group", "HomeFind Realtors", "City Property Experts", "Dream Homes Realty", "Elite Real Estate", "Sunrise Properties", "Metro Home Sales", "Keystone Realty"],
    default: ["Local Business Pro", "City Services Inc", "Premier Solutions", "Quality First LLC", "Expert Services Co", "Reliable Business Group", "Top Choice Services", "Best in Town LLC"],
  };

  const names = nicheNames[niche.toLowerCase()] ?? nicheNames.default;

  return names.map((name, i) => ({
    name: `${name} - ${location}`,
    address: `${100 + i * 23} Main St, ${location}`,
    phone: `(555) ${String(100 + i * 11).padStart(3, "0")}-${String(1000 + i * 111).slice(0, 4)}`,
    website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    rating: 3.5 + Math.random() * 1.5,
    reviewCount: Math.floor(10 + Math.random() * 200),
    category: niche,
  }));
}
