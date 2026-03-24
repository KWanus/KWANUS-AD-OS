import { differenceInDays } from "date-fns";

export function computeHealthScore(client: {
  lastContactAt: Date | null;
  pipelineStage: string;
  dealValue?: number | null;
  createdAt: Date;
}): { score: number; status: "green" | "yellow" | "red"; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  // --- Days since last contact (0–40 points)
  if (client.lastContactAt) {
    const days = differenceInDays(new Date(), client.lastContactAt);
    if (days <= 3) {
      score += 30;
    } else if (days <= 7) {
      score += 20;
    } else if (days <= 14) {
      score += 5;
    } else if (days <= 30) {
      score -= 10;
      reasons.push(`No contact in ${days} days`);
    } else {
      score -= 25;
      reasons.push(`Inactive for ${days} days`);
    }
  } else {
    // Never contacted — check age
    const ageDays = differenceInDays(new Date(), client.createdAt);
    if (ageDays > 7) {
      score -= 15;
      reasons.push("Never contacted");
    }
  }

  // --- Pipeline stage bonus/penalty
  const stageScores: Record<string, number> = {
    lead: 0,
    qualified: 10,
    proposal: 15,
    active: 20,
    won: 25,
    churned: -30,
  };
  score += stageScores[client.pipelineStage] ?? 0;
  if (client.pipelineStage === "churned") reasons.push("Client churned");

  // --- Deal value presence
  if (client.dealValue && client.dealValue > 0) {
    score += 5;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const status: "green" | "yellow" | "red" =
    score >= 70 ? "green" : score >= 40 ? "yellow" : "red";

  return { score, status, reasons };
}
