"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Play, Pause, Save, ArrowLeft, Mail, Clock, SplitSquareHorizontal, Zap, Sparkles } from "lucide-react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    Connection,
    addEdge,
    Handle,
    Position,
} from "reactflow";
import "reactflow/dist/style.css";

// ---------------------------------------------------------------------------
// Node Types for reactflow
// ---------------------------------------------------------------------------

function TriggerNode({ data, selected }: { data: any; selected: boolean }) {
    return (
        <div className={`px-4 py-3 rounded-xl border-2 ${selected ? "border-cyan-500" : "border-white/10"} bg-[#050a14] shadow-xl min-w-[200px]`}>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-500 border-2 border-[#050a14]" />
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80">Trigger</span>
            </div>
            <div className="text-sm font-bold text-white">{data.label || "When someone joins"}</div>
            <div className="text-xs text-white/50 mt-1">{data.subtitle || "All subscribers"}</div>
        </div>
    );
}

function EmailNode({ data, selected }: { data: any; selected: boolean }) {
    return (
        <div className={`px-4 py-3 rounded-xl border-2 ${selected ? "border-purple-500" : "border-white/10"} bg-[#050a14] shadow-xl min-w-[200px]`}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500 border-2 border-[#050a14]" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500 border-2 border-[#050a14]" />
            <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Mail className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400/80">Send Email</span>
            </div>
            <div className="text-sm font-bold text-white">{data.label || "Welcome to the Brand"}</div>
            <div className="text-xs text-white/50 mt-1">{data.stats || "Opens: -- | Clicks: --"}</div>
        </div>
    );
}

function DelayNode({ data, selected }: { data: any; selected: boolean }) {
    return (
        <div className={`px-4 py-3 rounded-xl border-2 ${selected ? "border-orange-500" : "border-white/10"} bg-[#050a14] shadow-xl min-w-[200px]`}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500 border-2 border-[#050a14]" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500 border-2 border-[#050a14]" />
            <div className="flex items-center gap-2 mb-2 text-orange-400">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400/80">Time Delay</span>
            </div>
            <div className="text-sm font-bold text-white">{data.label || "Wait 1 day"}</div>
        </div>
    );
}

function ConditionNode({ data, selected }: { data: any; selected: boolean }) {
    return (
        <div className={`px-4 py-3 rounded-xl border-2 ${selected ? "border-green-500" : "border-white/10"} bg-[#050a14] shadow-xl min-w-[200px]`}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500 border-2 border-[#050a14]" />
            <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '25%' }} className="w-3 h-3 bg-green-500 border-2 border-[#050a14]" />
            <Handle type="source" position={Position.Bottom} id="no" style={{ left: '75%' }} className="w-3 h-3 bg-red-500 border-2 border-[#050a14]" />

            <div className="flex items-center gap-2 mb-2 text-green-400">
                <SplitSquareHorizontal className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400/80">Condition</span>
            </div>
            <div className="text-sm font-bold text-white">{data.label || "Did they purchase?"}</div>
            <div className="flex justify-between mt-2 text-[10px] font-bold">
                <span className="text-green-400">YES</span>
                <span className="text-red-400">NO</span>
            </div>
        </div>
    );
}

const nodeTypes = {
    trigger: TriggerNode,
    email: EmailNode,
    delay: DelayNode,
    condition: ConditionNode,
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AutomationsBuilder() {
    const [automationId, setAutomationId] = useState<string | null>(null);
    const [automationName, setAutomationName] = useState("New Automation");
    const [automationStatus, setAutomationStatus] = useState("draft");
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [campaigns, setCampaigns] = useState<{ id: string, name: string }[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [automationList, setAutomationList] = useState<{ id: string; name: string; status: string; updatedAt: string }[]>([]);

    // Load campaigns and existing automations
    useEffect(() => {
        Promise.all([
            fetch("/api/campaigns").then((r) => r.json()),
            fetch("/api/automations").then((r) => r.json()),
        ]).then(([campData, autoData]) => {
            if (campData.ok) setCampaigns(campData.campaigns ?? []);
            if (autoData.ok) setAutomationList(autoData.automations ?? []);
        }).catch(() => {});
    }, []);

    // Load a specific automation
    async function loadAutomation(id: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/automations/${id}`);
            const data = await res.json() as { ok: boolean; automation?: { id: string; name: string; status: string; nodes: Node[]; edges: Edge[] } };
            if (data.ok && data.automation) {
                setAutomationId(data.automation.id);
                setAutomationName(data.automation.name);
                setAutomationStatus(data.automation.status);
                setNodes(data.automation.nodes ?? []);
                setEdges(data.automation.edges ?? []);
            }
        } catch {
            // non-fatal
        } finally {
            setLoading(false);
        }
    }

    // Save automation
    async function handleSave() {
        setSaving(true);
        setSaved(false);
        try {
            if (automationId) {
                await fetch(`/api/automations/${automationId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: automationName, nodes, edges }),
                });
            } else {
                const res = await fetch("/api/automations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: automationName,
                        campaignId: selectedCampaignId || undefined,
                        trigger: "manual",
                        nodes,
                        edges,
                    }),
                });
                const data = await res.json() as { ok: boolean; automation?: { id: string } };
                if (data.ok && data.automation) {
                    setAutomationId(data.automation.id);
                }
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            // non-fatal
        } finally {
            setSaving(false);
        }
    }

    // Publish (activate) automation
    async function handlePublish() {
        if (!automationId) {
            await handleSave();
        }
        if (automationId) {
            await fetch(`/api/automations/${automationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "active", nodes, edges }),
            });
            setAutomationStatus("active");
        }
    }

    async function handleAutoGenerate() {
        if (!selectedCampaignId) return;
        setLoading(true);
        try {
            // Fetch campaign data to build a contextual flow
            const res = await fetch(`/api/campaigns/${selectedCampaignId}`);
            const data = await res.json() as { ok: boolean; campaign?: { name: string; productName?: string; mode: string } };
            const campaign = data.campaign;
            const productLabel = campaign?.productName || campaign?.name || "your product";

            const generatedNodes: Node[] = [
                { id: "t1", type: "trigger", data: { label: "New Subscriber", subtitle: `Joins ${productLabel} list` }, position: { x: 250, y: 50 } },
                { id: "d1", type: "delay", data: { label: "Wait 5 minutes" }, position: { x: 250, y: 200 } },
                { id: "e1", type: "email", data: { label: `Welcome to ${productLabel}`, stats: "Welcome email with key benefits" }, position: { x: 250, y: 350 } },
                { id: "d2", type: "delay", data: { label: "Wait 1 day" }, position: { x: 250, y: 500 } },
                { id: "e2", type: "email", data: { label: "The #1 mistake to avoid", stats: "Education + authority building" }, position: { x: 250, y: 650 } },
                { id: "d3", type: "delay", data: { label: "Wait 2 days" }, position: { x: 250, y: 800 } },
                { id: "c1", type: "condition", data: { label: "Opened previous email?" }, position: { x: 250, y: 950 } },
                { id: "e3", type: "email", data: { label: "Special offer inside", stats: "Conversion email with urgency" }, position: { x: 100, y: 1100 } },
                { id: "e4", type: "email", data: { label: "Re-engagement nudge", stats: "Softer approach for cold leads" }, position: { x: 400, y: 1100 } },
            ];
            const generatedEdges: Edge[] = [
                { id: "e-t1-d1", source: "t1", target: "d1", animated: true, style: { stroke: "#06b6d4" } },
                { id: "e-d1-e1", source: "d1", target: "e1", animated: true, style: { stroke: "#8b5cf6" } },
                { id: "e-e1-d2", source: "e1", target: "d2", animated: true, style: { stroke: "#06b6d4" } },
                { id: "e-d2-e2", source: "d2", target: "e2", animated: true, style: { stroke: "#8b5cf6" } },
                { id: "e-e2-d3", source: "e2", target: "d3", animated: true, style: { stroke: "#06b6d4" } },
                { id: "e-d3-c1", source: "d3", target: "c1", animated: true, style: { stroke: "#10b981" } },
                { id: "e-c1-e3", source: "c1", target: "e3", animated: true, style: { stroke: "#8b5cf6" }, label: "Yes" },
                { id: "e-c1-e4", source: "c1", target: "e4", animated: true, style: { stroke: "#f59e0b" }, label: "No" },
            ];

            setNodes(generatedNodes);
            setEdges(generatedEdges);
            setAutomationName(`${productLabel} — Automated Flow`);
        } catch {
            // non-fatal
        } finally {
            setLoading(false);
        }
    }

    // Default starter nodes
    useEffect(() => {
        setNodes([
            { id: "1", type: "trigger", data: { label: "New Subscriber", subtitle: "When someone joins your list" }, position: { x: 250, y: 50 } },
            { id: "2", type: "delay", data: { label: "Wait 5 minutes" }, position: { x: 250, y: 200 } },
            { id: "3", type: "email", data: { label: "Welcome Email", stats: "Draft — click to edit" }, position: { x: 250, y: 350 } },
        ]);
        setEdges([
            { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#06b6d4" } },
            { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#8b5cf6" } },
        ]);
        setLoading(false);
    }, []);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#fff", opacity: 0.5 } }, eds)),
        []
    );

    function addNode(type: "email" | "delay" | "condition") {
        const yOffset = nodes.length > 0 ? Math.max(...nodes.map(n => n.position.y)) + 150 : 50;
        const newNode: Node = {
            id: Math.random().toString(36).slice(2, 9),
            type,
            position: { x: 250, y: yOffset },
            data: {
                label: type === "email" ? "New Email" : type === "delay" ? "Wait 1 Day" : "Condition?",
            },
        };
        setNodes([...nodes, newNode]);
    }

    return (
        <div className="h-screen bg-[#020509] flex flex-col font-sans">
            {/* Header */}
            <header className="h-14 shrink-0 bg-[#050a14] border-b border-white/[0.08] flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <a href="/campaigns" className="flex items-center gap-1.5 text-white/40 hover:text-white transition group">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold hidden sm:block">Back</span>
                    </a>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <input
                        value={automationName}
                        onChange={(e) => setAutomationName(e.target.value)}
                        className="text-base font-black text-white bg-transparent border-none outline-none max-w-[250px] truncate hover:text-cyan-300 focus:text-cyan-300 transition"
                    />
                    <span className={`px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${
                        automationStatus === "active"
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-white/5 border-white/10 text-white/50"
                    }`}>
                        {automationStatus}
                    </span>
                    {saved && <span className="text-[10px] text-emerald-400 font-bold">Saved!</span>}
                </div>

                <div className="flex flex-1 items-center justify-center">
                    {automationList.length > 0 && (
                        <select
                            onChange={(e) => { if (e.target.value) void loadAutomation(e.target.value); }}
                            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/50 outline-none"
                        >
                            <option value="">Load saved automation...</option>
                            {automationList.map(a => (
                                <option key={a.id} value={a.id} className="bg-[#0d1525]">{a.name} ({a.status})</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/10 transition border border-white/[0.08] disabled:opacity-40"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                    </button>
                    <button
                        onClick={() => void handlePublish()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 transition"
                    >
                        <Play className="w-3.5 h-3.5" />
                        {automationStatus === "active" ? "Published" : "Save & Publish"}
                    </button>
                </div>
            </header>

            {/* Main Builder Interface */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <aside className="w-64 shrink-0 bg-[#050a14] border-r border-white/[0.08] flex flex-col pt-4">
                    <div className="px-4 pb-2">
                        <h2 className="text-[10px] font-black tracking-widest uppercase text-white/30">Add Node</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 space-y-2">

                        <button
                            onClick={() => addNode("email")}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-purple-500/50 hover:bg-purple-500/5 transition group text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white/80 group-hover:text-white transition">Send Email</p>
                                <p className="text-[10px] text-white/40">Trigger an email message</p>
                            </div>
                        </button>

                        <button
                            onClick={() => addNode("delay")}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-orange-500/50 hover:bg-orange-500/5 transition group text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white/80 group-hover:text-white transition">Time Delay</p>
                                <p className="text-[10px] text-white/40">Wait before next step</p>
                            </div>
                        </button>

                        <button
                            onClick={() => addNode("condition")}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-green-500/50 hover:bg-green-500/5 transition group text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition">
                                <SplitSquareHorizontal className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white/80 group-hover:text-white transition">Condition</p>
                                <p className="text-[10px] text-white/40">Split flow based on activity</p>
                            </div>
                        </button>
                    </div>

                    {campaigns.length > 0 && (
                        <div className="mt-auto p-4 border-t border-white/[0.08] bg-[#020509]">
                            <div className="flex items-center gap-1.5 mb-3 text-cyan-400">
                                <Sparkles className="w-4 h-4" />
                                <h2 className="text-[10px] font-black tracking-widest uppercase">Auto-Generate</h2>
                            </div>
                            <select
                                value={selectedCampaignId}
                                onChange={(e) => setSelectedCampaignId(e.target.value)}
                                className="w-full mb-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs font-semibold text-cyan-100 outline-none focus:border-cyan-400 transition"
                            >
                                <option value="">Select AI Campaign</option>
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAutoGenerate}
                                disabled={!selectedCampaignId || loading}
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-[#050a14] text-xs font-black disabled:opacity-50 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                            >
                                GENERATE FLOW
                            </button>
                            <p className="text-[9px] text-white/30 text-center mt-2 leading-tight">
                                This will rebuild the entire automation with emails tailored to your product.
                            </p>
                        </div>
                    )}
                </aside>

                {/* Canvas area */}
                <main className="flex-1 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                        </div>
                    ) : (
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                            className="bg-[#020509]"
                        >
                            <Background color="#ffffff" gap={16} size={1} style={{ opacity: 0.05 }} />
                            <Controls className="fill-white" />
                        </ReactFlow>
                    )}
                </main>
            </div>
        </div>
    );
}
