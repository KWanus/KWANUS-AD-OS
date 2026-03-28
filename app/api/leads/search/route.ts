import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

interface SerpApiResult {
  place_id?: string;
  title?: string;
  website?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviews?: number;
}

interface SerpApiResponse {
  local_results?: SerpApiResult[];
  error?: string;
}

async function searchSerpApi(niche: string, location: string): Promise<{ results: SerpApiResult[]; isDemo: boolean }> {
  const key = config.serpApiKey;
  if (!key || key === "REPLACE_ME") {
    // Return demo data clearly marked — won't be saved to DB
    return { results: getDemoLeads(niche, location), isDemo: true };
  }

  const query = encodeURIComponent(`${niche} in ${location}`);
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${key}&num=20`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`);

  const data = await res.json() as SerpApiResponse;
  if (data.error) throw new Error(data.error);

  return { results: data.local_results ?? [], isDemo: false };
}

function getDemoLeads(niche: string, location: string): SerpApiResult[] {
  const names = [
    `${location} ${niche} Co.`, `Elite ${niche} Services`, `Pro ${niche} Group`,
    `${niche} Masters LLC`, `First Choice ${niche}`, `Premier ${niche} Solutions`,
    `${location} ${niche} Pros`, `Quality ${niche} Works`, `Reliable ${niche} Inc`,
    `Top ${niche} Contractors`,
  ];
  return names.map((name, i) => ({
    place_id: `demo_${i}`,
    title: name,
    website: i % 3 === 0 ? undefined : `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: `${Math.floor(Math.random() * 9000) + 100} Main St, ${location}`,
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    reviews: Math.floor(Math.random() * 200) + 5,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json() as { niche?: string; location?: string };
    const niche = body.niche?.trim();
    const location = body.location?.trim();

    if (!niche || !location) {
      return NextResponse.json({ ok: false, error: "Niche and location are required" }, { status: 400 });
    }

    const { results, isDemo } = await searchSerpApi(niche, location);

    // Don't save demo leads to the database — only show them in the UI
    if (isDemo) {
      return NextResponse.json({
        ok: true,
        found: results.length,
        created: 0,
        isDemo: true,
        demoResults: results.map(r => ({
          name: r.title ?? "Unknown",
          website: r.website,
          phone: r.phone,
          address: r.address,
          rating: r.rating,
          reviews: r.reviews,
        })),
      });
    }

    // Insert new leads — batch-check existing to avoid N+1
    const candidates = results.slice(0, 15).filter((r) => !!r.title);
    const names = candidates.map((r) => r.title as string);

    const existingLeads = await prisma.lead.findMany({
      where: { userId: user.id, location, name: { in: names } },
      select: { name: true },
    });
    const existingNames = new Set(existingLeads.map((l) => l.name));

    const toCreate = candidates.filter((r) => !existingNames.has(r.title as string));
    if (toCreate.length > 0) {
      await prisma.lead.createMany({
        data: toCreate.map((r) => ({
          userId: user.id,
          name: r.title as string,
          niche,
          location,
          website: r.website ?? null,
          phone: r.phone ?? null,
          address: r.address ?? null,
          rating: r.rating ?? null,
          reviewCount: r.reviews ?? null,
          googlePlaceId: r.place_id ?? null,
          status: "new",
        })),
        skipDuplicates: true,
      });
    }
    const created = toCreate;

    return NextResponse.json({
      ok: true,
      found: results.length,
      created: created.length,
      isDemo: false,
    } as const);
  } catch (err) {
    console.error("Lead search error:", err);
    return NextResponse.json({ ok: false, error: "Search failed. Try again." }, { status: 500 });
  }
}
