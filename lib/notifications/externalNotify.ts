// ---------------------------------------------------------------------------
// External Notifications — send alerts to Slack, Discord, or webhook
// Fire-and-forget. Never blocks. Never fails the user.
// ---------------------------------------------------------------------------

/** Send a Slack notification via incoming webhook */
export async function notifySlack(webhookUrl: string, message: {
  text: string;
  blocks?: { type: string; text?: { type: string; text: string } }[];
}): Promise<void> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
  } catch {
    // Silent
  }
}

/** Send a Discord notification via webhook */
export async function notifyDiscord(webhookUrl: string, message: {
  content: string;
  embeds?: { title: string; description: string; color?: number }[];
}): Promise<void> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
  } catch {
    // Silent
  }
}

/** Format a lead notification for external channels */
export function formatLeadAlert(leadName: string, email: string, source: string, score: number): {
  slackText: string;
  discordContent: string;
} {
  const emoji = score >= 60 ? "🔥" : score >= 30 ? "🟡" : "🔵";
  return {
    slackText: `${emoji} New lead: *${leadName}* (${email}) from ${source} — Score: ${score}/100`,
    discordContent: `${emoji} **New lead:** ${leadName} (${email}) from ${source} — Score: ${score}/100`,
  };
}

/** Format a payment notification for external channels */
export function formatPaymentAlert(amount: number, email: string): {
  slackText: string;
  discordContent: string;
} {
  return {
    slackText: `💰 Payment received: *$${(amount / 100).toFixed(2)}* from ${email}`,
    discordContent: `💰 **Payment received:** $${(amount / 100).toFixed(2)} from ${email}`,
  };
}
