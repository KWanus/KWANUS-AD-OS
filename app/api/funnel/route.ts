// ---------------------------------------------------------------------------
// GET /api/funnel — full funnel metrics (visitor → lead → customer)
// Returns conversion rates at each stage
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      totalViews,
      totalContacts,
      subscribedContacts,
      totalLeads,
      hotLeads,
      totalOrders,
      totalRevenue,
      totalEnrolled,
      totalEmailsSent,
    ] = await Promise.all([
      prisma.site.aggregate({ where: { userId: user.id }, _sum: { totalViews: true } }),
      prisma.emailContact.count({ where: { userId: user.id } }),
      prisma.emailContact.count({ where: { userId: user.id, status: "subscribed" } }),
      prisma.lead.count({ where: { userId: user.id } }),
      prisma.lead.count({ where: { userId: user.id, score: { gte: 60 } } }),
      prisma.siteOrder.count({
        where: {
          siteId: { in: (await prisma.site.findMany({ where: { userId: user.id }, select: { id: true } })).map(s => s.id) },
          status: "paid",
        },
      }),
      prisma.siteOrder.aggregate({
        where: {
          siteId: { in: (await prisma.site.findMany({ where: { userId: user.id }, select: { id: true } })).map(s => s.id) },
          status: "paid",
        },
        _sum: { amountCents: true },
      }),
      prisma.emailFlowEnrollment.count({ where: { userId: user.id } }),
      prisma.emailFlow.aggregate({ where: { userId: user.id }, _sum: { sent: true } }),
    ]);

    const views = totalViews._sum.totalViews ?? 0;
    const revenue = (totalRevenue._sum.amountCents ?? 0) / 100;
    const emailsSent = totalEmailsSent._sum.sent ?? 0;

    const funnel = {
      stages: [
        {
          label: "Site Visitors",
          value: views,
          rate: 100,
          color: "cyan",
        },
        {
          label: "Form Submissions",
          value: totalContacts,
          rate: views > 0 ? Math.round((totalContacts / views) * 100 * 10) / 10 : 0,
          color: "blue",
        },
        {
          label: "Email Enrolled",
          value: totalEnrolled,
          rate: totalContacts > 0 ? Math.round((totalEnrolled / totalContacts) * 100) : 0,
          color: "purple",
        },
        {
          label: "Hot Leads (60+)",
          value: hotLeads,
          rate: totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0,
          color: "amber",
        },
        {
          label: "Customers",
          value: totalOrders,
          rate: totalContacts > 0 ? Math.round((totalOrders / totalContacts) * 100 * 10) / 10 : 0,
          color: "emerald",
        },
      ],
      summary: {
        totalViews: views,
        totalContacts,
        subscribedContacts,
        totalLeads,
        hotLeads,
        totalOrders,
        revenue,
        totalEnrolled,
        emailsSent,
        overallConversionRate: views > 0 ? Math.round((totalOrders / views) * 100 * 100) / 100 : 0,
        leadToCustomerRate: totalContacts > 0 ? Math.round((totalOrders / totalContacts) * 100 * 10) / 10 : 0,
      },
    };

    return NextResponse.json({ ok: true, funnel });
  } catch (err) {
    console.error("Funnel error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
