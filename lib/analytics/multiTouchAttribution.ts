// ---------------------------------------------------------------------------
// Multi-Touch Attribution — advanced attribution models beyond last-touch
// Supports: First-touch, Last-touch, Linear, Time-decay, Position-based
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";

export type AttributionModel =
  | "first_touch"    // 100% to first interaction
  | "last_touch"     // 100% to last interaction (default)
  | "linear"         // Equal credit to all touchpoints
  | "time_decay"     // More credit to recent touchpoints
  | "position_based" // 40% first, 40% last, 20% middle
  | "u_shaped";      // Same as position_based

export interface TouchPoint {
  campaignId: string;
  platform: string;
  timestamp: Date;
  type: "ad_click" | "email_open" | "email_click" | "website_visit";
}

export interface AttributionResult {
  campaignId: string;
  platform: string;
  credit: number; // 0-1 (percentage of revenue to attribute)
  model: AttributionModel;
}

/**
 * Calculate attribution credits for a conversion based on touchpoint journey
 */
export async function calculateMultiTouchAttribution(
  leadId: string,
  conversionValue: number,
  model: AttributionModel = "last_touch"
): Promise<AttributionResult[]> {
  try {
    // Get all touchpoints for this lead
    const touchpoints = await getLeadTouchpoints(leadId);

    if (touchpoints.length === 0) {
      return [];
    }

    // Calculate credits based on model
    const credits = calculateCredits(touchpoints, model);

    return credits;
  } catch (err) {
    console.error("[Multi-Touch Attribution] Error:", err);
    return [];
  }
}

/**
 * Get all touchpoints (campaign interactions) for a lead
 */
async function getLeadTouchpoints(leadId: string): Promise<TouchPoint[]> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: true,
      },
    });

    if (!lead) return [];

    const touchpoints: TouchPoint[] = [];

    // Add campaign touchpoint if exists
    if (lead.campaign && lead.campaignId) {
      touchpoints.push({
        campaignId: lead.campaignId,
        platform: lead.campaign.platform || "unknown",
        timestamp: lead.createdAt,
        type: "ad_click",
      });
    }

    // Get email interactions
    const emailTracking = await prisma.emailTracking.findMany({
      where: {
        recipientEmail: lead.email,
      },
      include: {
        flow: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { sentAt: "asc" },
    });

    for (const tracking of emailTracking) {
      if (tracking.openedAt) {
        touchpoints.push({
          campaignId: tracking.flowId,
          platform: "email",
          timestamp: tracking.openedAt,
          type: "email_open",
        });
      }
      if (tracking.clickedAt) {
        touchpoints.push({
          campaignId: tracking.flowId,
          platform: "email",
          timestamp: tracking.clickedAt,
          type: "email_click",
        });
      }
    }

    // Sort by timestamp
    touchpoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return touchpoints;
  } catch (err) {
    console.error("[Multi-Touch Attribution] Error fetching touchpoints:", err);
    return [];
  }
}

/**
 * Calculate attribution credits based on selected model
 */
function calculateCredits(
  touchpoints: TouchPoint[],
  model: AttributionModel
): AttributionResult[] {
  if (touchpoints.length === 0) return [];

  const results: Map<string, AttributionResult> = new Map();

  switch (model) {
    case "first_touch":
      // 100% to first touchpoint
      const first = touchpoints[0];
      results.set(first.campaignId, {
        campaignId: first.campaignId,
        platform: first.platform,
        credit: 1.0,
        model,
      });
      break;

    case "last_touch":
      // 100% to last touchpoint
      const last = touchpoints[touchpoints.length - 1];
      results.set(last.campaignId, {
        campaignId: last.campaignId,
        platform: last.platform,
        credit: 1.0,
        model,
      });
      break;

    case "linear":
      // Equal credit to all touchpoints
      const linearCredit = 1.0 / touchpoints.length;
      touchpoints.forEach((tp) => {
        const existing = results.get(tp.campaignId);
        if (existing) {
          existing.credit += linearCredit;
        } else {
          results.set(tp.campaignId, {
            campaignId: tp.campaignId,
            platform: tp.platform,
            credit: linearCredit,
            model,
          });
        }
      });
      break;

    case "time_decay":
      // More credit to recent touchpoints (exponential decay)
      const halfLife = 7; // days
      const now = touchpoints[touchpoints.length - 1].timestamp.getTime();
      let totalWeight = 0;
      const weights: number[] = [];

      touchpoints.forEach((tp) => {
        const daysSince = (now - tp.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        const weight = Math.exp(-daysSince / halfLife);
        weights.push(weight);
        totalWeight += weight;
      });

      touchpoints.forEach((tp, idx) => {
        const credit = weights[idx] / totalWeight;
        const existing = results.get(tp.campaignId);
        if (existing) {
          existing.credit += credit;
        } else {
          results.set(tp.campaignId, {
            campaignId: tp.campaignId,
            platform: tp.platform,
            credit,
            model,
          });
        }
      });
      break;

    case "position_based":
    case "u_shaped":
      // 40% first, 40% last, 20% distributed among middle
      if (touchpoints.length === 1) {
        const single = touchpoints[0];
        results.set(single.campaignId, {
          campaignId: single.campaignId,
          platform: single.platform,
          credit: 1.0,
          model,
        });
      } else if (touchpoints.length === 2) {
        [touchpoints[0], touchpoints[touchpoints.length - 1]].forEach((tp) => {
          const existing = results.get(tp.campaignId);
          if (existing) {
            existing.credit += 0.5;
          } else {
            results.set(tp.campaignId, {
              campaignId: tp.campaignId,
              platform: tp.platform,
              credit: 0.5,
              model,
            });
          }
        });
      } else {
        const middleTouchpoints = touchpoints.slice(1, -1);
        const middleCredit = middleTouchpoints.length > 0 ? 0.2 / middleTouchpoints.length : 0;

        // First touchpoint: 40%
        const firstTp = touchpoints[0];
        results.set(firstTp.campaignId, {
          campaignId: firstTp.campaignId,
          platform: firstTp.platform,
          credit: 0.4,
          model,
        });

        // Last touchpoint: 40%
        const lastTp = touchpoints[touchpoints.length - 1];
        const lastExisting = results.get(lastTp.campaignId);
        if (lastExisting) {
          lastExisting.credit += 0.4;
        } else {
          results.set(lastTp.campaignId, {
            campaignId: lastTp.campaignId,
            platform: lastTp.platform,
            credit: 0.4,
            model,
          });
        }

        // Middle touchpoints: 20% distributed
        middleTouchpoints.forEach((tp) => {
          const existing = results.get(tp.campaignId);
          if (existing) {
            existing.credit += middleCredit;
          } else {
            results.set(tp.campaignId, {
              campaignId: tp.campaignId,
              platform: tp.platform,
              credit: middleCredit,
              model,
            });
          }
        });
      }
      break;
  }

  return Array.from(results.values());
}

/**
 * Apply multi-touch attribution to a conversion
 */
export async function applyMultiTouchAttribution(
  leadId: string,
  conversionId: string,
  conversionValue: number,
  model: AttributionModel = "position_based"
): Promise<void> {
  try {
    const attributions = await calculateMultiTouchAttribution(leadId, conversionValue, model);

    for (const attr of attributions) {
      const creditValue = conversionValue * attr.credit;

      // Update campaign with fractional revenue
      await prisma.campaign.update({
        where: { id: attr.campaignId },
        data: {
          revenue: { increment: creditValue },
        },
      });

      console.log(
        `[Multi-Touch] ${(attr.credit * 100).toFixed(1)}% ($${creditValue.toFixed(2)}) → Campaign ${attr.campaignId} (${model})`
      );
    }

    // Store attribution breakdown in conversion metadata
    await prisma.conversion.update({
      where: { id: conversionId },
      data: {
        metadata: {
          attributionModel: model,
          attributionBreakdown: attributions.map((a) => ({
            campaignId: a.campaignId,
            platform: a.platform,
            credit: a.credit,
            value: conversionValue * a.credit,
          })),
        },
      },
    });
  } catch (err) {
    console.error("[Multi-Touch Attribution] Error applying attribution:", err);
  }
}
