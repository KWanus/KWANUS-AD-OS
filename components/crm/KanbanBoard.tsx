"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Deal = {
  id: string;
  clientName: string;
  title: string;
  value: number; // cents
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;
  createdAt: string;
};

export type KanbanBoardProps = {
  deals: Deal[];
  onStageChange: (dealId: string, newStage: Deal["stage"]) => void;
  onDealClick?: (dealId: string) => void;
};

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

const COLUMNS: {
  key: Deal["stage"];
  label: string;
  accent: string;
  accentBorder: string;
  accentBg: string;
}[] = [
  {
    key: "lead",
    label: "Lead",
    accent: "text-[#f5a623]",
    accentBorder: "border-[#f5a623]/25",
    accentBg: "bg-[#f5a623]/10",
  },
  {
    key: "qualified",
    label: "Qualified",
    accent: "text-[#f5a623]",
    accentBorder: "border-[#f5a623]/25",
    accentBg: "bg-[#f5a623]/10",
  },
  {
    key: "proposal",
    label: "Proposal",
    accent: "text-[#f5a623]",
    accentBorder: "border-[#f5a623]/25",
    accentBg: "bg-[#f5a623]/10",
  },
  {
    key: "negotiation",
    label: "Negotiation",
    accent: "text-[#f5a623]",
    accentBorder: "border-[#f5a623]/25",
    accentBg: "bg-[#f5a623]/10",
  },
  {
    key: "won",
    label: "Won",
    accent: "text-emerald-400",
    accentBorder: "border-emerald-500/25",
    accentBg: "bg-emerald-500/10",
  },
  {
    key: "lost",
    label: "Lost",
    accent: "text-red-400",
    accentBorder: "border-red-500/25",
    accentBg: "bg-red-500/10",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function probabilityColor(p: number): string {
  if (p >= 75) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (p >= 50) return "bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/25";
  if (p >= 25) return "bg-amber-500/15 text-amber-400 border-amber-500/25";
  return "bg-white/[0.05] text-white/40 border-white/[0.08]";
}

// ---------------------------------------------------------------------------
// Deal Card
// ---------------------------------------------------------------------------

function DealCard({
  deal,
  onDealClick,
  onDragStart,
}: {
  deal: Deal;
  onDealClick?: (id: string) => void;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
}) {
  const days = daysSince(deal.createdAt);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={() => onDealClick?.(deal.id)}
      className="group rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 cursor-grab active:cursor-grabbing hover:border-[#f5a623]/30 hover:bg-white/[0.05] transition-all select-none"
    >
      {/* Client name */}
      <p className="text-sm font-black text-white truncate group-hover:text-[#f5a623] transition-colors">
        {deal.clientName}
      </p>

      {/* Deal title */}
      <p className="text-xs text-white/40 mt-1 truncate">{deal.title}</p>

      {/* Value + probability row */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <span className="text-sm font-black text-green-400">
          {formatValue(deal.value)}
        </span>
        <span
          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${probabilityColor(deal.probability)}`}
        >
          {deal.probability}%
        </span>
      </div>

      {/* Days since created */}
      <p className="text-[10px] text-white/25 mt-2">
        {days === 0 ? "Today" : `${days}d ago`}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

function KanbanColumn({
  column,
  deals,
  dragOverStage,
  onDealClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  column: (typeof COLUMNS)[number];
  deals: Deal[];
  dragOverStage: string | null;
  onDealClick?: (id: string) => void;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragOver: (e: React.DragEvent, stage: Deal["stage"]) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stage: Deal["stage"]) => void;
}) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const isOver = dragOverStage === column.key;

  return (
    <div
      onDragOver={(e) => onDragOver(e, column.key)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.key)}
      className={`flex flex-col min-w-[260px] w-[260px] rounded-2xl border transition-colors ${
        isOver
          ? `${column.accentBorder} ${column.accentBg}`
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-black uppercase tracking-widest ${column.accent}`}>
              {column.label}
            </h3>
            <span className="text-[10px] font-bold text-white/25 bg-white/[0.05] rounded-md px-1.5 py-0.5">
              {deals.length}
            </span>
          </div>
        </div>
        {deals.length > 0 && (
          <p className="text-[11px] text-white/30 mt-1 font-semibold">
            {formatValue(totalValue)} total
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[120px]">
        {deals.length === 0 ? (
          <div className={`flex items-center justify-center h-20 rounded-xl border border-dashed transition-colors ${
            isOver ? column.accentBorder : "border-white/[0.06]"
          }`}>
            <p className="text-[10px] text-white/15 font-semibold">Drop here</p>
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onDealClick={onDealClick}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KanbanBoard
// ---------------------------------------------------------------------------

export default function KanbanBoard({ deals, onStageChange, onDealClick }: KanbanBoardProps) {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, dealId: string) => {
    setDraggingDealId(dealId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dealId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stage: Deal["stage"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, newStage: Deal["stage"]) => {
      e.preventDefault();
      const dealId = e.dataTransfer.getData("text/plain") || draggingDealId;
      setDragOverStage(null);
      setDraggingDealId(null);

      if (!dealId) return;

      // Only fire if stage actually changed
      const deal = deals.find((d) => d.id === dealId);
      if (deal && deal.stage !== newStage) {
        onStageChange(dealId, newStage);
      }
    },
    [deals, draggingDealId, onStageChange],
  );

  // Group deals by stage
  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = deals.filter((d) => d.stage === col.key);
      return acc;
    },
    {} as Record<Deal["stage"], Deal[]>,
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            column={col}
            deals={grouped[col.key]}
            dragOverStage={dragOverStage}
            onDealClick={onDealClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
