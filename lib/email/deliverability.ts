import { prisma } from "@/lib/prisma";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

// ---------------------------------------------------------------------------
// 1. Domain Health Check
// ---------------------------------------------------------------------------

interface DomainHealth {
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  issues: string[];
  score: number;
}

export async function checkDomainHealth(domain: string): Promise<DomainHealth> {
  const issues: string[] = [];
  let spf = false;
  let dkim = false;
  let dmarc = false;

  // SPF check
  try {
    const records = await resolveTxt(domain);
    const flat = records.map((r) => r.join(""));
    spf = flat.some((r) => r.startsWith("v=spf1"));
    if (!spf) issues.push("No SPF record found. Add a TXT record with v=spf1 to authorize your sending IPs.");
  } catch {
    issues.push("Could not resolve SPF records for this domain. Ensure DNS is properly configured.");
  }

  // DKIM check — look for common selectors
  const dkimSelectors = ["resend._domainkey", "google._domainkey", "default._domainkey", "s1._domainkey", "mail._domainkey"];
  for (const selector of dkimSelectors) {
    try {
      const records = await resolveTxt(`${selector}.${domain}`);
      const flat = records.map((r) => r.join(""));
      if (flat.some((r) => r.includes("v=DKIM1") || r.includes("k=rsa"))) {
        dkim = true;
        break;
      }
    } catch {
      // selector not found, try next
    }
    if (!dkim) {
      try {
        await resolveCname(`${selector}.${domain}`);
        dkim = true;
        break;
      } catch {
        // selector not found, try next
      }
    }
  }
  if (!dkim) issues.push("No DKIM record found. Add a DKIM key for your email provider to authenticate messages.");

  // DMARC check
  try {
    const records = await resolveTxt(`_dmarc.${domain}`);
    const flat = records.map((r) => r.join(""));
    dmarc = flat.some((r) => r.startsWith("v=DMARC1"));
    if (!dmarc) issues.push("No DMARC record found. Add a _dmarc TXT record to define your email authentication policy.");
    else {
      const dmarcRecord = flat.find((r) => r.startsWith("v=DMARC1")) ?? "";
      if (dmarcRecord.includes("p=none")) {
        issues.push("DMARC policy is set to 'none' — consider upgrading to 'quarantine' or 'reject' for stronger protection.");
      }
    }
  } catch {
    issues.push("Could not resolve DMARC records. Add a _dmarc TXT record for your domain.");
  }

  // Score: 0-100
  let score = 0;
  if (spf) score += 35;
  if (dkim) score += 35;
  if (dmarc) score += 30;
  // Deduct for issues beyond missing records
  if (issues.some((i) => i.includes("p=none"))) score -= 10;

  return { spf, dkim, dmarc, issues, score: Math.max(0, Math.min(100, score)) };
}

export function getDomainSetupInstructions(
  domain: string,
  provider: "resend" | "gmail" | "smtp"
): { steps: string[]; records: { type: string; name: string; value: string }[] } {
  const records: { type: string; name: string; value: string }[] = [];
  const steps: string[] = [];

  if (provider === "resend") {
    steps.push(
      `1. Go to resend.com/domains and add "${domain}".`,
      "2. Resend will give you DNS records to add. Copy them exactly.",
      "3. Add the following records to your DNS provider:",
      "4. Wait for DNS propagation (can take up to 48 hours).",
      "5. Click 'Verify' in Resend dashboard once records are added.",
      "6. Set your from address to noreply@" + domain + " or any address on the domain."
    );
    records.push(
      { type: "TXT", name: domain, value: "v=spf1 include:amazonses.com ~all" },
      { type: "CNAME", name: `resend._domainkey.${domain}`, value: "resend._domainkey.YOUR_VALUE.resend.dev" },
      { type: "TXT", name: `_dmarc.${domain}`, value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@" + domain }
    );
  } else if (provider === "gmail") {
    steps.push(
      "1. Go to Google Admin Console → Apps → Google Workspace → Gmail → Authenticate email.",
      "2. Generate a DKIM key and copy the TXT record value.",
      "3. Add the following records to your DNS provider:",
      "4. Return to Google Admin and click 'Start authentication'.",
      "5. SPF: ensure your existing SPF record includes 'include:_spf.google.com'.",
      "6. Set up DMARC to monitor and eventually enforce authentication."
    );
    records.push(
      { type: "TXT", name: domain, value: "v=spf1 include:_spf.google.com ~all" },
      { type: "TXT", name: `google._domainkey.${domain}`, value: "v=DKIM1; k=rsa; p=YOUR_DKIM_KEY_FROM_GOOGLE_ADMIN" },
      { type: "TXT", name: `_dmarc.${domain}`, value: "v=DMARC1; p=none; rua=mailto:dmarc@" + domain }
    );
  } else {
    steps.push(
      "1. Get your SMTP server's IP address or hostname.",
      "2. Add an SPF record authorizing your SMTP server's IP.",
      "3. Generate a DKIM key pair. Add the public key as a DNS TXT record.",
      "4. Configure your SMTP server to sign outgoing mail with the private key.",
      "5. Add a DMARC record to set your authentication policy.",
      "6. Test by sending an email to mail-tester.com and checking your score."
    );
    records.push(
      { type: "TXT", name: domain, value: "v=spf1 ip4:YOUR_SERVER_IP ~all" },
      { type: "TXT", name: `default._domainkey.${domain}`, value: "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY" },
      { type: "TXT", name: `_dmarc.${domain}`, value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@" + domain }
    );
  }

  return { steps, records };
}

// ---------------------------------------------------------------------------
// 2. Bounce Management
// ---------------------------------------------------------------------------

export async function processBounce(
  email: string,
  type: "hard" | "soft",
  reason: string
): Promise<{ action: string }> {
  const contact = await prisma.emailContact.findFirst({
    where: { email: email.toLowerCase() },
  });

  if (!contact) return { action: "contact_not_found" };

  const properties = (contact.properties as Record<string, unknown>) ?? {};

  if (type === "hard") {
    await prisma.emailContact.update({
      where: { id: contact.id },
      data: {
        status: "unsubscribed",
        tags: { push: "bounced" },
        properties: {
          ...properties,
          bounceType: "hard",
          bounceReason: reason,
          bouncedAt: new Date().toISOString(),
        },
      },
    });
    return { action: "hard_bounce_unsubscribed" };
  }

  // Soft bounce: increment counter
  const softBounceCount = ((properties.softBounceCount as number) ?? 0) + 1;
  const updatedProperties = {
    ...properties,
    softBounceCount,
    lastSoftBounceReason: reason,
    lastSoftBounceAt: new Date().toISOString(),
  };

  if (softBounceCount >= 3) {
    await prisma.emailContact.update({
      where: { id: contact.id },
      data: {
        status: "unsubscribed",
        tags: { push: "bounced" },
        properties: {
          ...updatedProperties,
          bounceType: "soft_exceeded",
        },
      },
    });
    return { action: "soft_bounce_limit_exceeded_unsubscribed" };
  }

  await prisma.emailContact.update({
    where: { id: contact.id },
    data: { properties: updatedProperties },
  });

  return { action: `soft_bounce_recorded_${softBounceCount}_of_3` };
}

export async function getBounceRate(userId: string): Promise<{
  totalSent: number;
  totalBounced: number;
  bounceRate: number;
  hardBounces: number;
  softBounces: number;
}> {
  const broadcasts = await prisma.emailBroadcast.findMany({
    where: { userId },
    select: { recipients: true, bounces: true },
  });

  const totalSent = broadcasts.reduce((sum, b) => sum + (b.recipients ?? 0), 0);
  const totalBounced = broadcasts.reduce((sum, b) => sum + (b.bounces ?? 0), 0);

  const bouncedContacts = await prisma.emailContact.findMany({
    where: { userId, tags: { has: "bounced" } },
    select: { properties: true },
  });

  let hardBounces = 0;
  let softBounces = 0;
  for (const c of bouncedContacts) {
    const props = c.properties as Record<string, unknown> | null;
    if (props?.bounceType === "hard") hardBounces++;
    else softBounces++;
  }

  return {
    totalSent,
    totalBounced,
    bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
    hardBounces,
    softBounces,
  };
}

export async function cleanBounced(userId: string): Promise<{ cleaned: number }> {
  const result = await prisma.emailContact.updateMany({
    where: {
      userId,
      tags: { has: "bounced" },
      status: { not: "unsubscribed" },
    },
    data: { status: "unsubscribed" },
  });

  return { cleaned: result.count };
}

// ---------------------------------------------------------------------------
// 3. Spam Score Checker
// ---------------------------------------------------------------------------

const SPAM_WORDS = [
  "free", "click here", "act now", "limited time", "buy now", "order now",
  "no obligation", "winner", "congratulations", "urgent", "100% free",
  "risk free", "no cost", "guarantee", "earn money", "make money",
  "cash bonus", "double your", "incredible deal", "lowest price",
  "million dollars", "no catch", "no fees", "no strings attached",
  "offer expires", "once in a lifetime", "special promotion", "while supplies last",
  "you have been selected", "apply now", "call now", "claim now",
];

interface SpamCheckResult {
  score: number;
  issues: string[];
  suggestions: string[];
}

export function checkSpamScore(subject: string, body: string): SpamCheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0; // 0 = clean, 100 = definite spam

  const fullText = `${subject} ${body}`.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // ALL CAPS check
  const capsRatio = (subject.replace(/[^A-Z]/g, "").length) / Math.max(subject.replace(/\s/g, "").length, 1);
  if (capsRatio > 0.5 && subject.length > 3) {
    score += 15;
    issues.push("Subject line has excessive capital letters.");
    suggestions.push("Use normal capitalization in your subject line. ALL CAPS triggers spam filters.");
  }

  const bodyCapsRatio = (body.replace(/[^A-Z]/g, "").length) / Math.max(body.replace(/[^a-zA-Z]/g, "").length, 1);
  if (bodyCapsRatio > 0.3 && body.length > 20) {
    score += 10;
    issues.push("Email body has excessive capital letters.");
    suggestions.push("Reduce uppercase text in your email body.");
  }

  // Excessive punctuation
  const exclamationCount = (fullText.match(/!/g) ?? []).length;
  if (exclamationCount > 3) {
    score += 10;
    issues.push(`Found ${exclamationCount} exclamation marks — too many.`);
    suggestions.push("Limit exclamation marks to 1-2 per email.");
  }

  const questionCount = (subject.match(/\?/g) ?? []).length;
  if (questionCount > 2) {
    score += 5;
    issues.push("Subject has multiple question marks.");
    suggestions.push("Use at most one question mark in the subject.");
  }

  const repeatedPunctuation = (fullText.match(/[!?]{2,}/g) ?? []).length;
  if (repeatedPunctuation > 0) {
    score += 10;
    issues.push("Repeated punctuation detected (e.g., '!!!' or '???').");
    suggestions.push("Avoid repeated punctuation marks.");
  }

  // Spam words
  const foundSpamWords: string[] = [];
  for (const word of SPAM_WORDS) {
    if (fullText.includes(word)) {
      foundSpamWords.push(word);
    }
  }
  if (foundSpamWords.length > 0) {
    score += Math.min(foundSpamWords.length * 5, 30);
    issues.push(`Spam trigger words found: ${foundSpamWords.join(", ")}`);
    suggestions.push("Replace or remove spam trigger words. Use more natural language instead.");
  }

  // Spam words in subject are worse
  const subjectSpamWords = SPAM_WORDS.filter((w) => subjectLower.includes(w));
  if (subjectSpamWords.length > 0) {
    score += subjectSpamWords.length * 5;
    issues.push(`Subject contains spam trigger words: ${subjectSpamWords.join(", ")}`);
    suggestions.push("Avoid spam trigger words in the subject line especially.");
  }

  // Image-to-text ratio (check for <img> tags vs text)
  const imgCount = (body.match(/<img[\s>]/gi) ?? []).length;
  const textLength = body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length;
  if (imgCount > 0 && textLength < 100) {
    score += 15;
    issues.push("Email is image-heavy with very little text.");
    suggestions.push("Add more text content. Emails that are mostly images are flagged as spam.");
  } else if (imgCount > 3 && textLength < imgCount * 50) {
    score += 10;
    issues.push("High image-to-text ratio detected.");
    suggestions.push("Balance images with text content. Aim for at least 60% text.");
  }

  // Missing unsubscribe link
  const hasUnsubscribe =
    body.toLowerCase().includes("unsubscribe") ||
    body.includes("{{unsubscribe_url}}") ||
    body.includes("{unsubscribe}");
  if (!hasUnsubscribe) {
    score += 15;
    issues.push("No unsubscribe link detected.");
    suggestions.push("Always include an unsubscribe link. It's required by CAN-SPAM and improves deliverability.");
  }

  // Subject length
  if (subject.length > 70) {
    score += 5;
    issues.push("Subject line is too long — may be truncated in inbox.");
    suggestions.push("Keep subject lines under 60 characters for best display.");
  }
  if (subject.length === 0) {
    score += 10;
    issues.push("Empty subject line.");
    suggestions.push("Always include a clear subject line.");
  }

  // Dollar signs and percentages
  const moneyMatches = (fullText.match(/\$\d|%\s*off|\d+%/gi) ?? []).length;
  if (moneyMatches > 2) {
    score += 5;
    issues.push("Multiple monetary references or discount percentages.");
    suggestions.push("Reduce the number of dollar amounts and discount percentages.");
  }

  // Clean result
  if (issues.length === 0) {
    suggestions.push("Your email looks clean. No obvious spam triggers detected.");
  }

  return {
    score: Math.min(100, score),
    issues,
    suggestions,
  };
}

// ---------------------------------------------------------------------------
// 4. List Health
// ---------------------------------------------------------------------------

interface ListHealth {
  totalContacts: number;
  activeContacts: number;
  activeRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  engagementRate: number;
  healthScore: number;
  recommendations: string[];
}

export async function getListHealth(userId: string): Promise<ListHealth> {
  const [allContacts, broadcasts] = await Promise.all([
    prisma.emailContact.findMany({
      where: { userId },
      select: { status: true, tags: true, properties: true },
    }),
    prisma.emailBroadcast.findMany({
      where: { userId },
      select: { recipients: true, opens: true, clicks: true, bounces: true, unsubscribes: true },
    }),
  ]);

  const totalContacts = allContacts.length;
  const activeContacts = allContacts.filter((c) => c.status === "active" || c.status === "subscribed").length;
  const bouncedContacts = allContacts.filter((c) => c.tags.includes("bounced")).length;
  const unsubscribedContacts = allContacts.filter((c) => c.status === "unsubscribed").length;

  const totalSent = broadcasts.reduce((s, b) => s + (b.recipients ?? 0), 0);
  const totalOpens = broadcasts.reduce((s, b) => s + (b.opens ?? 0), 0);
  const totalClicks = broadcasts.reduce((s, b) => s + (b.clicks ?? 0), 0);
  const totalBounces = broadcasts.reduce((s, b) => s + (b.bounces ?? 0), 0);

  const activeRate = totalContacts > 0 ? (activeContacts / totalContacts) * 100 : 0;
  const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;
  const unsubscribeRate = totalContacts > 0 ? (unsubscribedContacts / totalContacts) * 100 : 0;
  const engagementRate = totalSent > 0 ? ((totalOpens + totalClicks) / (totalSent * 2)) * 100 : 0;

  // Health score: weighted combination
  let healthScore = 100;
  if (bounceRate > 5) healthScore -= 30;
  else if (bounceRate > 2) healthScore -= 15;
  else if (bounceRate > 1) healthScore -= 5;

  if (unsubscribeRate > 5) healthScore -= 20;
  else if (unsubscribeRate > 2) healthScore -= 10;

  if (activeRate < 50) healthScore -= 20;
  else if (activeRate < 70) healthScore -= 10;

  if (engagementRate < 10) healthScore -= 15;
  else if (engagementRate < 20) healthScore -= 5;

  healthScore = Math.max(0, Math.min(100, healthScore));

  // Recommendations
  const recommendations: string[] = [];
  if (bounceRate > 2) recommendations.push("Bounce rate is high. Run a list cleanup to remove invalid addresses.");
  if (unsubscribeRate > 2) recommendations.push("Unsubscribe rate is elevated. Review email frequency and content relevance.");
  if (activeRate < 70) recommendations.push("Many inactive contacts. Consider a re-engagement campaign or list cleanup.");
  if (engagementRate < 15) recommendations.push("Low engagement. Test different subject lines, send times, and content formats.");
  if (bouncedContacts > 0) recommendations.push(`${bouncedContacts} bounced contacts still in your list. Run cleanBounced() to tag them.`);
  if (totalContacts === 0) recommendations.push("Your list is empty. Add sign-up forms to start collecting contacts.");
  if (recommendations.length === 0) recommendations.push("Your list is healthy. Keep it up!");

  return {
    totalContacts,
    activeContacts,
    activeRate: Math.round(activeRate * 100) / 100,
    bounceRate: Math.round(bounceRate * 100) / 100,
    unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
    engagementRate: Math.round(engagementRate * 100) / 100,
    healthScore,
    recommendations,
  };
}

export async function getInactiveContacts(
  userId: string,
  daysInactive: number = 90
): Promise<{ email: string; lastActivity: string | null; daysSinceActivity: number }[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysInactive);

  const contacts = await prisma.emailContact.findMany({
    where: { userId, status: { in: ["active", "subscribed"] } },
    select: { email: true, properties: true },
  });

  const inactive: { email: string; lastActivity: string | null; daysSinceActivity: number }[] = [];

  for (const contact of contacts) {
    const props = contact.properties as Record<string, unknown> | null;
    const lastActivity = props?.lastActivityAt as string | undefined;

    if (!lastActivity) {
      inactive.push({ email: contact.email, lastActivity: null, daysSinceActivity: daysInactive });
      continue;
    }

    const lastDate = new Date(lastActivity);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= daysInactive) {
      inactive.push({ email: contact.email, lastActivity, daysSinceActivity: daysSince });
    }
  }

  return inactive.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
}

export async function suggestListCleanup(userId: string): Promise<{
  bouncedToRemove: number;
  inactiveToRemove: number;
  unsubscribedToRemove: number;
  totalSuggested: number;
  estimatedHealthImprovement: number;
  actions: string[];
}> {
  const [health, inactive] = await Promise.all([
    getListHealth(userId),
    getInactiveContacts(userId, 90),
  ]);

  const bouncedContacts = await prisma.emailContact.count({
    where: { userId, tags: { has: "bounced" } },
  });

  const unsubscribedContacts = await prisma.emailContact.count({
    where: { userId, status: "unsubscribed" },
  });

  const totalSuggested = bouncedContacts + inactive.length + unsubscribedContacts;
  const currentTotal = health.totalContacts;
  const afterCleanup = currentTotal - totalSuggested;
  const estimatedHealthImprovement = currentTotal > 0
    ? Math.min(30, Math.round((totalSuggested / currentTotal) * 50))
    : 0;

  const actions: string[] = [];
  if (bouncedContacts > 0) actions.push(`Remove ${bouncedContacts} bounced contacts (hard and soft bounces).`);
  if (inactive.length > 0) actions.push(`Remove or re-engage ${inactive.length} contacts inactive for 90+ days.`);
  if (unsubscribedContacts > 0) actions.push(`Archive ${unsubscribedContacts} unsubscribed contacts.`);
  if (totalSuggested === 0) actions.push("Your list is already clean. No action needed.");
  else actions.push(`After cleanup: ~${afterCleanup} contacts, estimated health score improvement: +${estimatedHealthImprovement} pts.`);

  return {
    bouncedToRemove: bouncedContacts,
    inactiveToRemove: inactive.length,
    unsubscribedToRemove: unsubscribedContacts,
    totalSuggested,
    estimatedHealthImprovement,
    actions,
  };
}

// ---------------------------------------------------------------------------
// 5. Inbox Preview
// ---------------------------------------------------------------------------

interface InboxPreview {
  mobile: { subject: string; previewText: string; fromName: string };
  desktop: { subject: string; previewText: string; fromName: string };
  darkModeWarnings: string[];
  characterCount: { subject: number; previewText: number };
  subjectEmoji: boolean;
}

export function previewEmail(
  subject: string,
  previewText: string,
  fromName: string,
  body: string
): InboxPreview {
  const darkModeWarnings: string[] = [];

  // Check for dark mode issues in body
  const bodyLower = body.toLowerCase();

  // White or very light backgrounds
  if (bodyLower.includes("background:#fff") || bodyLower.includes("background: #fff") ||
      bodyLower.includes("background-color:#fff") || bodyLower.includes("background-color: #fff") ||
      bodyLower.includes("background:white") || bodyLower.includes("background: white") ||
      bodyLower.includes("background-color:white") || bodyLower.includes("background-color: white") ||
      bodyLower.includes("bgcolor=\"#fff") || bodyLower.includes("bgcolor=\"white")) {
    darkModeWarnings.push("White background detected — in dark mode, this may create harsh contrast. Consider using a slightly off-white (#f5f5f5) or let it inherit.");
  }

  // Light text colors that vanish in dark mode
  const lightColors = ["#fff", "#ffffff", "#fafafa", "#f5f5f5", "#eee", "#eeeeee", "white"];
  for (const c of lightColors) {
    if (bodyLower.includes(`color:${c}`) || bodyLower.includes(`color: ${c}`)) {
      darkModeWarnings.push(`Light text color (${c}) detected — will be invisible in dark mode. Use darker text or media queries.`);
      break;
    }
  }

  // Inline styles with light gray text
  if (bodyLower.includes("color:#ccc") || bodyLower.includes("color:#ddd") || bodyLower.includes("color: #ccc")) {
    darkModeWarnings.push("Very light gray text detected — may be unreadable in dark mode.");
  }

  // Truncation for mobile (35 chars subject, 90 chars preview)
  const mobileSubject = subject.length > 35 ? subject.slice(0, 33) + "..." : subject;
  const mobilePreview = previewText.length > 90 ? previewText.slice(0, 88) + "..." : previewText;

  // Desktop shows more (70 chars subject, 120 chars preview)
  const desktopSubject = subject.length > 70 ? subject.slice(0, 68) + "..." : subject;
  const desktopPreview = previewText.length > 120 ? previewText.slice(0, 118) + "..." : previewText;

  const subjectEmoji = /[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]/u.test(subject);

  return {
    mobile: { subject: mobileSubject, previewText: mobilePreview, fromName },
    desktop: { subject: desktopSubject, previewText: desktopPreview, fromName },
    darkModeWarnings,
    characterCount: { subject: subject.length, previewText: previewText.length },
    subjectEmoji,
  };
}
