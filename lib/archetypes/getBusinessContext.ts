import { prisma } from "@/lib/prisma";
import { ARCHETYPES } from "./index";

export async function getBusinessContext(userId: string): Promise<string> {
  const profile = await prisma.businessProfile.findUnique({ where: { userId } });
  if (!profile) return "";

  const archetype = profile.businessType ? ARCHETYPES[profile.businessType as keyof typeof ARCHETYPES] : null;
  if (!archetype) return "";

  return `
=== BUSINESS CONTEXT ===
Business Type: ${archetype.label}
Niche: ${profile.niche || "not specified"}
Offer: ${profile.mainOffer || "not specified"}
Price Point: ${profile.offerPrice || "not specified"}
Target Audience: ${profile.targetAudience || "not specified"}
Audience Pains: ${JSON.stringify(profile.audiencePains || [])}
Stage: ${profile.stage}
Goal: ${profile.mainGoal || "not specified"}
Location: ${profile.location || "online"}

=== ARCHETYPE INTELLIGENCE ===
Acquisition Model: ${archetype.acquisitionModel}
Sales Process: ${archetype.salesProcess}
Decision Window: ${archetype.decisionWindow}
Funnel Type: ${archetype.funnelType}
Top Conversion Triggers: ${archetype.conversionTriggers.join(", ")}
Top Objections: ${archetype.topObjections.join(", ")}
Winning Angles: ${archetype.winningAngles.join(", ")}
Psychology Principles: ${archetype.psychologyPrinciples.join(", ")}
=== END CONTEXT ===
`;
}
