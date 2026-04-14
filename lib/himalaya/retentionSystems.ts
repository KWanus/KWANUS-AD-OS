// ---------------------------------------------------------------------------
// Retention & Loyalty Systems (201-225)
//
// 201. Gamification engine (points, badges, streaks for customers)
// 202. VIP access tiers (early access, exclusive content)
// 203. Birthday/anniversary automation
// 204. Surprise & delight (random bonuses for loyal customers)
// 205. Community forum generator
// 206. User-generated content collector (customers share results)
// 207. Referral leaderboard
// 208. Milestone rewards (10th order, 1-year anniversary)
// 209. Personalized product recommendations
// 210. Re-engagement gamification ("you're 3 steps from gold!")
// 211. Customer success playbook per tier
// 212. Automated check-in cadence
// 213. Feature request voting system
// 214. Beta tester recruitment
// 215. Ambassador program
// 216. Event/webinar reminder system
// 217. Seasonal gift campaigns
// 218. Feedback-to-feature pipeline
// 219. Customer spotlight generator
// 220. Satisfaction pulse surveys
// 221. Churn prediction model
// 222. Save offers for at-risk customers
// 223. Account pause option (vs cancel)
// 224. Win-back incentive ladder
// 225. Customer community health score
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";
import { prisma } from "@/lib/prisma";

// ── 201. Gamification Engine ─────────────────────────────────────────────────

export type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
};

export const BADGES: Badge[] = [
  { id: "first_step", name: "First Step", icon: "🚀", description: "Completed your first action", condition: "command_completed >= 1" },
  { id: "week_warrior", name: "Week Warrior", icon: "⚔️", description: "7-day streak", condition: "streak >= 7" },
  { id: "month_master", name: "Month Master", icon: "👑", description: "30-day streak", condition: "streak >= 30" },
  { id: "first_sale", name: "Money Maker", icon: "💰", description: "Made your first sale", condition: "revenue > 0" },
  { id: "century", name: "Century Club", icon: "💯", description: "Earned $100+", condition: "revenue >= 100" },
  { id: "grand", name: "Grand Master", icon: "🏆", description: "Earned $1,000+", condition: "revenue >= 1000" },
  { id: "traffic", name: "Traffic Driver", icon: "🚗", description: "100+ site visitors", condition: "views >= 100" },
  { id: "lead_gen", name: "Lead Machine", icon: "🧲", description: "50+ leads captured", condition: "leads >= 50" },
  { id: "email_pro", name: "Email Pro", icon: "📧", description: "Sent 100+ emails", condition: "emails_sent >= 100" },
  { id: "ad_master", name: "Ad Master", icon: "📢", description: "Launched ads on 2+ platforms", condition: "platforms >= 2" },
  { id: "content_king", name: "Content King", icon: "📝", description: "Posted 30+ times", condition: "posts >= 30" },
  { id: "networker", name: "Networker", icon: "🤝", description: "Got 5+ referrals", condition: "referrals >= 5" },
];

export async function getUserBadges(userId: string): Promise<{ earned: Badge[]; next: Badge | null; points: number }> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "badge_earned" },
    select: { metadata: true },
  });
  const earnedIds = new Set(events.map(e => (e.metadata as Record<string, string>)?.badgeId));
  const earned = BADGES.filter(b => earnedIds.has(b.id));
  const next = BADGES.find(b => !earnedIds.has(b.id));
  return { earned, next: next ?? null, points: earned.length * 100 };
}

// ── 203. Birthday/Anniversary Automation ─────────────────────────────────────

export function generateBirthdayEmail(input: { name: string; businessName: string; discount: string }): { subject: string; body: string } {
  return {
    subject: `🎂 Happy Birthday, ${input.name}! A gift from ${input.businessName}`,
    body: `Hey ${input.name},\n\nHappy Birthday! 🎉\n\nWe wanted to do something special — here's ${input.discount} off anything in our catalog.\n\nUse code BIRTHDAY at checkout. Valid for 7 days.\n\nEnjoy your day!\n\n— The ${input.businessName} team`,
  };
}

export function generateAnniversaryEmail(input: { name: string; businessName: string; years: number; perk: string }): { subject: string; body: string } {
  return {
    subject: `${input.years} year${input.years > 1 ? "s" : ""} together! 🎊 — ${input.businessName}`,
    body: `${input.name},\n\nIt's been ${input.years} year${input.years > 1 ? "s" : ""} since you joined ${input.businessName}.\n\nThat's amazing. Thank you for being part of this journey.\n\nAs a thank you, here's something special: ${input.perk}\n\nHere's to many more.\n\n— ${input.businessName}`,
  };
}

// ── 206. UGC Collector ───────────────────────────────────────────────────────

export function generateUGCCollectionWidget(input: { businessName: string; webhookUrl: string; primaryColor: string }): string {
  return `
<div style="max-width:480px;margin:0 auto;padding:32px;border-radius:20px;border:1px solid #e5e7eb;text-align:center;">
  <h3 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 8px;">Share Your Results 📸</h3>
  <p style="font-size:13px;color:#64748b;margin:0 0 20px;">Show us what you've achieved! Your story could be featured on our page.</p>
  <form id="hm-ugc-form" style="text-align:left;">
    <label style="display:block;margin-bottom:12px;">
      <span style="font-size:12px;font-weight:700;color:#374151;">Your Name</span>
      <input name="name" required style="display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;" />
    </label>
    <label style="display:block;margin-bottom:12px;">
      <span style="font-size:12px;font-weight:700;color:#374151;">Your Result/Story</span>
      <textarea name="story" rows="4" required style="display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;resize:vertical;box-sizing:border-box;" placeholder="What results did you get? What changed for you?"></textarea>
    </label>
    <label style="display:block;margin-bottom:16px;">
      <span style="font-size:12px;font-weight:700;color:#374151;">Before & After (optional)</span>
      <input name="beforeAfter" style="display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;" placeholder="Before: X → After: Y" />
    </label>
    <button type="submit" style="width:100%;padding:12px;background:${input.primaryColor};color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Share My Story</button>
  </form>
</div>
<script>
document.getElementById('hm-ugc-form').onsubmit=function(e){
  e.preventDefault();
  var f=new FormData(e.target);
  fetch('${input.webhookUrl}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    name:f.get('name'),story:f.get('story'),beforeAfter:f.get('beforeAfter'),
    source:'ugc_widget',business:'${input.businessName.replace(/'/g,"\\'")}'
  })}).then(function(){
    e.target.innerHTML='<p style="text-align:center;padding:20px;color:#059669;font-weight:700;">Thank you! Your story has been submitted. 🙌</p>';
  });
};
</script>`;
}

// ── 215. Ambassador Program ──────────────────────────────────────────────────

export function generateAmbassadorProgram(input: { businessName: string; niche: string }): {
  tiers: { name: string; requirement: string; reward: string }[];
  applicationForm: { fields: string[]; questions: string[] };
  welcomeEmail: { subject: string; body: string };
} {
  return {
    tiers: [
      { name: "Advocate", requirement: "Share 1 post about us", reward: "10% lifetime discount" },
      { name: "Ambassador", requirement: "Refer 5 customers", reward: "25% commission on all referrals + exclusive swag" },
      { name: "Partner", requirement: "Refer 20+ customers/month", reward: "30% commission + co-branded content + direct line to founder" },
    ],
    applicationForm: {
      fields: ["name", "email", "instagram_handle", "audience_size", "why_interested"],
      questions: [
        `Why do you love ${input.businessName}?`,
        `How would you promote us to your audience?`,
        `What's your experience with ${input.niche}?`,
      ],
    },
    welcomeEmail: {
      subject: `Welcome to the ${input.businessName} Ambassador Program! 🎉`,
      body: `Hey {{name}},\n\nYou're in! Welcome to the ${input.businessName} Ambassador Program.\n\nHere's your unique referral link: {{referral_link}}\n\nEvery time someone signs up through your link, you earn commission.\n\nWe've also prepared promotional assets for you — images, copy, and templates ready to share.\n\nLet's grow together.\n\n— ${input.businessName} team`,
    },
  };
}

// ── 221. Churn Prediction ────────────────────────────────────────────────────

export function predictChurn(input: {
  daysSinceLastLogin: number;
  daysSinceLastPurchase: number;
  emailOpensLast14Days: number;
  supportTicketsOpen: number;
  usageDeclinePercent: number;
}): {
  churnProbability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  daysUntilLikelyChurn: number;
  preventionActions: string[];
} {
  let probability = 0;

  if (input.daysSinceLastLogin > 30) probability += 35;
  else if (input.daysSinceLastLogin > 14) probability += 20;
  else if (input.daysSinceLastLogin > 7) probability += 10;

  if (input.emailOpensLast14Days === 0) probability += 20;
  if (input.supportTicketsOpen > 2) probability += 15;
  if (input.usageDeclinePercent > 50) probability += 25;
  if (input.daysSinceLastPurchase > 90) probability += 15;

  probability = Math.min(probability, 99);

  const riskLevel = probability >= 75 ? "critical" : probability >= 50 ? "high" : probability >= 25 ? "medium" : "low";
  const daysUntilLikelyChurn = probability >= 75 ? 7 : probability >= 50 ? 14 : probability >= 25 ? 30 : 60;

  const actions: string[] = [];
  if (input.daysSinceLastLogin > 14) actions.push("Send personal email from founder");
  if (input.emailOpensLast14Days === 0) actions.push("Try SMS or different channel");
  if (input.supportTicketsOpen > 0) actions.push("Resolve open tickets immediately");
  if (input.usageDeclinePercent > 30) actions.push("Offer free strategy session");
  if (probability >= 50) actions.push("Offer exclusive discount to stay");
  if (probability >= 75) actions.push("Call them directly — human touch matters most");

  return { churnProbability: probability, riskLevel, daysUntilLikelyChurn, preventionActions: actions };
}

// ── 222. Save Offers ─────────────────────────────────────────────────────────

export function generateSaveOffers(input: { productName: string; price: string; niche: string }): {
  offers: { trigger: string; offer: string; emailSubject: string; emailBody: string }[];
} {
  return {
    offers: [
      {
        trigger: "Clicks cancel button",
        offer: "Pause instead of cancel (keep access, stop billing for 1 month)",
        emailSubject: "Before you go — what if you could pause instead?",
        emailBody: `Hey {{first_name}},\n\nI saw you're thinking about canceling ${input.productName}.\n\nWhat if instead of canceling, you could pause for a month? Keep everything saved, come back when you're ready.\n\nNo charge during the pause. No penalty.\n\nWant to pause instead? Reply "pause" and I'll set it up.`,
      },
      {
        trigger: "Hasn't logged in for 2 weeks",
        offer: "50% off next month + personal onboarding call",
        emailSubject: `We miss you — here's 50% off to come back`,
        emailBody: `{{first_name}},\n\nIt's been a while since you used ${input.productName}.\n\nI know things get busy. But I don't want you to miss out on what you signed up for.\n\nHere's the deal: 50% off your next month, plus a 15-minute call with me to get you back on track.\n\nUse code COMEBACK50 or reply to schedule the call.\n\nNo pressure. Just want to help.`,
      },
      {
        trigger: "Submits cancellation reason",
        offer: "Address their specific reason + free month",
        emailSubject: "I read your feedback — can we fix this?",
        emailBody: `{{first_name}},\n\nThank you for your honest feedback about ${input.productName}.\n\nYou mentioned: "{{cancellation_reason}}"\n\nI take this seriously. Here's what I'm doing about it: [specific fix]\n\nI'd love to give you a free month to see the improvement. No strings.\n\nReply "yes" and I'll add it to your account.`,
      },
    ],
  };
}
