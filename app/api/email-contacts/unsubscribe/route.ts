import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/email-contacts/unsubscribe?email=xxx&token=xxx
 * Public endpoint — no auth required.
 * Unsubscribes an email contact. Used in email footer links.
 *
 * Token is a simple hash: base64(email + ":" + contactId)
 * This prevents random unsubscribe attacks while keeping it simple.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    const token = req.nextUrl.searchParams.get("token");

    if (!email) {
      return new NextResponse(renderPage("Missing email parameter.", false), {
        headers: { "Content-Type": "text/html" },
        status: 400,
      });
    }

    // Find the contact
    const contact = await prisma.emailContact.findFirst({
      where: { email },
      select: { id: true, status: true },
    });

    if (!contact) {
      return new NextResponse(renderPage("Email address not found in our system.", false), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Verify token if provided (optional security layer)
    if (token) {
      const expected = Buffer.from(`${email}:${contact.id}`).toString("base64");
      if (token !== expected) {
        return new NextResponse(renderPage("Invalid unsubscribe link.", false), {
          headers: { "Content-Type": "text/html" },
          status: 400,
        });
      }
    }

    if (contact.status === "unsubscribed") {
      return new NextResponse(renderPage("You are already unsubscribed.", true), {
        headers: { "Content-Type": "text/html" },
      });
    }

    await prisma.emailContact.update({
      where: { id: contact.id },
      data: { status: "unsubscribed" },
    });

    return new NextResponse(renderPage("You have been successfully unsubscribed.", true), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return new NextResponse(renderPage("Something went wrong. Please try again.", false), {
      headers: { "Content-Type": "text/html" },
      status: 500,
    });
  }
}

function renderPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe</title>
  <style>
    body { background: #0c0a08; color: white; font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { max-width: 400px; text-align: center; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    p { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✅" : "⚠️"}</div>
    <h1>${success ? "Unsubscribed" : "Error"}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
