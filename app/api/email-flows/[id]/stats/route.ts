import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/email-flows/[id]/stats
 * Returns performance stats for an email flow.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const flow = await prisma.emailFlow.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        enrolled: true,
        sent: true,
        opens: true,
        clicks: true,
        conversions: true,
        revenue: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!flow) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const [failedEnrollmentCount, latestFailedEnrollment, recentEnrollments] = await Promise.all([
      prisma.emailFlowEnrollment.count({
        where: { flowId: id, userId: user.id, status: "failed" },
      }),
      prisma.emailFlowEnrollment.findFirst({
        where: { flowId: id, userId: user.id, status: "failed" },
        orderBy: { updatedAt: "desc" },
        select: {
          contactEmail: true,
          updatedAt: true,
          errors: true,
        },
      }),
      prisma.emailFlowEnrollment.findMany({
        where: { flowId: id, userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          contactEmail: true,
          status: true,
          currentNodeId: true,
          resumeAfter: true,
          updatedAt: true,
          errors: true,
          emailsSent: true,
        },
      }),
    ]);

    const openRate = flow.sent > 0 ? Math.round((flow.opens / flow.sent) * 1000) / 10 : 0;
    const clickRate = flow.opens > 0 ? Math.round((flow.clicks / flow.opens) * 1000) / 10 : 0;
    const conversionRate = flow.clicks > 0 ? Math.round((flow.conversions / flow.clicks) * 1000) / 10 : 0;
    const revenuePerEnrolled = flow.enrolled > 0 ? Math.round((flow.revenue / flow.enrolled) * 100) / 100 : 0;
    const latestErrors = Array.isArray(latestFailedEnrollment?.errors)
      ? latestFailedEnrollment.errors
      : [];
    const latestFailureMessage =
      typeof latestErrors[latestErrors.length - 1] === "string"
        ? (latestErrors[latestErrors.length - 1] as string)
        : null;

    return NextResponse.json({
      ok: true,
      stats: {
        enrolled: flow.enrolled,
        sent: flow.sent,
        opens: flow.opens,
        clicks: flow.clicks,
        conversions: flow.conversions,
        revenue: flow.revenue,
        openRate,
        clickRate,
        conversionRate,
        revenuePerEnrolled,
        failedEnrollmentCount,
        latestFailure: latestFailedEnrollment
          ? {
              contactEmail: latestFailedEnrollment.contactEmail,
              updatedAt: latestFailedEnrollment.updatedAt.toISOString(),
              message: latestFailureMessage,
            }
          : null,
        recentEnrollments: recentEnrollments.map((enrollment) => {
          const enrollmentErrors = Array.isArray(enrollment.errors)
            ? enrollment.errors
            : [];
          const latestEnrollmentError =
            typeof enrollmentErrors[enrollmentErrors.length - 1] === "string"
              ? (enrollmentErrors[enrollmentErrors.length - 1] as string)
              : null;

          return {
            id: enrollment.id,
            contactEmail: enrollment.contactEmail,
            status: enrollment.status,
            currentNodeId: enrollment.currentNodeId,
            resumeAfter: enrollment.resumeAfter?.toISOString() ?? null,
            updatedAt: enrollment.updatedAt.toISOString(),
            emailsSent: enrollment.emailsSent,
            latestError: latestEnrollmentError,
          };
        }),
        status: flow.status,
        daysSinceCreation: Math.round((Date.now() - new Date(flow.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (err) {
    console.error("Flow stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
