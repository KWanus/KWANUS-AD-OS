"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Sparkles, Mail, Clock, GitBranch, Tag, Target, Code, Layout } from "lucide-react";
import EmailBlockEditor, { type EmailBlock, blocksToHtml } from "./EmailBlockEditor";
import type { Node } from "@xyflow/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnyRecord = Record<string, unknown>;

interface NodeEditorProps {
  node: Node<AnyRecord> | null;
  flowContext?: { trigger?: string; flowName?: string; flowId?: string };
  onClose: () => void;
  onUpdate: (nodeId: string, data: AnyRecord) => void;
}

// ---------------------------------------------------------------------------
// Shared input primitives
// ---------------------------------------------------------------------------

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const cls =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-[#f5a623]/50 focus:shadow-[0_0_0_3px_rgba(245,166,35,0.08)] transition resize-none";
  if (multiline) {
    return (
      <textarea
        className={cls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    );
  }
  return (
    <input
      type="text"
      className={cls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#f5a623]/50 transition appearance-none cursor-pointer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0d1525]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Email node editor
// ---------------------------------------------------------------------------

function EmailEditor({
  data,
  onChange,
  flowContext,
}: {
  data: AnyRecord;
  onChange: (key: string, value: unknown) => void;
  flowContext?: { trigger?: string; flowName?: string; flowId?: string };
}) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  async function handleAIGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: flowContext?.trigger ?? "new_subscriber",
          flowName: flowContext?.flowName ?? "Email Flow",
          existingSubject: (data.subject as string) ?? "",
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { subject?: string; previewText?: string; body?: string };
        if (json.subject) onChange("subject", json.subject);
        if (json.previewText) onChange("previewText", json.previewText);
        if (json.body) onChange("body", json.body);
      } else {
        setGenError("AI generation unavailable right now.");
      }
    } catch {
      setGenError("Network error.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* AI button */}
      <button
        onClick={() => void handleAIGenerate()}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#e07850]/20 to-[#e07850]/20 border border-[#e07850]/30 hover:border-[#e07850]/50 text-xs font-bold text-[#f5a623] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {generating ? "Generating..." : "AI Generate Email"}
      </button>
      {genError && <p className="text-[10px] text-red-400/80">{genError}</p>}

      <button
        onClick={async () => {
          const flowId = flowContext?.flowId ?? "";
          try {
            const res = await fetch(`/api/email-flows/${flowId || "unknown"}/test`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            const result = (await res.json()) as { ok: boolean; sentTo?: string; error?: string };
            if (result.ok) {
              toast.success(`Test email sent to ${result.sentTo}`);
            } else {
              toast.error(result.error ?? "Failed to send test email");
            }
          } catch {
            toast.error("Could not send test email");
          }
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/40 hover:text-white/70 transition"
      >
        <Mail className="w-3.5 h-3.5" />
        Send Test Email
      </button>

      <div>
        <Label>Subject Line</Label>
        <TextInput
          value={(data.subject as string) ?? ""}
          onChange={(v) => onChange("subject", v)}
          placeholder="Your subject line..."
        />
      </div>

      <div>
        <Label>Preview Text</Label>
        <TextInput
          value={(data.previewText as string) ?? ""}
          onChange={(v) => onChange("previewText", v)}
          placeholder="Preview shown in inbox..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Email Body</Label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange("_editorMode", (data._editorMode as string) === "code" ? "blocks" : "code")}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold text-white/20 hover:text-white/40 transition"
            >
              {(data._editorMode as string) === "code" ? <Layout className="w-2.5 h-2.5" /> : <Code className="w-2.5 h-2.5" />}
              {(data._editorMode as string) === "code" ? "Visual" : "Code"}
            </button>
          </div>
        </div>
        {(data._editorMode as string) === "code" ? (
          <TextInput
            value={(data.body as string) ?? ""}
            onChange={(v) => onChange("body", v)}
            placeholder="Write your email content here. Markdown supported."
            multiline
            rows={8}
          />
        ) : (
          <EmailBlockEditor
            blocks={(() => {
              try {
                const parsed = JSON.parse((data._blocks as string) ?? "[]");
                return Array.isArray(parsed) ? parsed : [];
              } catch { return []; }
            })() as EmailBlock[]}
            onChange={(blocks) => {
              onChange("_blocks", JSON.stringify(blocks));
              onChange("body", blocksToHtml(blocks));
            }}
          />
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-[9px] text-white/15">Merge tags:</span>
          {["{{first_name}}", "{{last_name}}", "{{email}}"].map((tag) => (
            <button key={tag} onClick={() => {
              const body = (data.body as string) ?? "";
              onChange("body", body + " " + tag);
            }} className="text-[9px] text-[#f5a623]/30 hover:text-[#f5a623]/60 transition bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>From Name</Label>
          <TextInput
            value={(data.fromName as string) ?? ""}
            onChange={(v) => onChange("fromName", v)}
            placeholder="Your Name"
          />
        </div>
        <div>
          <Label>From Email</Label>
          <TextInput
            value={(data.fromEmail as string) ?? ""}
            onChange={(v) => onChange("fromEmail", v)}
            placeholder="you@domain.com"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wait node editor
// ---------------------------------------------------------------------------

function WaitEditor({
  data,
  onChange,
}: {
  data: AnyRecord;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Duration</Label>
          <input
            type="number"
            min={1}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#f5a623]/50 transition"
            value={(data.duration as number) ?? 1}
            onChange={(e) => onChange("duration", parseInt(e.target.value, 10) || 1)}
          />
        </div>
        <div>
          <Label>Unit</Label>
          <SelectInput
            value={(data.unit as string) ?? "days"}
            onChange={(v) => onChange("unit", v)}
            options={[
              { value: "hours", label: "Hours" },
              { value: "days", label: "Days" },
              { value: "weeks", label: "Weeks" },
            ]}
          />
        </div>
      </div>

      <div>
        <Label>Send at specific time (optional)</Label>
        <input
          type="time"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#f5a623]/50 transition"
          value={(data.sendAtTime as string) ?? ""}
          onChange={(e) => onChange("sendAtTime", e.target.value)}
        />
        <p className="text-[10px] text-white/25 mt-1.5">Leave blank to send immediately after wait</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Condition node editor
// ---------------------------------------------------------------------------

function ConditionEditor({
  data,
  onChange,
}: {
  data: AnyRecord;
  onChange: (key: string, value: unknown) => void;
}) {
  const condType = (data.conditionType as string) ?? "opened_email";

  return (
    <div className="space-y-4">
      <div>
        <Label>Condition Type</Label>
        <SelectInput
          value={condType}
          onChange={(v) => onChange("conditionType", v)}
          options={[
            { value: "opened_email", label: "Opened Previous Email" },
            { value: "clicked_link", label: "Clicked a Link" },
            { value: "has_tag", label: "Has Tag" },
            { value: "property_equals", label: "Property Equals" },
          ]}
        />
      </div>

      {(condType === "has_tag" || condType === "property_equals" || condType === "clicked_link") && (
        <div>
          <Label>
            {condType === "has_tag" ? "Tag Name" : condType === "property_equals" ? "Property Value" : "Link URL (partial match)"}
          </Label>
          <TextInput
            value={(data.conditionValue as string) ?? ""}
            onChange={(v) => onChange("conditionValue", v)}
            placeholder={condType === "has_tag" ? "e.g. buyer" : condType === "property_equals" ? "e.g. plan=pro" : "e.g. /checkout"}
          />
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Branches</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <p className="text-xs text-white/50">YES — right output handle → condition met</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <p className="text-xs text-white/50">NO — left output handle → condition not met</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag node editor
// ---------------------------------------------------------------------------

function TagEditor({
  data,
  onChange,
}: {
  data: AnyRecord;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Action</Label>
        <SelectInput
          value={(data.action as string) ?? "add"}
          onChange={(v) => onChange("action", v)}
          options={[
            { value: "add", label: "Add Tag" },
            { value: "remove", label: "Remove Tag" },
          ]}
        />
      </div>
      <div>
        <Label>Tag Name</Label>
        <TextInput
          value={(data.tagName as string) ?? ""}
          onChange={(v) => onChange("tagName", v)}
          placeholder="e.g. buyer, vip, churned"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goal node editor
// ---------------------------------------------------------------------------

function GoalEditor({
  data,
  onChange,
}: {
  data: AnyRecord;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Goal Name</Label>
        <TextInput
          value={(data.goalName as string) ?? ""}
          onChange={(v) => onChange("goalName", v)}
          placeholder="e.g. First Purchase"
        />
      </div>
      <div>
        <Label>Success Metric</Label>
        <SelectInput
          value={(data.metric as string) ?? "purchase"}
          onChange={(v) => onChange("metric", v)}
          options={[
            { value: "purchase", label: "Made a purchase" },
            { value: "revenue", label: "Revenue target" },
            { value: "clicked", label: "Clicked link" },
            { value: "opened", label: "Opened email" },
            { value: "tag", label: "Got a tag" },
          ]}
        />
      </div>
      {(data.metric === "revenue" || !data.metric) && (
        <div>
          <Label>Target Value</Label>
          <input
            type="number"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#f5a623]/50 transition"
            value={(data.value as number) ?? ""}
            onChange={(e) => onChange("value", parseFloat(e.target.value) || 0)}
            placeholder="e.g. 100"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NODE TYPE META
// ---------------------------------------------------------------------------

const NODE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  trigger: {
    label: "Trigger",
    color: "text-[#f5a623]",
    icon: <Mail className="w-4 h-4 text-[#f5a623]" />,
  },
  email: {
    label: "Email",
    color: "text-[#e07850]",
    icon: <Mail className="w-4 h-4 text-[#e07850]" />,
  },
  wait: {
    label: "Wait",
    color: "text-amber-400",
    icon: <Clock className="w-4 h-4 text-amber-400" />,
  },
  condition: {
    label: "Condition",
    color: "text-orange-400",
    icon: <GitBranch className="w-4 h-4 text-orange-400" />,
  },
  tag: {
    label: "Tag",
    color: "text-emerald-400",
    icon: <Tag className="w-4 h-4 text-emerald-400" />,
  },
  goal: {
    label: "Goal",
    color: "text-yellow-400",
    icon: <Target className="w-4 h-4 text-yellow-400" />,
  },
};

// ---------------------------------------------------------------------------
// Main NodeEditor panel
// ---------------------------------------------------------------------------

export default function NodeEditor({ node, flowContext, onClose, onUpdate }: NodeEditorProps) {
  if (!node) return null;

  const nodeType = node.type ?? "email";
  const meta = NODE_META[nodeType] ?? NODE_META.email;

  function handleChange(key: string, value: unknown) {
    onUpdate(node!.id, { ...node!.data, [key]: value });
  }

  return (
    <div
      className="h-full flex flex-col bg-[#080f1e] border-l border-white/[0.07]"
      style={{ width: 320 }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            {meta.icon}
          </div>
          <div>
            <p className="text-xs font-black text-white leading-tight">{meta.label} Properties</p>
            <p className="text-[10px] text-white/25 font-mono">{node.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-white/30 hover:text-white transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {nodeType === "email" && (
          <EmailEditor data={node.data} onChange={handleChange} flowContext={flowContext} />
        )}
        {nodeType === "wait" && (
          <WaitEditor data={node.data} onChange={handleChange} />
        )}
        {nodeType === "condition" && (
          <ConditionEditor data={node.data} onChange={handleChange} />
        )}
        {nodeType === "tag" && (
          <TagEditor data={node.data} onChange={handleChange} />
        )}
        {nodeType === "goal" && (
          <GoalEditor data={node.data} onChange={handleChange} />
        )}
        {nodeType === "trigger" && (
          <div className="rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/5 p-4">
            <p className="text-xs text-[#f5a623]/70 font-medium">
              The trigger is set when creating the flow and cannot be changed here. Use Flow Settings in the sidebar to update trigger configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
