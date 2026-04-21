import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Get all sites owned by this user
    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    });

    if (sites.length === 0) {
      return NextResponse.json({ ok: true, submissions: [] });
    }

    const siteIds = sites.map(s => s.id);
    const siteNameMap = Object.fromEntries(sites.map(s => [s.id, s.name]));

    // Get leads that came from form submissions on these sites
    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        status: { not: "deleted" },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        status: true,
        createdAt: true,
        profileJson: true,
      },
    });

    const submissions = leads.map(lead => {
      const profile = lead.profileJson as Record<string, unknown> | null;
      const siteId = (profile?.siteId as string) ?? siteIds[0] ?? "";
      return {
        id: lead.id,
        siteId,
        siteName: siteNameMap[siteId] ?? "Unknown Site",
        email: lead.email ?? "",
        name: lead.name ?? undefined,
        phone: lead.phone ?? undefined,
        message: lead.notes ?? undefined,
        source: (profile?.source as string) ?? "form",
        createdAt: lead.createdAt.toISOString(),
        fields: (profile?.formFields as Record<string, string>) ?? {},
      };
    }).filter(s => s.email);

    return NextResponse.json({ ok: true, submissions });
  } catch (err) {
    console.error("Submissions error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
