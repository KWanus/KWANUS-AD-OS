import { Resend } from "resend";
import { generateUnsubscribeToken } from "@/app/api/email-contacts/unsubscribe/route";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  /** User's own Resend API key (overrides platform key) */
  apiKey?: string;
  /** Contact ID for unsubscribe link generation */
  contactId?: string;
}

function markdownToHtml(md: string): string {
  return md
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/→\s*(.*)/g, '<a href="#">$1</a>')
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

function wrapHtml(body: string, fromName?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; }
  .content { padding: 40px; color: #1a1a1a; font-size: 15px; line-height: 1.7; }
  p { margin: 0 0 16px; }
  a { color: #06b6d4; text-decoration: none; font-weight: 600; }
  .footer { padding: 20px 40px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #999; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="content">${body}</div>
  <div class="footer">
    Sent by ${fromName ?? "KWANUS"} via KWANUS AD OS &middot;
    <a href="{{unsubscribe_url}}" style="color:#999">Unsubscribe</a>
  </div>
</div>
</body>
</html>`;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = opts.apiKey ?? process.env.RESEND_API_KEY;

  if (!key || key === "re_REPLACE_ME") {
    console.warn("[sendEmail] No Resend API key configured — email not sent");
    return { ok: false, error: "No email API key configured. Add your Resend API key in Settings → Email Delivery." };
  }

  const resend = new Resend(key);

  const fromEmail = opts.fromEmail ?? "onboarding@resend.dev";
  const fromName = opts.fromName ?? "KWANUS AD OS";
  const from = `${fromName} <${fromEmail}>`;

  let htmlBody = opts.html.includes("<html") ? opts.html : wrapHtml(opts.html, fromName);

  // Replace unsubscribe placeholder with actual link
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
  if (recipients.length === 1 && opts.contactId) {
    const email = recipients[0];
    const token = generateUnsubscribeToken(email, opts.contactId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const unsubUrl = `${baseUrl}/api/email-contacts/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
    htmlBody = htmlBody.replace(/\{\{unsubscribe_url\}\}/g, unsubUrl);
  }

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: htmlBody,
      text: opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export { markdownToHtml, wrapHtml };
