import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.type;

    if (eventType === "user.created") {
      const userData = body.data;
      const email = userData.email_addresses?.[0]?.email_address;
      const firstName = userData.first_name ?? userData.username ?? "there";

      if (!email) return NextResponse.json({ ok: true });

      // Send welcome email
      try {
        const { sendEmailUnified, getFromAddressUnified } = await import("@/lib/integrations/emailSender");
        const fromAddress = await getFromAddressUnified();

        await sendEmailUnified({
          from: fromAddress,
          to: email,
          subject: `Welcome to Himalaya, ${firstName}!`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #f5a623, #e07850); display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px; color: white;">⛰</span>
                </div>
              </div>
              <h1 style="font-size: 24px; font-weight: 900; color: #1a1a1a; margin: 0 0 12px;">Welcome to Himalaya!</h1>
              <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 20px;">
                Hey ${firstName},<br><br>
                You just joined the platform that builds entire businesses in 60 seconds. Here's how to get started:
              </p>
              <div style="background: #fdf8f0; border: 1px solid #f5a623; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
                <p style="font-size: 14px; color: #333; margin: 0 0 8px;"><strong>Step 1:</strong> Tell us your goal (coaching, dropshipping, agency, etc.)</p>
                <p style="font-size: 14px; color: #333; margin: 0 0 8px;"><strong>Step 2:</strong> We build your site, ads, emails, and scripts</p>
                <p style="font-size: 14px; color: #333; margin: 0;"><strong>Step 3:</strong> You approve and launch</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.app"}/setup"
                style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f5a623, #e07850); color: #0c0a08; text-decoration: none; font-weight: 800; font-size: 15px; border-radius: 12px;">
                Build My First Business →
              </a>
              <p style="font-size: 13px; color: #999; margin: 20px 0 0; line-height: 1.5;">
                Reply to this email if you need help. We answer every one.<br><br>
                — The Himalaya Team
              </p>
            </div>
          `,
        });
      } catch {
        // Email sending is non-blocking
      }

      // Create a notification for the user
      try {
        const user = await prisma.user.findFirst({ where: { email } });
        if (user) {
          const { createNotification } = await import("@/lib/notifications/notify");
          await createNotification({
            userId: user.id,
            type: "new_lead",
            title: "Welcome to Himalaya!",
            body: "Build your first business — it takes 60 seconds",
            href: "/setup",
          });
        }
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return NextResponse.json({ ok: true }); // Always 200 so Clerk doesn't retry
  }
}
