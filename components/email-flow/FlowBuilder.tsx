"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type OnConnect,
  Panel,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  LayoutGrid,
  Mail,
  Clock,
  GitBranch,
  Tag,
  Target,
  ChevronDown,
  Users,
  MousePointer,
  Eye,
  DollarSign,
  Check,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import TriggerNode from "@/components/email-flow/nodes/TriggerNode";
import EmailNode from "@/components/email-flow/nodes/EmailNode";
import WaitNode from "@/components/email-flow/nodes/WaitNode";
import ConditionNode from "@/components/email-flow/nodes/ConditionNode";
import TagNode from "@/components/email-flow/nodes/TagNode";
import GoalNode from "@/components/email-flow/nodes/GoalNode";
import NodeEditor from "@/components/email-flow/NodeEditor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FlowStatus = "draft" | "active" | "paused";
type ExecutionTier = "core" | "elite";

interface FlowData {
  id: string;
  name: string;
  trigger: string;
  triggerConfig?: Record<string, unknown> & { executionTier?: ExecutionTier };
  nodes: Node[];
  edges: Edge[];
  status: FlowStatus;
  tags?: string[];
}

interface BusinessProfileSummary {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  location: string | null;
  mainOffer: string | null;
  targetAudience: string | null;
  mainGoal: string | null;
  stage: string;
}

interface FlowStats {
  enrolled: number;
  openRate: number;
  clickRate: number;
  revenue: number;
  failedEnrollmentCount: number;
  latestFailure: {
    contactEmail: string;
    updatedAt: string;
    message: string | null;
  } | null;
  recentEnrollments: Array<{
    id: string;
    contactEmail: string;
    status: string;
    currentNodeId: string | null;
    resumeAfter: string | null;
    updatedAt: string;
    emailsSent: number;
    latestError: string | null;
  }>;
}

type RetryResultState = Record<
  string,
  {
    status: string;
    at: number;
  }
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any;

// ---------------------------------------------------------------------------
// Node types registration
// ---------------------------------------------------------------------------

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  tag: TagNode,
  goal: GoalNode,
};

// ---------------------------------------------------------------------------
// Default edge style
// ---------------------------------------------------------------------------

const edgeDefaults = {
  style: { stroke: "#f5a623", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#f5a623" },
  animated: false,
};

function makeAnimatedEdge(isActive: boolean) {
  return {
    ...edgeDefaults,
    animated: isActive,
  };
}

// ---------------------------------------------------------------------------
// Node palette item
// ---------------------------------------------------------------------------

const PALETTE_NODES = [
  {
    type: "email",
    label: "Email",
    desc: "Send an email",
    icon: Mail,
    color: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    dot: "bg-purple-400",
  },
  {
    type: "wait",
    label: "Wait",
    desc: "Delay before next step",
    icon: Clock,
    color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  {
    type: "condition",
    label: "Condition",
    desc: "Branch on yes/no",
    icon: GitBranch,
    color: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    dot: "bg-orange-400",
  },
  {
    type: "tag",
    label: "Tag",
    desc: "Add or remove a tag",
    icon: Tag,
    color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  {
    type: "goal",
    label: "Goal",
    desc: "Track a conversion",
    icon: Target,
    color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    dot: "bg-yellow-400",
  },
];

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<FlowStatus, { label: string; dot: string; text: string; border: string }> = {
  draft:  { label: "Draft",  dot: "bg-white/20",      text: "text-white/40",   border: "border-white/10" },
  active: { label: "Active", dot: "bg-green-400",     text: "text-green-400",  border: "border-green-500/30" },
  paused: { label: "Paused", dot: "bg-yellow-400",    text: "text-yellow-400", border: "border-yellow-500/30" },
};

// ---------------------------------------------------------------------------
// Auto-layout utility (simple vertical stack)
// ---------------------------------------------------------------------------

function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  // Build a simple adjacency: node → children
  const childMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  nodes.forEach((n) => childMap.set(n.id, []));

  edges.forEach((e) => {
    const src = e.source;
    const tgt = e.target;
    childMap.get(src)?.push(tgt);
    parentMap.set(tgt, src);
  });

  // Find roots (no parent)
  const roots = nodes.filter((n) => !parentMap.has(n.id)).map((n) => n.id);

  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  const GAP_Y = 140;
  const GAP_X = 260;

  function place(id: string, x: number, y: number) {
    if (visited.has(id)) return;
    visited.add(id);
    positions.set(id, { x, y });
    const children = childMap.get(id) ?? [];
    children.forEach((child, i) => {
      const cx = x + (i - (children.length - 1) / 2) * GAP_X;
      place(child, cx, y + GAP_Y);
    });
  }

  roots.forEach((r, i) => place(r, i * 400, 0));

  return nodes.map((n) => {
    const pos = positions.get(n.id);
    if (!pos) return n;
    return { ...n, position: pos };
  });
}

// ---------------------------------------------------------------------------
// FlowBuilder component
// ---------------------------------------------------------------------------

export default function FlowBuilder({ flowId }: { flowId: string }) {
  const [flowMeta, setFlowMeta] = useState<Omit<FlowData, "nodes" | "edges">>({
    id: flowId,
    name: "Untitled Flow",
    trigger: "new_subscriber",
    status: "draft",
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<AnyRecord>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [selectedNode, setSelectedNode] = useState<Node<AnyRecord> | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [stats, setStats] = useState<FlowStats | null>(null);
  const [retryingFailed, setRetryingFailed] = useState(false);
  const [retryingEnrollmentId, setRetryingEnrollmentId] = useState<string | null>(null);
  const [retryResults, setRetryResults] = useState<RetryResultState>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);

  // -------------------------------------------------------------------------
  // Fetch flow on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    fetch(`/api/email-flows/${flowId}`)
      .then((r) => r.json() as Promise<{ ok: boolean; flow?: FlowData }>)
      .then((data) => {
        if (data.ok && data.flow) {
          const f = data.flow;
          setFlowMeta({ id: f.id, name: f.name, trigger: f.trigger, triggerConfig: f.triggerConfig, status: f.status, tags: f.tags });
          setExecutionTier(f.triggerConfig?.executionTier === "core" ? "core" : "elite");

          const loadedNodes: Node<AnyRecord>[] = Array.isArray(f.nodes)
            ? (f.nodes as Node<AnyRecord>[])
            : defaultNodes(f.trigger);

          const loadedEdges: Edge[] = Array.isArray(f.edges) && f.edges.length > 0
            ? (f.edges as Edge[])
            : [];

          setNodes(loadedNodes.length > 0 ? loadedNodes : defaultNodes(f.trigger));
          setEdges(loadedEdges);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [flowId, setNodes, setEdges]);

  const fetchStats = useCallback(() => {
    fetch(`/api/email-flows/${flowId}/stats`)
      .then((r) => r.json() as Promise<{ ok: boolean; stats?: FlowStats }>)
      .then((data) => {
        if (data.ok && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});
  }, [flowId]);

  useEffect(() => {
    fetch("/api/business-profile")
      .then((r) => r.json() as Promise<{ ok: boolean; profile?: BusinessProfileSummary | null }>)
      .then((data) => {
        if (data.ok && data.profile) setBusinessProfile(data.profile);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // -------------------------------------------------------------------------
  // Default scaffold when new flow
  // -------------------------------------------------------------------------

  function defaultNodes(trigger: string): Node<AnyRecord>[] {
    return [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 50 },
        data: { trigger, label: undefined },
        deletable: false,
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 220, y: 220 },
        data: { subject: "", previewText: "", body: "" },
      },
    ];
  }

  // -------------------------------------------------------------------------
  // Debounced auto-save
  // -------------------------------------------------------------------------

  function scheduleSave(newNodes: Node<AnyRecord>[], newEdges: Edge[], meta?: typeof flowMeta) {
    pendingSaveRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void doSave(newNodes, newEdges, meta ?? flowMeta);
    }, 1500);
  }

  async function doSave(
    saveNodes: Node<AnyRecord>[],
    saveEdges: Edge[],
    meta: typeof flowMeta
  ) {
    setSaveState("saving");
    try {
      await fetch(`/api/email-flows/${flowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meta.name,
          status: meta.status,
          triggerConfig: {
            ...(meta.triggerConfig ?? {}),
            executionTier,
          },
          nodes: saveNodes,
          edges: saveEdges,
        }),
      });
      fetchStats();
      setSaveState("saved");
      pendingSaveRef.current = false;
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  async function handleRetryFailedEnrollments() {
    setRetryingFailed(true);
    try {
      await fetch(`/api/email-flows/${flowId}/retry-failed`, {
        method: "POST",
      });
      fetchStats();
    } finally {
      setRetryingFailed(false);
    }
  }

  async function handleRetryEnrollment(enrollmentId: string) {
    setRetryingEnrollmentId(enrollmentId);
    try {
      const res = await fetch(`/api/email-flows/${flowId}/enrollments/${enrollmentId}/retry`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok: boolean; status?: string };
      if (data.ok && data.status) {
        const resolvedStatus = data.status;
        setRetryResults((prev) => ({
          ...prev,
          [enrollmentId]: {
            status: resolvedStatus,
            at: Date.now(),
          },
        }));
      }
      fetchStats();
    } finally {
      setRetryingEnrollmentId(null);
    }
  }

  // -------------------------------------------------------------------------
  // Edge connection
  // -------------------------------------------------------------------------

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...connection,
            ...makeAnimatedEdge(flowMeta.status === "active"),
          },
          eds
        );
        scheduleSave(nodes, newEdges);
        return newEdges;
      });
    },
    [nodes, flowMeta.status, setEdges] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // -------------------------------------------------------------------------
  // Node selection
  // -------------------------------------------------------------------------

  function handleNodeClick(_: React.MouseEvent, node: Node<AnyRecord>) {
    setSelectedNode(node);
  }

  function handlePaneClick() {
    setSelectedNode(null);
    setShowStatusMenu(false);
  }

  // -------------------------------------------------------------------------
  // Node data update (from editor panel)
  // -------------------------------------------------------------------------

  function handleNodeDataUpdate(nodeId: string, newData: AnyRecord) {
    setNodes((nds) => {
      const updated = nds.map((n) =>
        n.id === nodeId ? { ...n, data: newData } : n
      ) as Node<AnyRecord>[];
      scheduleSave(updated, edges);
      return updated;
    });
    setSelectedNode((prev) =>
      prev?.id === nodeId ? { ...prev, data: newData } : prev
    );
  }

  // -------------------------------------------------------------------------
  // Drag-and-drop from palette
  // -------------------------------------------------------------------------

  function handleDragStart(e: React.DragEvent, nodeType: string) {
    e.dataTransfer.setData("application/reactflow-node-type", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/reactflow-node-type");
    if (!type) return;

    const reactFlowBounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = {
      x: e.clientX - reactFlowBounds.left - 100,
      y: e.clientY - reactFlowBounds.top - 40,
    };

    const id = `${type}-${Date.now()}`;
    const defaultData = getDefaultData(type);

    const newNode: Node<AnyRecord> = { id, type, position, data: defaultData };
    setNodes((nds) => {
      const updated = [...nds, newNode] as Node<AnyRecord>[];
      scheduleSave(updated, edges);
      return updated;
    });
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function getDefaultData(type: string): AnyRecord {
    switch (type) {
      case "email":
        return { subject: "", previewText: "", body: "" };
      case "wait":
        return { duration: 1, unit: "days" };
      case "condition":
        return { conditionType: "opened_email" };
      case "tag":
        return { tagName: "", action: "add" };
      case "goal":
        return { goalName: "", metric: "purchase" };
      default:
        return {};
    }
  }

  // -------------------------------------------------------------------------
  // Quick-add node (floating button)
  // -------------------------------------------------------------------------

  function addQuickNode(type: string) {
    const id = `${type}-${Date.now()}`;
    const defaultData = getDefaultData(type);
    // Place below the lowest existing node
    let maxY = 0;
    (nodes as Node<AnyRecord>[]).forEach((n) => {
      if (n.position.y > maxY) maxY = n.position.y;
    });
    const newNode: Node<AnyRecord> = {
      id,
      type,
      position: { x: 250, y: maxY + 160 },
      data: defaultData,
    };
    setNodes((nds) => {
      const updated = [...nds, newNode] as Node<AnyRecord>[];
      scheduleSave(updated, edges);
      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Auto-layout
  // -------------------------------------------------------------------------

  function handleAutoLayout() {
    setNodes((nds) => {
      const laid = autoLayout(nds as Node<AnyRecord>[], edges) as Node<AnyRecord>[];
      scheduleSave(laid, edges);
      return laid;
    });
  }

  // -------------------------------------------------------------------------
  // Manual save
  // -------------------------------------------------------------------------

  async function handleManualSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await doSave(nodes as Node<AnyRecord>[], edges, flowMeta);
  }

  // -------------------------------------------------------------------------
  // Flow name update
  // -------------------------------------------------------------------------

  function handleNameChange(name: string) {
    const updated = { ...flowMeta, name };
    setFlowMeta(updated);
    scheduleSave(nodes as Node<AnyRecord>[], edges, updated);
  }

  // -------------------------------------------------------------------------
  // Status update
  // -------------------------------------------------------------------------

  function handleStatusChange(status: FlowStatus) {
    const updated = { ...flowMeta, status };
    setFlowMeta(updated);
    setShowStatusMenu(false);

    // Re-apply edge animation based on new status
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        ...makeAnimatedEdge(status === "active"),
      }))
    );

    void (async () => {
      await fetch(`/api/email-flows/${flowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    })();
  }

  function handleExecutionTierChange(tier: ExecutionTier) {
    setExecutionTier(tier);
    const updated = {
      ...flowMeta,
      triggerConfig: {
        ...(flowMeta.triggerConfig ?? {}),
        executionTier: tier,
      },
    };
    setFlowMeta(updated);
    scheduleSave(nodes as Node<AnyRecord>[], edges, updated);
  }

  // -------------------------------------------------------------------------
  // Nodes change handler — sync with auto-save
  // -------------------------------------------------------------------------

  function handleNodesChange(changes: Parameters<typeof onNodesChange>[0]) {
    onNodesChange(changes);
    // For position changes: schedule save after drag ends
    const hasPositionChange = changes.some((c) => c.type === "position" && !c.dragging);
    if (hasPositionChange) {
      scheduleSave(nodes as Node<AnyRecord>[], edges);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const sc = STATUS_CONFIG[flowMeta.status];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050a14]">

      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDEBAR                                                         */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className="flex flex-col h-full border-r border-white/[0.07] bg-[#06091a] shrink-0 overflow-y-auto"
        style={{ width: 260 }}
      >
        {/* Back + branding */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
          <Link
            href="/emails"
            className="inline-flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Flows
          </Link>

          {/* Editable flow name */}
          {editingName ? (
            <input
              autoFocus
              className="w-full bg-white/[0.04] border border-[#f5a623]/40 rounded-xl px-3 py-2 text-sm font-black text-white outline-none"
              value={flowMeta.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            />
          ) : (
            <button
              className="w-full text-left text-sm font-black text-white hover:text-[#f5a623] transition truncate"
              onClick={() => setEditingName(true)}
              title="Click to rename"
            >
              {flowMeta.name}
            </button>
          )}

          {/* Status toggle */}
          <div className="relative mt-2">
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition w-full ${sc.border} ${sc.text}`}
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
              {sc.label}
              <ChevronDown className="w-3 h-3 ml-auto" />
            </button>

            {showStatusMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-[#0d1525] overflow-hidden z-50 shadow-2xl">
                {(["draft", "active", "paused"] as FlowStatus[]).map((s) => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-white/5 transition ${c.text} ${flowMeta.status === s ? "bg-white/[0.04]" : ""}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      {c.label}
                      {flowMeta.status === s && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Trigger card */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Trigger</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.06]">
            <div className="w-5 h-5 rounded-md bg-[#f5a623]/20 flex items-center justify-center text-xs">⚡</div>
            <div>
              <p className="text-[10px] font-bold text-[#f5a623] capitalize">
                {flowMeta.trigger.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Execution Lane</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: "core" as const,
                label: "Core",
                description: "Clean automations with practical copy and fast execution.",
              },
              {
                id: "elite" as const,
                label: "Elite",
                description: "Sharper lifecycle framing with stronger persuasion and premium polish.",
              },
            ].map((tier) => {
              const active = executionTier === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleExecutionTierChange(tier.id)}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    active
                      ? "border-[#f5a623]/40 bg-[#f5a623]/10 shadow-[0_0_20px_rgba(245,166,35,0.12)]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-black ${active ? "text-[#f5a623]" : "text-white"}`}>{tier.label}</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${active ? "text-[#f5a623]" : "text-white/20"}`}>
                      {tier.id}
                    </span>
                  </div>
                  <p className={`mt-2 text-[11px] leading-relaxed ${active ? "text-cyan-100/80" : "text-white/45"}`}>
                    {tier.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {businessProfile && (
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Business Context</p>
              <Link href="/my-system" className="text-[10px] font-bold text-[#f5a623]/70 hover:text-[#f5a623] transition">
                View System
              </Link>
            </div>
            <div className="rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/[0.05] p-3 space-y-2">
              <ContextRow label="Business" value={businessProfile.businessName || "Unnamed business"} />
              <ContextRow label="Type" value={businessProfile.businessType.replace(/_/g, " ")} />
              <ContextRow label="Niche" value={businessProfile.niche || "Not set"} />
              <ContextRow label="Goal" value={businessProfile.mainGoal?.replace(/_/g, " ") || "Not set"} />
              <ContextRow label="Audience" value={businessProfile.targetAudience || "Not set"} />
              <ContextRow label="Offer" value={businessProfile.mainOffer || "Not set"} />
            </div>
          </div>
        )}

        {/* Node palette */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
            Add Step
          </p>
          <div className="space-y-2">
            {PALETTE_NODES.map(({ type, label, desc, icon: Icon, color }) => (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-grab active:cursor-grabbing transition hover:opacity-90 ${color}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">{label}</p>
                  <p className="text-[9px] opacity-60">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flow stats */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          {(stats?.failedEnrollmentCount ?? 0) > 0 && (
            <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-amber-100">Delivery issue in this flow</p>
                  <p className="mt-1 text-[10px] leading-5 text-amber-100/70">
                    {stats?.failedEnrollmentCount} failed enrollment{stats?.failedEnrollmentCount === 1 ? "" : "s"}.
                    {stats?.latestFailure?.contactEmail ? ` Latest: ${stats.latestFailure.contactEmail}.` : ""}
                  </p>
                  {stats?.latestFailure?.message && (
                    <p className="mt-1 line-clamp-3 text-[10px] leading-5 text-amber-100/60">
                      {stats.latestFailure.message}
                    </p>
                  )}
                  <button
                    onClick={() => void handleRetryFailedEnrollments()}
                    disabled={retryingFailed}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-black/10 px-2.5 py-1.5 text-[10px] font-black text-amber-100 hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {retryingFailed ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Retry Failed
                  </button>
                </div>
              </div>
            </div>
          )}
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">Stats</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Users,        label: "Enrolled",   value: stats ? stats.enrolled.toLocaleString() : "—" },
              { icon: Eye,          label: "Open Rate",  value: stats ? `${stats.openRate}%` : "—" },
              { icon: MousePointer, label: "Click Rate", value: stats ? `${stats.clickRate}%` : "—" },
              { icon: DollarSign,   label: "Revenue",    value: stats ? `$${stats.revenue.toLocaleString()}` : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="flex items-center gap-1 mb-1">
                  <Icon className="w-2.5 h-2.5 text-white/25" />
                  <p className="text-[9px] text-white/30 font-medium">{label}</p>
                </div>
                <p className="text-sm font-black text-white/50">{value}</p>
              </div>
            ))}
          </div>

          {(stats?.recentEnrollments.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/25">
                Recent Enrollments
              </p>
              <div className="space-y-2">
                {stats?.recentEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-white/80">
                          {enrollment.contactEmail}
                        </p>
                        <p className="mt-0.5 text-[9px] text-white/35">
                          {formatRelativeTime(enrollment.updatedAt)}
                          {enrollment.currentNodeId ? ` • ${enrollment.currentNodeId}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${
                          enrollment.status === "failed"
                            ? "border-red-500/30 bg-red-500/10 text-red-300"
                            : enrollment.status === "paused"
                              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                              : enrollment.status === "completed"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]"
                        }`}
                      >
                        {enrollment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[9px] text-white/35">
                      {enrollment.emailsSent} email{enrollment.emailsSent === 1 ? "" : "s"} sent
                      {enrollment.resumeAfter ? ` • resumes ${formatRelativeTime(enrollment.resumeAfter)}` : ""}
                    </p>
                    {enrollment.latestError && (
                      <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-red-200/75">
                        {enrollment.latestError}
                      </p>
                    )}
                    {retryResults[enrollment.id] && (
                      <p className="mt-1 text-[9px] leading-4 text-cyan-200/75">
                        Retried {formatRelativeTime(new Date(retryResults[enrollment.id].at).toISOString())}
                        {` -> ${retryResults[enrollment.id].status}`}
                      </p>
                    )}
                    {enrollment.status === "failed" && (
                      <button
                        onClick={() => void handleRetryEnrollment(enrollment.id)}
                        disabled={retryingEnrollmentId === enrollment.id}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-black/10 px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-red-100 hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {retryingEnrollmentId === enrollment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        Retry Contact
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="px-4 py-4">
          <button
            onClick={() => void handleManualSave()}
            disabled={saveState === "saving"}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f5a623] hover:bg-cyan-400 text-[#050a14] text-xs font-black transition disabled:opacity-60 shadow-[0_0_20px_rgba(245,166,35,0.2)]"
          >
            {saveState === "saving" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : saveState === "saved" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Flow
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CANVAS                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex-1 h-full relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={edgeDefaults}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#050a14]"
        >
          {/* Dot-grid background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgba(255,255,255,0.06)"
          />

          {/* Controls */}
          <Controls
            className="!border-white/10 !bg-t-bg-card !shadow-2xl"
            showInteractive={false}
          />

          {/* Minimap */}
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "trigger") return "#f5a623";
              if (n.type === "email") return "#a855f7";
              if (n.type === "wait") return "#f59e0b";
              if (n.type === "condition") return "#f97316";
              if (n.type === "tag") return "#10b981";
              if (n.type === "goal") return "#eab308";
              return "#334155";
            }}
            maskColor="rgba(5,10,20,0.7)"
            className="!border-white/10 !bg-[#06091a] !rounded-2xl !overflow-hidden"
            style={{ bottom: 16, right: 16 }}
          />

          {/* Top-right toolbar panel */}
          <Panel position="top-right">
            <div className="flex items-center gap-2 mr-2 mt-2">
              {/* Auto-save indicator */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition ${
                  saveState === "saving"
                    ? "border-[#f5a623]/30 text-[#f5a623] bg-[#f5a623]/10"
                    : saveState === "saved"
                    ? "border-green-500/30 text-green-400 bg-green-500/10"
                    : "border-white/10 text-white/20 bg-white/[0.02]"
                }`}
              >
                {saveState === "saving" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                {saveState === "saved" && <Check className="w-2.5 h-2.5" />}
                {saveState === "idle" && <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Auto-save on"}
              </div>

              {/* Auto-layout button */}
              <button
                onClick={handleAutoLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white/40 hover:text-white/70 text-[10px] font-bold transition"
              >
                <LayoutGrid className="w-3 h-3" />
                Auto Layout
              </button>

              {/* Status quick-toggle */}
              {flowMeta.status === "active" ? (
                <button
                  onClick={() => handleStatusChange("paused")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold hover:bg-yellow-500/20 transition"
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] font-bold hover:bg-green-500/20 transition"
                >
                  <Play className="w-3 h-3" />
                  Activate
                </button>
              )}
            </div>
          </Panel>
        </ReactFlow>

        {/* Quick-add floating button */}
        <div className="absolute bottom-6 right-6 z-10">
          <div className="relative">
            {showQuickAdd && (
              <div className="absolute bottom-14 right-0 w-48 rounded-xl border border-white/10 bg-[#0d1525] shadow-xl p-2 space-y-1">
                {[
                  { type: "email", label: "Send Email", icon: "\u2709\uFE0F" },
                  { type: "wait", label: "Wait / Delay", icon: "\u23F1\uFE0F" },
                  { type: "condition", label: "If/Then Branch", icon: "\uD83D\uDD00" },
                  { type: "tag", label: "Add Tag", icon: "\uD83C\uDFF7\uFE0F" },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => { addQuickNode(item.type); setShowQuickAdd(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white/50 hover:bg-[#f5a623]/10 hover:text-[#f5a623] transition"
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f5a623] to-[#e07850] text-[#0c0a08] font-black text-xl shadow-lg hover:opacity-90 transition"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL — Node Editor                                            */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`h-full shrink-0 transition-all duration-300 overflow-hidden ${
          selectedNode ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ width: selectedNode ? 320 : 0 }}
      >
        {selectedNode && (
          <NodeEditor
            node={selectedNode as Node<Record<string, unknown>>}
            flowContext={{ trigger: flowMeta.trigger, flowName: flowMeta.name, flowId: flowMeta.id }}
            onClose={() => setSelectedNode(null)}
            onUpdate={(nodeId, newData) => handleNodeDataUpdate(nodeId, newData)}
          />
        )}
      </div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">{label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-white/70">{value}</p>
    </div>
  );
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}
