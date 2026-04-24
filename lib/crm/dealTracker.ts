import { prisma } from "@/lib/prisma";

export type Deal = {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  title: string;
  value: number; // in cents
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  probability: number; // 0-100
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  dealId?: string;
  clientId: string;
  userId: string;
  type: "note" | "email" | "call" | "meeting" | "task" | "stage_change" | "deal_created" | "deal_won" | "deal_lost";
  title: string;
  description?: string;
  createdAt: string;
};

const STAGE_PROBABILITY: Record<string, number> = {
  lead: 10, qualified: 25, proposal: 50, negotiation: 75, won: 100, lost: 0,
};

/** Create a deal */
export async function createDeal(userId: string, input: {
  clientId: string;
  clientName: string;
  title: string;
  value: number;
  stage?: string;
  expectedCloseDate?: string;
  notes?: string;
}): Promise<Deal> {
  const stage = (input.stage ?? "lead") as Deal["stage"];
  const event = await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "crm_deal",
      metadata: {
        clientId: input.clientId,
        clientName: input.clientName,
        title: input.title,
        value: input.value,
        stage,
        probability: STAGE_PROBABILITY[stage] ?? 10,
        expectedCloseDate: input.expectedCloseDate ?? null,
        notes: input.notes ?? null,
        updatedAt: new Date().toISOString(),
      },
    },
  });

  // Log activity
  await logActivity(userId, {
    clientId: input.clientId,
    dealId: event.id,
    type: "deal_created",
    title: `Deal created: ${input.title}`,
    description: `$${(input.value / 100).toFixed(2)} — ${stage}`,
  });

  const meta = event.metadata as Record<string, unknown>;
  return {
    id: event.id, userId, clientId: input.clientId, clientName: input.clientName,
    title: input.title, value: input.value, stage, probability: STAGE_PROBABILITY[stage] ?? 10,
    expectedCloseDate: meta.expectedCloseDate as string | undefined,
    notes: meta.notes as string | undefined,
    createdAt: event.createdAt.toISOString(), updatedAt: event.createdAt.toISOString(),
  };
}

/** Update deal stage */
export async function updateDealStage(dealId: string, newStage: Deal["stage"]): Promise<void> {
  const event = await prisma.himalayaFunnelEvent.findUnique({ where: { id: dealId } });
  if (!event) return;
  const meta = event.metadata as Record<string, unknown>;
  const oldStage = meta.stage as string;

  await prisma.himalayaFunnelEvent.update({
    where: { id: dealId },
    data: {
      metadata: {
        ...meta,
        stage: newStage,
        probability: STAGE_PROBABILITY[newStage] ?? 10,
        updatedAt: new Date().toISOString(),
      },
    },
  });

  await logActivity(event.userId ?? "", {
    clientId: meta.clientId as string,
    dealId,
    type: newStage === "won" ? "deal_won" : newStage === "lost" ? "deal_lost" : "stage_change",
    title: `Deal moved: ${oldStage} → ${newStage}`,
    description: `${meta.title} — $${((meta.value as number) / 100).toFixed(2)}`,
  });
}

/** List all deals for a user */
export async function listDeals(userId: string): Promise<Deal[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "crm_deal" },
    orderBy: { createdAt: "desc" },
  });

  return events.map(e => {
    const meta = e.metadata as Record<string, unknown>;
    return {
      id: e.id, userId,
      clientId: meta.clientId as string, clientName: meta.clientName as string,
      title: meta.title as string, value: (meta.value as number) ?? 0,
      stage: (meta.stage as Deal["stage"]) ?? "lead",
      probability: (meta.probability as number) ?? 10,
      expectedCloseDate: meta.expectedCloseDate as string | undefined,
      notes: meta.notes as string | undefined,
      createdAt: e.createdAt.toISOString(),
      updatedAt: (meta.updatedAt as string) ?? e.createdAt.toISOString(),
    };
  });
}

/** Get pipeline summary */
export async function getPipelineSummary(userId: string): Promise<{
  stages: { stage: string; count: number; value: number }[];
  totalValue: number;
  weightedValue: number;
  wonValue: number;
  lostValue: number;
}> {
  const deals = await listDeals(userId);
  const stageMap = new Map<string, { count: number; value: number }>();

  for (const stage of ["lead", "qualified", "proposal", "negotiation", "won", "lost"]) {
    stageMap.set(stage, { count: 0, value: 0 });
  }

  let totalValue = 0;
  let weightedValue = 0;
  let wonValue = 0;
  let lostValue = 0;

  for (const deal of deals) {
    const entry = stageMap.get(deal.stage) ?? { count: 0, value: 0 };
    entry.count++;
    entry.value += deal.value;
    stageMap.set(deal.stage, entry);

    if (deal.stage !== "lost") totalValue += deal.value;
    weightedValue += deal.value * (deal.probability / 100);
    if (deal.stage === "won") wonValue += deal.value;
    if (deal.stage === "lost") lostValue += deal.value;
  }

  return {
    stages: Array.from(stageMap.entries()).map(([stage, data]) => ({ stage, ...data })),
    totalValue: totalValue / 100,
    weightedValue: weightedValue / 100,
    wonValue: wonValue / 100,
    lostValue: lostValue / 100,
  };
}

/** Log an activity */
export async function logActivity(userId: string, input: {
  clientId: string;
  dealId?: string;
  type: Activity["type"];
  title: string;
  description?: string;
}): Promise<void> {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "crm_activity",
      metadata: {
        clientId: input.clientId,
        dealId: input.dealId ?? null,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
      },
    },
  });
}

/** Get activity timeline for a client */
export async function getClientTimeline(userId: string, clientId: string): Promise<Activity[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "crm_activity" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return events
    .filter(e => (e.metadata as Record<string, unknown>)?.clientId === clientId)
    .map(e => {
      const meta = e.metadata as Record<string, unknown>;
      return {
        id: e.id,
        dealId: meta.dealId as string | undefined,
        clientId: meta.clientId as string,
        userId: e.userId ?? "",
        type: meta.type as Activity["type"],
        title: meta.title as string,
        description: meta.description as string | undefined,
        createdAt: e.createdAt.toISOString(),
      };
    });
}

/** Create a task for a deal/client */
export async function createTask(userId: string, input: {
  clientId: string;
  dealId?: string;
  title: string;
  dueDate?: string;
}): Promise<void> {
  await logActivity(userId, {
    clientId: input.clientId,
    dealId: input.dealId,
    type: "task",
    title: input.title,
    description: input.dueDate ? `Due: ${input.dueDate}` : undefined,
  });
}
