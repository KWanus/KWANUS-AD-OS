import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET — export all user data as JSON (GDPR data portability) */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Gather all user data
    const [
      profile,
      sites,
      campaigns,
      emailFlows,
      emailContacts,
      leads,
      orders,
      products,
      creditLogs,
    ] = await Promise.all([
      prisma.businessProfile.findUnique({ where: { userId: user.id } }).catch(() => null),
      prisma.site.findMany({ where: { userId: user.id }, include: { pages: true } }).catch(() => []),
      prisma.campaign.findMany({ where: { userId: user.id } }).catch(() => []),
      prisma.emailFlow.findMany({ where: { userId: user.id } }).catch(() => []),
      prisma.emailContact.findMany({ where: { userId: user.id } }).catch(() => []),
      prisma.lead.findMany({ where: { userId: user.id } }).catch(() => []),
      prisma.site.findMany({ where: { userId: user.id }, select: { id: true } }).then(async (ss) => {
        return ss.length > 0 ? prisma.siteOrder.findMany({ where: { siteId: { in: ss.map(s => s.id) } } }) : [];
      }).catch(() => []),
      prisma.site.findMany({ where: { userId: user.id }, select: { id: true } }).then(async (ss) => {
        return ss.length > 0 ? prisma.siteProduct.findMany({ where: { siteId: { in: ss.map(s => s.id) } } }) : [];
      }).catch(() => []),
      prisma.creditLog.findMany({ where: { userId: user.id } }).catch(() => []),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        credits: user.credits,
        createdAt: user.createdAt,
      },
      businessProfile: profile,
      sites: sites.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        published: s.published,
        totalViews: s.totalViews,
        pages: s.pages.map(p => ({ title: p.title, slug: p.slug, views: p.views })),
      })),
      campaigns: campaigns.map(c => ({ id: c.id, name: c.name, status: c.status })),
      emailFlows: emailFlows.map(f => ({ id: f.id, name: f.name, trigger: f.trigger, status: f.status, enrolled: f.enrolled, sent: f.sent })),
      emailContacts: emailContacts.map(c => ({ email: c.email, firstName: c.firstName, tags: c.tags, status: c.status, source: c.source })),
      leads: leads.map(l => ({ name: l.name, email: l.email, status: l.status, score: l.score })),
      orders: orders.map(o => ({ customerEmail: o.customerEmail, amountCents: o.amountCents, status: o.status, createdAt: o.createdAt })),
      products: products.map(p => ({ name: p.name, price: p.price, status: p.status })),
      creditLogs: creditLogs.map(c => ({ amount: c.amount, action: c.action, detail: c.detail, createdAt: c.createdAt })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="himalaya-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err) {
    console.error("Data export error:", err);
    return NextResponse.json({ ok: false, error: "Export failed" }, { status: 500 });
  }
}
