// ---------------------------------------------------------------------------
// GDPR/CAN-SPAM Compliance Manager
// Handles: consent tracking, unsubscribe processing, data deletion,
// cookie consent, email footer requirements
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type ConsentRecord = {
  contactEmail: string;
  consentType: "email" | "sms" | "tracking" | "marketing";
  consented: boolean;
  source: string;
  ipAddress?: string;
  timestamp: string;
};

/** Record consent for a contact */
export async function recordConsent(input: {
  userId: string;
  contactEmail: string;
  consentType: ConsentRecord["consentType"];
  consented: boolean;
  source: string;
  ipAddress?: string;
}): Promise<void> {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "consent_recorded",
      metadata: {
        contactEmail: input.contactEmail,
        consentType: input.consentType,
        consented: input.consented,
        source: input.source,
        ipAddress: input.ipAddress ?? null,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

/** Process an unsubscribe request */
export async function processUnsubscribe(input: {
  email: string;
  userId?: string;
}): Promise<{ ok: boolean; affected: number }> {
  let affected = 0;

  // Update contact status
  const result = await prisma.emailContact.updateMany({
    where: {
      email: input.email,
      ...(input.userId ? { userId: input.userId } : {}),
    },
    data: { status: "unsubscribed" },
  });
  affected += result.count;

  // Pause all active enrollments
  const paused = await prisma.emailFlowEnrollment.updateMany({
    where: {
      contactEmail: input.email,
      status: "active",
    },
    data: { status: "paused" },
  });
  affected += paused.count;

  // Record the unsubscribe
  if (input.userId) {
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "unsubscribe_processed",
        metadata: { email: input.email, affected },
      },
    }).catch(() => {});
  }

  return { ok: true, affected };
}

/** Process a data deletion request (GDPR Article 17) */
export async function processDataDeletion(input: {
  email: string;
  userId: string;
}): Promise<{ ok: boolean; deleted: Record<string, number> }> {
  const deleted: Record<string, number> = {};

  // Delete contacts
  const contacts = await prisma.emailContact.deleteMany({
    where: { email: input.email, userId: input.userId },
  });
  deleted.contacts = contacts.count;

  // Delete enrollments
  const enrollments = await prisma.emailFlowEnrollment.deleteMany({
    where: { contactEmail: input.email, userId: input.userId },
  });
  deleted.enrollments = enrollments.count;

  // Delete leads
  const leads = await prisma.lead.deleteMany({
    where: { email: input.email, userId: input.userId },
  });
  deleted.leads = leads.count;

  // Record the deletion for audit trail
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "data_deletion_processed",
      metadata: {
        email: input.email,
        deleted,
        processedAt: new Date().toISOString(),
      },
    },
  }).catch(() => {});

  return { ok: true, deleted };
}

/** Generate compliant email footer HTML */
export function generateEmailFooter(input: {
  businessName: string;
  businessAddress?: string;
  unsubscribeUrl: string;
}): string {
  return `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">
  <p>${input.businessName}</p>
  ${input.businessAddress ? `<p>${input.businessAddress}</p>` : ""}
  <p style="margin-top:8px;">
    <a href="${input.unsubscribeUrl}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
    &nbsp;|&nbsp;
    <a href="${input.unsubscribeUrl.replace("unsubscribe", "preferences")}" style="color:#999;text-decoration:underline;">Email Preferences</a>
  </p>
  <p style="margin-top:4px;">You received this email because you subscribed or made a purchase.</p>
</div>`;
}

/** Generate cookie consent banner script */
export function generateCookieConsentScript(siteId: string): string {
  return `
<div id="cookie-consent" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:16px 24px;font-size:13px;z-index:9998;display:flex;align-items:center;justify-content:space-between;gap:16px;">
  <p style="margin:0;flex:1;">We use cookies to improve your experience and track site analytics. By continuing, you consent to our use of cookies.</p>
  <div style="display:flex;gap:8px;">
    <button onclick="document.getElementById('cookie-consent').style.display='none';localStorage.setItem('cookie_consent_${siteId}','accepted')" style="background:#f5a623;color:#0c0a08;border:none;padding:8px 20px;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer;">Accept</button>
    <button onclick="document.getElementById('cookie-consent').style.display='none';localStorage.setItem('cookie_consent_${siteId}','declined')" style="background:transparent;color:#999;border:1px solid #333;padding:8px 20px;border-radius:8px;font-size:12px;cursor:pointer;">Decline</button>
  </div>
</div>
<script>
if(!localStorage.getItem('cookie_consent_${siteId}')){
  document.getElementById('cookie-consent').style.display='flex';
}
</script>`;
}
