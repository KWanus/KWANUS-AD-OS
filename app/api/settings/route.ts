import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/db/runtime";
import { getEmailDeliveryAlertSummary } from "@/lib/email/deliveryAlerts";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const emailDeliveryAlert = await getEmailDeliveryAlertSummary(user.id);

    return NextResponse.json({
      ok: true,
      settings: {
        workspaceName: user.workspaceName,
        sendingFromName: user.sendingFromName,
        sendingFromEmail: user.sendingFromEmail,
        sendingDomain: user.sendingDomain,
        hasResendKey: !!(user.resendApiKey),
        plan: user.plan,
        email: user.email,
        name: user.name,
        // Ad & Analytics
        metaPixelId: user.metaPixelId,
        googleAnalyticsId: user.googleAnalyticsId,
        tiktokPixelId: user.tiktokPixelId,
        googleAdsId: user.googleAdsId,
        // Automation
        webhookUrl: user.webhookUrl,
        businessUrl: user.businessUrl,
        businessType: user.businessType,
        onboardingCompleted: user.onboardingCompleted,
      },
      emailDeliveryAlert,
    });
  } catch (err) {
    console.error("Settings GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({
        ok: true,
        settings: {
          workspaceName: null,
          sendingFromName: null,
          sendingFromEmail: null,
          sendingDomain: null,
          hasResendKey: false,
          plan: "free",
          email: null,
          name: null,
          metaPixelId: null,
          googleAnalyticsId: null,
          tiktokPixelId: null,
          googleAdsId: null,
          webhookUrl: null,
          businessUrl: null,
          businessType: null,
          onboardingCompleted: true,
          databaseUnavailable: true,
        },
        emailDeliveryAlert: {
          failedEnrollments: 0,
          latestError: null,
          latestFailedAt: null,
        },
      });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      workspaceName?: string;
      sendingFromName?: string;
      sendingFromEmail?: string;
      sendingDomain?: string;
      resendApiKey?: string;
      metaPixelId?: string;
      googleAnalyticsId?: string;
      tiktokPixelId?: string;
      googleAdsId?: string;
      webhookUrl?: string;
      businessUrl?: string;
      businessType?: string;
      onboardingCompleted?: boolean;
    };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.workspaceName !== undefined && { workspaceName: body.workspaceName || null }),
        ...(body.sendingFromName !== undefined && { sendingFromName: body.sendingFromName || null }),
        ...(body.sendingFromEmail !== undefined && { sendingFromEmail: body.sendingFromEmail || null }),
        ...(body.sendingDomain !== undefined && { sendingDomain: body.sendingDomain || null }),
        ...(body.resendApiKey !== undefined && { resendApiKey: body.resendApiKey || null }),
        ...(body.metaPixelId !== undefined && { metaPixelId: body.metaPixelId || null }),
        ...(body.googleAnalyticsId !== undefined && { googleAnalyticsId: body.googleAnalyticsId || null }),
        ...(body.tiktokPixelId !== undefined && { tiktokPixelId: body.tiktokPixelId || null }),
        ...(body.googleAdsId !== undefined && { googleAdsId: body.googleAdsId || null }),
        ...(body.webhookUrl !== undefined && { webhookUrl: body.webhookUrl || null }),
        ...(body.businessUrl !== undefined && { businessUrl: body.businessUrl || null }),
        ...(body.businessType !== undefined && { businessType: body.businessType || null }),
        ...(body.onboardingCompleted !== undefined && { onboardingCompleted: body.onboardingCompleted }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
