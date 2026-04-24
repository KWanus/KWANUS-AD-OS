import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  task: string;
  dueDay: number; // day offset from onboard date
  done: boolean;
  completedAt?: string;
}

export interface ClientInvoice {
  id: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  paidAt?: string;
  lineItems: { description: string; amount: number }[];
}

export interface ClientProject {
  id: string;
  clientId: string;
  name: string;
  deliverables: { name: string; completed: boolean }[];
  completedCount: number;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Auto-Onboard — generates default checklist + project for a new client
// ---------------------------------------------------------------------------

const DEFAULT_CHECKLIST: { task: string; dueDay: number }[] = [
  { task: "Send welcome email", dueDay: 0 },
  { task: "Schedule kick-off call", dueDay: 1 },
  { task: "Collect brand assets (logo, colors, fonts)", dueDay: 2 },
  { task: "Set up project workspace", dueDay: 2 },
  { task: "Deliver initial strategy document", dueDay: 5 },
  { task: "First deliverable review", dueDay: 10 },
  { task: "Mid-project check-in", dueDay: 15 },
  { task: "Final delivery & handoff", dueDay: 30 },
];

const DEFAULT_DELIVERABLES: { name: string; completed: boolean }[] = [
  { name: "Discovery & Strategy", completed: false },
  { name: "Design Mockups", completed: false },
  { name: "Development Build", completed: false },
  { name: "Content Population", completed: false },
  { name: "QA & Testing", completed: false },
  { name: "Launch & Go-Live", completed: false },
];

export async function autoOnboardClient(userId: string, clientId: string): Promise<void> {
  try {
    // Check if already onboarded
    const existing = await prisma.himalayaFunnelEvent.findFirst({
      where: { userId, event: "client_checklist", metadata: { path: ["clientId"], equals: clientId } },
    });
    if (existing) return; // Already onboarded

    // Create checklist items
    await prisma.himalayaFunnelEvent.createMany({
      data: DEFAULT_CHECKLIST.map((item) => ({
        userId,
        event: "client_checklist",
        metadata: { clientId, task: item.task, dueDay: item.dueDay, done: false },
      })),
    });

    // Create project
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId,
        event: "client_project",
        metadata: {
          clientId,
          name: "Client Delivery",
          deliverables: DEFAULT_DELIVERABLES,
        },
      },
    });
  } catch {
    // Non-fatal — onboarding is best-effort
  }
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

export async function getClientChecklist(userId: string, clientId: string): Promise<ChecklistItem[]> {
  try {
    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId, event: "client_checklist" },
      orderBy: { createdAt: "desc" },
    });

    const items: ChecklistItem[] = [];
    for (const ev of events) {
      const meta = ev.metadata as Record<string, unknown> | null;
      if (meta?.clientId !== clientId) continue;
      items.push({
        id: ev.id,
        task: (meta?.task as string) ?? "Untitled task",
        dueDay: (meta?.dueDay as number) ?? 0,
        done: Boolean(meta?.done),
        completedAt: (meta?.completedAt as string) ?? undefined,
      });
    }
    return items.sort((a, b) => a.dueDay - b.dueDay);
  } catch {
    return [];
  }
}

export async function toggleChecklistItem(userId: string, itemId: string, done: boolean): Promise<boolean> {
  try {
    const event = await prisma.himalayaFunnelEvent.findUnique({ where: { id: itemId } });
    if (!event || event.userId !== userId) return false;
    const meta = (event.metadata as Record<string, unknown>) ?? {};
    await prisma.himalayaFunnelEvent.update({
      where: { id: itemId },
      data: {
        metadata: {
          ...meta,
          done,
          completedAt: done ? new Date().toISOString() : null,
        },
      },
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export async function getClientInvoices(userId: string, clientId: string): Promise<ClientInvoice[]> {
  try {
    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId, event: "client_invoice" },
      orderBy: { createdAt: "desc" },
    });

    const invoices: ClientInvoice[] = [];
    for (const ev of events) {
      const meta = ev.metadata as Record<string, unknown> | null;
      if (meta?.clientId !== clientId) continue;
      invoices.push({
        id: ev.id,
        amount: (meta?.amount as number) ?? 0,
        status: (meta?.status as "pending" | "paid" | "overdue") ?? "pending",
        dueDate: (meta?.dueDate as string) ?? ev.createdAt.toISOString(),
        paidAt: (meta?.paidAt as string) ?? undefined,
        lineItems: (meta?.lineItems as { description: string; amount: number }[]) ?? [],
      });
    }
    return invoices;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getClientProjects(userId: string): Promise<ClientProject[]> {
  try {
    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId, event: "client_project" },
      orderBy: { createdAt: "desc" },
    });

    const projects: ClientProject[] = [];
    for (const ev of events) {
      const meta = ev.metadata as Record<string, unknown> | null;
      if (!meta?.clientId) continue;
      const deliverables = (meta?.deliverables as { name: string; completed: boolean }[]) ?? [];
      const completedCount = deliverables.filter((d) => d.completed).length;
      projects.push({
        id: ev.id,
        clientId: meta.clientId as string,
        name: (meta?.name as string) ?? "Untitled Project",
        deliverables,
        completedCount,
        totalCount: deliverables.length,
      });
    }
    return projects;
  } catch {
    return [];
  }
}
