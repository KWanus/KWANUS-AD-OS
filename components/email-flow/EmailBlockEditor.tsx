"use client";

import { useState } from "react";
import {
  Type, Image, MousePointer, Minus, List, Quote,
  Plus, Trash2, ChevronUp, ChevronDown, Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Block types
// ---------------------------------------------------------------------------

export type EmailBlock =
  | { type: "text"; content: string }
  | { type: "heading"; content: string; level: 1 | 2 | 3 }
  | { type: "button"; text: string; url: string; color: string }
  | { type: "image"; src: string; alt: string }
  | { type: "divider" }
  | { type: "list"; items: string[] }
  | { type: "quote"; content: string; author?: string };

const BLOCK_TEMPLATES: { type: EmailBlock["type"]; label: string; icon: React.ElementType; default: EmailBlock }[] = [
  { type: "text", label: "Text", icon: Type, default: { type: "text", content: "Write your message here..." } },
  { type: "heading", label: "Heading", icon: Type, default: { type: "heading", content: "Your Heading", level: 2 } },
  { type: "button", label: "Button", icon: MousePointer, default: { type: "button", text: "Click Here", url: "https://", color: "#f5a623" } },
  { type: "image", label: "Image", icon: Image, default: { type: "image", src: "", alt: "Image" } },
  { type: "divider", label: "Divider", icon: Minus, default: { type: "divider" } },
  { type: "list", label: "List", icon: List, default: { type: "list", items: ["Item 1", "Item 2", "Item 3"] } },
  { type: "quote", label: "Quote", icon: Quote, default: { type: "quote", content: "A testimonial or quote", author: "Name" } },
];

// ---------------------------------------------------------------------------
// Block renderer (for editing)
// ---------------------------------------------------------------------------

function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  block: EmailBlock;
  onChange: (b: EmailBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.12] transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold text-white/20 uppercase">{block.type}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onMoveUp} disabled={isFirst} className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
          <button onClick={onMoveDown} disabled={isLast} className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
          <button onClick={onDelete} className="p-0.5 text-red-400/40 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>

      {block.type === "text" && (
        <textarea
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          rows={3}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-xs text-white/60 focus:outline-none focus:border-[#f5a623]/20 resize-y"
          placeholder="Write your email text..."
        />
      )}

      {block.type === "heading" && (
        <div className="space-y-2">
          <input
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-sm font-bold text-white/70 focus:outline-none focus:border-[#f5a623]/20"
            placeholder="Heading text"
          />
          <div className="flex gap-1">
            {([1, 2, 3] as const).map((l) => (
              <button key={l} onClick={() => onChange({ ...block, level: l })} className={`px-2 py-0.5 rounded text-[10px] font-bold ${block.level === l ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-white/20 hover:text-white/40"}`}>
                H{l}
              </button>
            ))}
          </div>
        </div>
      )}

      {block.type === "button" && (
        <div className="space-y-2">
          <input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-xs text-white/60 focus:outline-none focus:border-[#f5a623]/20"
            placeholder="Button text"
          />
          <input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-xs text-white/40 focus:outline-none focus:border-[#f5a623]/20"
            placeholder="https://your-link.com"
          />
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/20">Color:</span>
            <input type="color" value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          <input
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-xs text-white/40 focus:outline-none focus:border-[#f5a623]/20"
            placeholder="Image URL (https://...)"
          />
          <input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-xs text-white/40 focus:outline-none focus:border-[#f5a623]/20"
            placeholder="Alt text"
          />
        </div>
      )}

      {block.type === "divider" && (
        <div className="h-px bg-white/[0.08] my-2" />
      )}

      {block.type === "list" && (
        <div className="space-y-1">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-1">
              <span className="text-[10px] text-white/20 mt-1.5 shrink-0">{i + 1}.</span>
              <input
                value={item}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = e.target.value;
                  onChange({ ...block, items });
                }}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 text-xs text-white/50 focus:outline-none focus:border-[#f5a623]/20"
              />
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} className="text-red-400/30 hover:text-red-400 p-0.5"><Trash2 className="w-2.5 h-2.5" /></button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, items: [...block.items, "New item"] })} className="text-[10px] text-[#f5a623]/40 hover:text-[#f5a623]/70 transition">+ Add item</button>
        </div>
      )}

      {block.type === "quote" && (
        <div className="space-y-2">
          <textarea
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            rows={2}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-xs text-white/50 italic focus:outline-none focus:border-[#f5a623]/20 resize-none"
            placeholder="Quote text..."
          />
          <input
            value={block.author ?? ""}
            onChange={(e) => onChange({ ...block, author: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-xs text-white/30 focus:outline-none focus:border-[#f5a623]/20"
            placeholder="— Author name"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main editor component
// ---------------------------------------------------------------------------

type Props = {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
};

export default function EmailBlockEditor({ blocks, onChange }: Props) {
  const [showAdd, setShowAdd] = useState(false);

  function addBlock(template: EmailBlock) {
    onChange([...blocks, { ...template }]);
    setShowAdd(false);
  }

  function updateBlock(index: number, block: EmailBlock) {
    const next = [...blocks];
    next[index] = block;
    onChange(next);
  }

  function deleteBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const next = [...blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <BlockEditor
          key={i}
          block={block}
          onChange={(b) => updateBlock(i, b)}
          onDelete={() => deleteBlock(i)}
          onMoveUp={() => moveBlock(i, -1)}
          onMoveDown={() => moveBlock(i, 1)}
          isFirst={i === 0}
          isLast={i === blocks.length - 1}
        />
      ))}

      {/* Add block */}
      {showAdd ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-[9px] font-bold text-white/20 uppercase mb-2">Add block</p>
          <div className="grid grid-cols-4 gap-1.5">
            {BLOCK_TEMPLATES.map(({ type, label, icon: Icon, default: def }) => (
              <button
                key={type}
                onClick={() => addBlock(def)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-[#f5a623]/20 hover:bg-[#f5a623]/5 transition text-center"
              >
                <Icon className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[9px] text-white/30">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(false)} className="text-[10px] text-white/20 hover:text-white/40 mt-2 transition">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-2 rounded-xl border border-dashed border-white/[0.08] text-[10px] text-white/20 hover:text-white/40 hover:border-white/[0.15] transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3 h-3" /> Add Block
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Convert blocks to HTML for sending
// ---------------------------------------------------------------------------

export function blocksToHtml(blocks: EmailBlock[]): string {
  return blocks.map((block) => {
    switch (block.type) {
      case "text":
        return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">${block.content.replace(/\n/g, "<br>")}</p>`;
      case "heading": {
        const sizes = { 1: "24px", 2: "20px", 3: "16px" };
        return `<h${block.level} style="margin:0 0 12px;font-size:${sizes[block.level]};font-weight:700;color:#1a1a1a">${block.content}</h${block.level}>`;
      }
      case "button":
        return `<div style="margin:16px 0;text-align:center"><a href="${block.url}" style="display:inline-block;background:${block.color};color:#fff;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">${block.text}</a></div>`;
      case "image":
        return block.src ? `<img src="${block.src}" alt="${block.alt}" style="max-width:100%;border-radius:8px;margin:12px 0" />` : "";
      case "divider":
        return `<hr style="border:none;border-top:1px solid #eee;margin:20px 0" />`;
      case "list":
        return `<ul style="margin:0 0 16px;padding-left:20px">${block.items.map((i) => `<li style="margin:4px 0;font-size:15px;line-height:1.7;color:#1a1a1a">${i}</li>`).join("")}</ul>`;
      case "quote":
        return `<blockquote style="margin:16px 0;padding:12px 20px;border-left:3px solid #f5a623;background:#f8f9fa;border-radius:4px"><p style="margin:0;font-style:italic;color:#333">${block.content}</p>${block.author ? `<p style="margin:8px 0 0;font-size:12px;color:#666">— ${block.author}</p>` : ""}</blockquote>`;
      default:
        return "";
    }
  }).join("\n");
}
