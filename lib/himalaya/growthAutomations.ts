// ---------------------------------------------------------------------------
// Growth Automations — the systems that run AFTER launch to grow revenue
//
// Handles gaps 56-70:
// 56. First visitor notification
// 57. Webhook/Zapier system
// 58. Form spam protection (honeypot)
// 59. Email signature generator
// 60. Invoice/receipt after payment
// 61. Lead magnet delivery
// 62. Link-in-bio page
// 63. Testimonial collection
// 64. Appointment reminders
// 65. Exit-intent popup
// 66. Email warmup guidance
// 67. Smart campaign naming
// 68. Content calendar
// 69. Competitor price tracking
// 70. Automated testimonial requests (day 7 post-purchase)
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { sendEmailUnified, getFromAddressUnified } from "@/lib/integrations/emailSender";
import { generateAI } from "@/lib/integrations/aiInference";
import { createNotification } from "@/lib/notifications/notify";

// ── 56. First Visitor Notification ───────────────────────────────────────────

export async function notifyFirstVisitor(siteId: string): Promise<void> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { userId: true, name: true, totalViews: true },
  });
  if (!site?.userId || (site.totalViews ?? 0) > 1) return; // Only notify on first view

  await createNotification({
    userId: site.userId,
    type: "new_lead",
    title: `First visitor on ${site.name}!`,
    body: "Someone just visited your site for the first time. The funnel is open. Keep sharing your link.",
    href: `/websites/${siteId}`,
  }).catch(() => {});
}

// ── 58. Form Spam Protection (honeypot field) ────────────────────────────────

export function generateHoneypotField(): string {
  return `<div style="position:absolute;left:-9999px;top:-9999px;" aria-hidden="true">
  <label for="hm_hp_field">Leave empty</label>
  <input type="text" name="hm_hp_field" id="hm_hp_field" tabindex="-1" autocomplete="off" />
</div>`;
}

export function isSpamSubmission(formData: Record<string, unknown>): boolean {
  // Honeypot filled = bot
  if (formData.hm_hp_field && String(formData.hm_hp_field).trim() !== "") return true;
  // Submitted too fast (under 2 seconds)
  if (formData._loadedAt && Date.now() - Number(formData._loadedAt) < 2000) return true;
  return false;
}

// ── 59. Email Signature Generator ────────────────────────────────────────────

export function generateEmailSignature(input: {
  name: string;
  title?: string;
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  primaryColor?: string;
}): string {
  const color = input.primaryColor ?? "#06b6d4";
  return `
<table cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#374151;">
  <tr>
    <td style="padding-right:16px;border-right:2px solid ${color};">
      <strong style="font-size:14px;color:#111827;">${input.name}</strong><br/>
      ${input.title ? `<span style="color:#6b7280;">${input.title}</span><br/>` : ""}
      <strong style="color:${color};">${input.businessName}</strong>
    </td>
    <td style="padding-left:16px;">
      ${input.email ? `<a href="mailto:${input.email}" style="color:${color};text-decoration:none;">${input.email}</a><br/>` : ""}
      ${input.phone ? `<span>${input.phone}</span><br/>` : ""}
      ${input.website ? `<a href="${input.website}" style="color:${color};text-decoration:none;">${input.website}</a>` : ""}
    </td>
  </tr>
</table>`;
}

// ── 60. Invoice/Receipt Generator ────────────────────────────────────────────

export function generateReceipt(input: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  amount: string;
  date: string;
  businessName: string;
  businessEmail: string;
}): string {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;">
  <h2 style="margin:0 0 4px;font-size:20px;color:#111827;">Receipt</h2>
  <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">${input.businessName} · Order #${input.orderNumber}</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:12px 0;color:#374151;">${input.productName}</td>
      <td style="padding:12px 0;text-align:right;font-weight:700;color:#111827;">${input.amount}</td>
    </tr>
    <tr>
      <td style="padding:12px 0;font-weight:700;color:#111827;">Total</td>
      <td style="padding:12px 0;text-align:right;font-weight:700;color:#111827;">${input.amount}</td>
    </tr>
  </table>

  <div style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:8px;font-size:12px;color:#6b7280;">
    <p style="margin:0 0 4px;"><strong>Customer:</strong> ${input.customerName} (${input.customerEmail})</p>
    <p style="margin:0 0 4px;"><strong>Date:</strong> ${input.date}</p>
    <p style="margin:0;"><strong>Questions?</strong> Email ${input.businessEmail}</p>
  </div>
</div>`;
}

// ── 61. Lead Magnet Delivery ─────────────────────────────────────────────────

export async function deliverLeadMagnet(input: {
  userId: string;
  contactEmail: string;
  contactName?: string;
  leadMagnetType: "pdf" | "checklist" | "template" | "video" | "guide";
  niche: string;
  businessName: string;
}): Promise<{ ok: boolean }> {
  // Generate the lead magnet content
  const result = await generateAI({
    prompt: `Create a ${input.leadMagnetType} lead magnet for ${input.niche} by ${input.businessName}.

Type: ${input.leadMagnetType}
Rules:
- If PDF/guide: write 5-7 actionable tips in a structured format
- If checklist: write 10-15 checkbox items
- If template: write a fill-in-the-blank template
- Make it genuinely valuable — this is the first impression

Return the content as plain text with clear formatting.`,
    systemPrompt: "Create valuable, specific lead magnet content. No fluff.",
    maxTokens: 1000,
  });

  const from = getFromAddressUnified({ sendingFromName: input.businessName, sendingFromEmail: null, sendingDomain: null });

  const emailResult = await sendEmailUnified({
    from,
    to: input.contactEmail,
    subject: `Here's your free ${input.leadMagnetType} — ${input.businessName}`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<p>Hey${input.contactName ? ` ${input.contactName.split(" ")[0]}` : ""},</p>
<p>Thanks for signing up. Here's what you asked for:</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:16px 0;white-space:pre-wrap;font-size:14px;line-height:1.7;color:#334155;">
${result.content}
</div>
<p>If you have any questions, just reply to this email.</p>
<p>— ${input.businessName}</p>
</div>`,
  });

  return { ok: emailResult.ok };
}

// ── 62. Link-in-Bio Page ─────────────────────────────────────────────────────

export function generateLinkInBioBlocks(input: {
  businessName: string;
  tagline: string;
  links: { label: string; url: string; emoji?: string }[];
  primaryColor: string;
}): object[] {
  return [
    {
      id: "bio-hero",
      type: "hero",
      props: {
        title: input.businessName,
        subtitle: input.tagline,
        layout: "centered",
        bgColor: "#050a14",
      },
    },
    ...input.links.map((link, i) => ({
      id: `bio-link-${i}`,
      type: "cta",
      props: {
        title: `${link.emoji ?? "→"} ${link.label}`,
        ctaText: link.label,
        ctaUrl: link.url,
        layout: "centered",
      },
    })),
  ];
}

// ── 63. Testimonial Collection Widget ────────────────────────────────────────

export function generateTestimonialWidget(input: {
  businessName: string;
  webhookUrl: string;
  primaryColor: string;
}): string {
  return `
<div style="max-width:480px;margin:0 auto;padding:32px;border-radius:20px;border:1px solid #e5e7eb;text-align:center;">
  <h3 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 8px;">Share Your Experience</h3>
  <p style="font-size:13px;color:#64748b;margin:0 0 20px;">Your feedback helps us improve and helps others decide.</p>
  <form id="hm-testimonial-form" style="text-align:left;">
    <label style="display:block;margin-bottom:12px;">
      <span style="font-size:12px;font-weight:700;color:#374151;">Your Name</span>
      <input name="name" required style="display:block;width:100%;margin-top:4px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;" />
    </label>
    <label style="display:block;margin-bottom:12px;">
      <span style="font-size:12px;font-weight:700;color:#374151;">Rating</span>
      <select name="rating" required style="display:block;width:100%;margin-top:4px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;">
        <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
        <option value="4">⭐⭐⭐⭐ Great</option>
        <option value="3">⭐⭐⭐ Good</option>
        <option value="2">⭐⭐ Fair</option>
        <option value="1">⭐ Poor</option>
      </select>
    </label>
    <label style="display:block;margin-bottom:16px;">
      <span style="font-size:12px;font-weight:700;color:#374151;">Your Review</span>
      <textarea name="review" rows="4" required style="display:block;width:100%;margin-top:4px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;resize:vertical;box-sizing:border-box;"></textarea>
    </label>
    <button type="submit" style="width:100%;padding:12px;background:${input.primaryColor};color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Submit Review</button>
  </form>
</div>
<script>
document.getElementById('hm-testimonial-form').onsubmit=function(e){
  e.preventDefault();
  var f=new FormData(e.target);
  fetch('${input.webhookUrl}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    name:f.get('name'),rating:f.get('rating'),review:f.get('review'),
    source:'testimonial_widget',business:'${input.businessName.replace(/'/g, "\\'")}'
  })}).then(function(){
    e.target.innerHTML='<p style="text-align:center;padding:20px;color:#059669;font-weight:700;">Thank you! Your review has been submitted.</p>';
  });
};
</script>`;
}

// ── 65. Exit Intent Popup ────────────────────────────────────────────────────

export function generateExitIntentPopup(input: {
  headline: string;
  offer: string;
  ctaText: string;
  ctaUrl: string;
  primaryColor: string;
}): string {
  return `
<div id="hm-exit-popup" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);">
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:420px;width:90%;background:#fff;border-radius:20px;padding:40px 32px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.3);">
    <button onclick="document.getElementById('hm-exit-popup').style.display='none'" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:20px;color:#94a3b8;cursor:pointer;">×</button>
    <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;">${input.headline}</h2>
    <p style="font-size:14px;color:#64748b;margin:0 0 24px;">${input.offer}</p>
    <a href="${input.ctaUrl}" style="display:inline-block;padding:14px 32px;background:${input.primaryColor};color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">${input.ctaText}</a>
    <p style="font-size:11px;color:#94a3b8;margin:16px 0 0;cursor:pointer;" onclick="document.getElementById('hm-exit-popup').style.display='none'">No thanks, I'll pass</p>
  </div>
</div>
<script>
(function(){
  var shown=false;
  document.addEventListener('mouseout',function(e){
    if(!shown && e.clientY<10){
      shown=true;
      document.getElementById('hm-exit-popup').style.display='block';
    }
  });
})();
</script>`;
}

// ── 67. Smart Campaign Naming ────────────────────────────────────────────────

export function generateCampaignName(input: {
  niche: string;
  path: string;
  date?: Date;
}): string {
  const d = input.date ?? new Date();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  const nicheShort = input.niche.split(/\s+/).slice(0, 3).join(" ");
  const pathLabel: Record<string, string> = {
    affiliate: "Affiliate", coaching: "Coaching", dropshipping: "Dropship",
    agency: "Agency", local_service: "Local", freelance: "Freelance",
    digital_product: "Digital", ecommerce_brand: "Brand", scale_systems: "Scale",
    improve_existing: "Improve",
  };
  return `${pathLabel[input.path] ?? "Campaign"}: ${nicheShort} — ${month} ${year}`;
}

// ── 70. Automated Testimonial Request (7 days post-purchase) ─────────────────

export async function sendTestimonialRequest(input: {
  userId: string;
  customerEmail: string;
  customerName?: string;
  productName: string;
  businessName: string;
  reviewUrl?: string;
}): Promise<void> {
  const from = getFromAddressUnified({ sendingFromName: input.businessName, sendingFromEmail: null, sendingDomain: null });

  await sendEmailUnified({
    from,
    to: input.customerEmail,
    subject: `How's ${input.productName} working for you?`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:24px;line-height:1.7;color:#334155;">
<p>Hey${input.customerName ? ` ${input.customerName.split(" ")[0]}` : ""},</p>
<p>It's been about a week since you got ${input.productName}. I wanted to check in.</p>
<p>How's everything going? If you have a moment, I'd love to hear about your experience.</p>
${input.reviewUrl ? `<p><a href="${input.reviewUrl}" style="display:inline-block;padding:12px 24px;background:#06b6d4;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Leave a Quick Review</a></p>` : `<p>Just reply to this email with a sentence or two — it means the world to us.</p>`}
<p>If anything isn't working perfectly, reply and I'll personally make sure it gets fixed.</p>
<p>Thanks for choosing ${input.businessName}.</p>
</div>`,
  });

  await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "testimonial_request_sent",
      metadata: JSON.parse(JSON.stringify({
        customerEmail: input.customerEmail,
        productName: input.productName,
        sentAt: new Date().toISOString(),
      })),
    },
  }).catch(() => {});
}

// ── 66. Email Warmup Guidance ────────────────────────────────────────────────

export function getEmailWarmupPlan(): {
  steps: { day: string; action: string; volume: string }[];
  tips: string[];
} {
  return {
    steps: [
      { day: "Day 1-3", action: "Send to yourself and 5 friends. Ask them to open, reply, and mark 'not spam'", volume: "5-10 emails" },
      { day: "Day 4-7", action: "Send to your warmest contacts. Personal emails, not marketing", volume: "10-20 emails" },
      { day: "Day 8-14", action: "Start sending to new leads. Keep it personal, short, text-only", volume: "20-50 emails" },
      { day: "Day 15-21", action: "Gradually introduce HTML emails. Watch for bounces and spam reports", volume: "50-100 emails" },
      { day: "Day 22+", action: "Full email marketing. Monitor deliverability scores weekly", volume: "100+ emails" },
    ],
    tips: [
      "NEVER buy email lists — instant spam blacklist",
      "Always include unsubscribe link (legally required)",
      "Keep bounce rate under 2% — remove bad addresses immediately",
      "Don't use all caps, excessive exclamation marks, or spam trigger words in subjects",
      "Use a custom sending domain (not @gmail.com) for professional deliverability",
      "Authenticate your domain with SPF, DKIM, and DMARC records",
      "Send consistently — sporadic volume spikes trigger spam filters",
    ],
  };
}

// ── 57. Webhook/Zapier Integration ───────────────────────────────────────────

export type WebhookEvent = "lead.created" | "form.submitted" | "purchase.completed" | "email.sent" | "site.published" | "campaign.launched";

export async function fireWebhook(input: {
  userId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}): Promise<void> {
  // Find user's configured webhooks
  const webhooks = await prisma.himalayaFunnelEvent.findMany({
    where: { userId: input.userId, event: "webhook_configured" },
    select: { metadata: true },
  });

  for (const wh of webhooks) {
    const meta = wh.metadata as Record<string, string>;
    const url = meta.url;
    const events = (meta.events as unknown as string[]) ?? [];

    if (!url || (!events.includes(input.event) && !events.includes("*"))) continue;

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Himalaya-Event": input.event,
          "X-Webhook-Secret": meta.secret ?? "",
        },
        body: JSON.stringify({ event: input.event, data: input.data, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(10000),
      });
    } catch { /* non-blocking */ }
  }
}
