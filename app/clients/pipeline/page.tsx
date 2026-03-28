"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Loader2,
  GripVertical,
  Building2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  dealValue?: number;
  healthScore: number;
  healthStatus: "green" | "yellow" | "red";
  pipelineStage: string;
  lastContactAt?: string;
  priority: string;
  tags: string[];
  executionTier?: "core" | "elite";
}

// ---------------------------------------------------------------------------
// Stage config
// ---------------------------------------------------------------------------

const STAGES = [
  { key: "lead",      label: "Lead",      color: "text-white/50",    border: "border-white/10",       header: "border-t-white/20",   count_bg: "bg-white/10" },
  { key: "qualified", label: "Qualified", color: "text-cyan-400",    border: "border-cyan-500/20",    header: "border-t-cyan-500",   count_bg: "bg-cyan-500/20" },
  { key: "proposal",  label: "Proposal",  color: "text-blue-400",    border: "border-blue-500/20",    header: "border-t-blue-500",   count_bg: "bg-blue-500/20" },
  { key: "active",    label: "Active",    color: "text-green-400",   border: "border-green-500/20",   header: "border-t-green-500",  count_bg: "bg-green-500/20" },
  { key: "won",       label: "Won",       color: "text-emerald-400", border: "border-emerald-500/20", header: "border-t-emerald-500", count_bg: "bg-emerald-500/20" },
  { key: "churned",   label: "Churned",   color: "text-red-400",     border: "border-red-500/20",     header: "border-t-red-500",    count_bg: "bg-red-500/20" },
];

const HEALTH_DOT: Record<string, string> = {
  green: "bg-green-400",
  yellow: "bg-amber-400",
  red: "bg-red-400 animate-pulse",
};

// ---------------------------------------------------------------------------
// Pipeline Card
// ---------------------------------------------------------------------------

function PipelineCard({
  client,
  isDragging = false,
}: {
  client: Client;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isThisDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isThisDragging ? 0.4 : 1,
  };

  const dot = HEALTH_DOT[client.healthStatus] ?? HEALTH_DOT.yellow;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-150 cursor-pointer ${
        isDragging ? "shadow-2xl shadow-black/60 rotate-1 scale-[1.02]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <Link
          href={`/clients/${client.id}`}
          className="flex-1 min-w-0 text-sm font-bold text-white hover:text-cyan-300 transition-colors truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {client.name}
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`w-2 h-2 rounded-full ${dot}`} title={`Health: ${client.healthScore}`} />
          <div
            {...attributes}
            {...listeners}
            className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {client.company && (
        <p className="text-[11px] text-white/35 flex items-center gap-1 mb-2 truncate">
          <Building2 className="w-2.5 h-2.5 shrink-0" />
          {client.company}
        </p>
      )}

      <div className="mb-2">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
          client.executionTier === "core" ? "text-white/30" : "text-cyan-300/75"
        }`}>
          {client.executionTier ?? "elite"} lane
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2">
          {client.dealValue && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-green-400">
              <DollarSign className="w-2.5 h-2.5" />
              {client.dealValue >= 1000
                ? `${(client.dealValue / 1000).toFixed(0)}k`
                : client.dealValue}
            </span>
          )}
          {client.priority === "high" && (
            <span className="text-[9px] font-black uppercase text-red-400/80 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
              HIGH
            </span>
          )}
        </div>
        {client.lastContactAt ? (
          <span className="text-[10px] text-white/25 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatDistanceToNow(new Date(client.lastContactAt), { addSuffix: true }).replace("about ", "")}
          </span>
        ) : (
          <span className="text-[10px] text-amber-400/60 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            Never
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Column
// ---------------------------------------------------------------------------

function PipelineColumn({
  stage,
  clients,
  pipelineValue,
}: {
  stage: (typeof STAGES)[number];
  clients: Client[];
  pipelineValue: number;
}) {
  return (
    <div className={`flex flex-col bg-white/[0.015] border border-white/[0.06] rounded-2xl overflow-hidden border-t-2 ${stage.header}`}>
      {/* Column header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className={`text-xs font-black uppercase tracking-wider ${stage.color}`}>{stage.label}</h3>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${stage.count_bg} ${stage.color}`}>
            {clients.length}
          </span>
        </div>
        {pipelineValue > 0 && (
          <span className="text-[10px] font-bold text-green-400/70">
            ${pipelineValue >= 1000 ? `${(pipelineValue / 1000).toFixed(0)}k` : pipelineValue}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-240px)]">
        <SortableContext items={clients.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {clients.map((client) => (
            <PipelineCard key={client.id} client={client} />
          ))}
        </SortableContext>
        {clients.length === 0 && (
          <div className="flex items-center justify-center h-20 text-[11px] text-white/15 border border-dashed border-white/[0.06] rounded-xl">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?limit=100");
      const data = await res.json() as { ok: boolean; clients?: Client[] };
      if (data.ok) setClients(data.clients ?? []);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Group clients by stage
  const byStage = STAGES.reduce<Record<string, Client[]>>((acc, s) => {
    acc[s.key] = clients.filter((c) => c.pipelineStage === s.key);
    return acc;
  }, {});

  function handleDragStart(event: DragStartEvent) {
    const client = clients.find((c) => c.id === event.active.id);
    setActiveClient(client ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    // Check if dropped over a stage column (by stage key)
    const overStage = STAGES.find((s) => s.key === over.id);
    if (overStage) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === active.id ? { ...c, pipelineStage: overStage.key } : c
        )
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveClient(null);
    if (!over) return;

    const dragged = clients.find((c) => c.id === active.id);
    if (!dragged) return;

    // Determine target stage
    let targetStage = dragged.pipelineStage;

    // If dropped on a stage column ID
    const overStage = STAGES.find((s) => s.key === over.id);
    if (overStage) {
      targetStage = overStage.key;
    } else {
      // Dropped on another card — use that card's stage
      const overClient = clients.find((c) => c.id === over.id);
      if (overClient) targetStage = overClient.pipelineStage;
    }

    if (targetStage === dragged.pipelineStage) return;

    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === dragged.id ? { ...c, pipelineStage: targetStage } : c))
    );

    // Persist
    setSaving(dragged.id);
    try {
      await fetch(`/api/clients/${dragged.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: targetStage }),
      });
    } catch {
      // Rollback on error
      setClients((prev) =>
        prev.map((c) => (c.id === dragged.id ? { ...c, pipelineStage: dragged.pipelineStage } : c))
      );
    } finally {
      setSaving(null);
    }
  }

  const totalPipelineValue = clients
    .filter((c) => !["won", "churned"].includes(c.pipelineStage))
    .reduce((s, c) => s + (c.dealValue ?? 0), 0);

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Pipeline</h1>
          <p className="text-sm text-white/35 mt-0.5">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
            {totalPipelineValue > 0 && (
              <span className="ml-2 text-green-400 font-semibold">
                · ${totalPipelineValue.toLocaleString()} pipeline value
              </span>
            )}
            {saving && <span className="ml-2 text-cyan-400/60">· saving...</span>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STAGES.map((stage) => (
              <PipelineColumn
                key={stage.key}
                stage={stage}
                clients={byStage[stage.key] ?? []}
                pipelineValue={(byStage[stage.key] ?? []).reduce(
                  (s, c) => s + (c.dealValue ?? 0),
                  0
                )}
              />
            ))}
          </div>

          <DragOverlay>
            {activeClient && (
              <PipelineCard client={activeClient} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </main>
  );
}
