"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Wand2, Eye, Code, Smartphone, Monitor, Undo2, Redo2,
  Save, Upload, Download, Zap, Copy, Check, RefreshCw, Settings,
  X, ChevronRight, Palette, Type, Layout, Image as ImageIcon,
  MousePointer2, Lock, Unlock, ExternalLink,
} from "lucide-react";
import { BlockLibraryBrowser } from "./BlockLibraryBrowser";
import { DesignQualityDashboard, calculateDesignScores, type DesignQualityScores } from "./DesignQualityDashboard";
import type { BlockTemplate } from "@/lib/sites/blockLibrary";

type Block = {
  id: string;
  type: string;
  props: Record<string, any>;
};

type InlineEditorProps = {
  siteId: string;
  blocks: Block[];
  theme: {
    primaryColor?: string;
    mode?: "light" | "dark";
  };
  onSave: (blocks: Block[]) => Promise<void>;
  onPublish?: () => Promise<void>;
};

export function InlineEditor({ siteId, blocks: initialBlocks, theme, onSave, onPublish }: InlineEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [history, setHistory] = useState<Block[][]>([initialBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showQuality, setShowQuality] = useState(true);
  const [qualityScores, setQualityScores] = useState<DesignQualityScores>(
    calculateDesignScores({ blocks: initialBlocks, theme })
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Auto-save every 3 seconds
  useEffect(() => {
    const timer = setInterval(async () => {
      if (blocks !== history[historyIndex]) {
        await handleSave();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [blocks, history, historyIndex]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(blocks);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateBlock = (blockId: string, updates: Partial<Block["props"]>) => {
    const newBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, props: { ...b.props, ...updates } } : b
    );
    setBlocks(newBlocks);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Recalculate quality scores
    setQualityScores(calculateDesignScores({ blocks: newBlocks, theme }));
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const newBlock = {
      ...block,
      id: `${block.type}-${Date.now()}`,
      props: { ...block.props }
    };
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    const newBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      newBlock,
      ...blocks.slice(blockIndex + 1)
    ];
    setBlocks(newBlocks);
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    setSelectedBlockId(null);
  };

  const addBlockFromTemplate = (template: BlockTemplate) => {
    const newBlock: Block = {
      id: `${template.id}-${Date.now()}`,
      type: template.category,
      props: template.props,
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Recalculate quality scores
    setQualityScores(calculateDesignScores({ blocks: newBlocks, theme }));
  };

  return (
    <div className="fixed inset-0 bg-[#0c0a08] flex">
      {/* Left Sidebar - Block Tree */}
      <aside className="w-[280px] border-r border-white/10 flex flex-col bg-gradient-to-b from-[#0c0a08] via-[#0c0a08] to-violet-950/5">
        <div className="p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <h2 className="text-sm font-black text-white mb-1 flex items-center gap-2">
            <Layout className="w-4 h-4 text-violet-400" />
            Page Structure
          </h2>
          <p className="text-[10px] text-t-text-faint">Click any block to edit</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {blocks.map((block, idx) => (
            <button
              key={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all group ${
                selectedBlockId === block.id
                  ? "bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 border border-[#f5a623]/30 shadow-[0_0_20px_rgba(245,166,35,0.1)]"
                  : "border border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{block.type}</span>
                <span className="text-[9px] text-t-text-faint">#{idx + 1}</span>
              </div>
              <p className="text-[10px] text-t-text-faint truncate">
                {block.props.headline || block.props.title || block.props.text || "Block"}
              </p>
            </button>
          ))}
        </div>

        {/* Add Block Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setShowLibrary(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-sm font-bold text-white hover:shadow-[0_10px_40px_rgba(139,92,246,0.3)] hover:scale-105 transition-all">
            <Sparkles className="w-4 h-4" />
            Add Section
          </button>
        </div>

        {/* Design Quality Score */}
        {showQuality && (
          <div className="p-3 border-t border-white/10 max-h-[50vh] overflow-y-auto">
            <DesignQualityDashboard
              siteId={siteId}
              scores={qualityScores}
              onRefresh={() => {
                setQualityScores(calculateDesignScores({ blocks, theme }));
              }}
            />
          </div>
        )}
      </aside>

      {/* Block Library Modal */}
      {showLibrary && (
        <BlockLibraryBrowser
          onSelectBlock={addBlockFromTemplate}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {/* Center - Live Preview */}
      <main className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-6">
          {/* Left - Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setMode("edit")}
                className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                  mode === "edit"
                    ? "bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 text-[#f5a623] border-r border-[#f5a623]/30"
                    : "text-t-text-faint hover:text-white"
                }`}
              >
                <MousePointer2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                  mode === "preview"
                    ? "bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 text-[#f5a623]"
                    : "text-t-text-faint hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>

            {/* Device Toggle */}
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setDevice("desktop")}
                className={`px-3 py-2 transition ${
                  device === "desktop" ? "bg-white/[0.05] text-[#f5a623]" : "text-t-text-faint hover:text-white"
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={`px-3 py-2 transition ${
                  device === "mobile" ? "bg-white/[0.05] text-[#f5a623]" : "text-t-text-faint hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center - History Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4 text-white" />
            </button>

            <div className="h-6 w-px bg-white/10 mx-2" />

            <button
              onClick={() => setLocked(!locked)}
              className="p-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition"
            >
              {locked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Right - Save & Publish */}
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-xs text-t-text-faint flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {saved && (
              <span className="text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}

            <a
              href={`/preview/${siteId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs font-bold text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/30 transition flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Preview
            </a>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-bold text-white hover:bg-white/[0.05] transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>

            {onPublish && (
              <button
                onClick={onPublish}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-xs font-bold text-white hover:shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-105 transition flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                Publish
              </button>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-transparent to-violet-950/5 p-8">
          <div className={`mx-auto transition-all duration-300 ${
            device === "mobile" ? "max-w-[375px]" : "max-w-7xl"
          }`}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              {/* Browser Chrome */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-violet-950/20 to-transparent backdrop-blur-xl">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-500 shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                </div>
                <div className="flex-1 rounded-lg bg-white/[0.03] border border-white/10 px-4 py-2 text-xs text-white/70 font-mono truncate">
                  {`/sites/${siteId}/preview`}
                </div>
                <Eye className="w-4 h-4 text-violet-400" />
              </div>

              {/* Editable Blocks */}
              <div className="bg-white">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => mode === "edit" && !locked && setSelectedBlockId(block.id)}
                    className={`relative transition-all ${
                      mode === "edit" && !locked
                        ? "cursor-pointer hover:ring-2 hover:ring-[#f5a623]/30"
                        : ""
                    } ${
                      selectedBlockId === block.id
                        ? "ring-2 ring-[#f5a623] ring-offset-2 ring-offset-white"
                        : ""
                    }`}
                  >
                    {/* Block selection indicator */}
                    {selectedBlockId === block.id && mode === "edit" && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-[#f5a623] text-[10px] font-bold text-white shadow-lg">
                          {block.type}
                        </span>
                      </div>
                    )}

                    {/* Render block based on type */}
                    <BlockRenderer block={block} theme={theme} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Properties Panel */}
      {selectedBlock && mode === "edit" && (
        <aside className="w-[320px] border-l border-white/10 bg-gradient-to-b from-[#0c0a08] via-[#0c0a08] to-violet-950/5 flex flex-col">
          <div className="p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-400" />
                {selectedBlock.type}
              </h2>
              <p className="text-[10px] text-t-text-faint">Edit properties below</p>
            </div>
            <button
              onClick={() => setSelectedBlockId(null)}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition"
            >
              <X className="w-4 h-4 text-t-text-faint" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* AI Assistant Toggle */}
            <button
              onClick={() => setAiMode(!aiMode)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                aiMode
                  ? "bg-gradient-to-r from-violet-500/10 to-violet-600/10 border border-violet-500/30"
                  : "border border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-violet-400" />
                AI Assistant
              </span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                aiMode ? "bg-violet-500/20 text-violet-400" : "bg-white/[0.05] text-t-text-faint"
              }`}>
                {aiMode ? "ON" : "OFF"}
              </span>
            </button>

            {/* Dynamic Property Editors */}
            <PropertyEditor
              block={selectedBlock}
              onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
              aiMode={aiMode}
            />

            {/* Block Actions */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => duplicateBlock(selectedBlock.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-bold text-white hover:bg-white/[0.05] transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate Block
              </button>
              <button
                onClick={() => deleteBlock(selectedBlock.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition"
              >
                <X className="w-3.5 h-3.5" />
                Delete Block
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

// Simple block renderer (you'll expand this based on your block types)
function BlockRenderer({ block, theme }: { block: Block; theme: any }) {
  const { type, props } = block;

  if (type === "hero") {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gradient-to-br from-violet-50 to-orange-50 px-8 py-20">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-black text-gray-900 mb-6">
            {props.headline || "Your Headline Here"}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {props.subheadline || "Your subheadline goes here"}
          </p>
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#f5a623] to-orange-500 text-white font-bold text-lg hover:scale-105 transition">
            {props.cta || "Get Started"}
          </button>
        </div>
      </div>
    );
  }

  // Add more block types as needed
  return (
    <div className="p-8 bg-gray-50">
      <p className="text-sm text-gray-500">Block type: {type}</p>
    </div>
  );
}

// Property editor component
function PropertyEditor({ block, onUpdate, aiMode }: { block: Block; onUpdate: (updates: any) => void; aiMode: boolean }) {
  return (
    <div className="space-y-3">
      {Object.entries(block.props).map(([key, value]) => (
        <div key={key}>
          <label className="block text-[10px] font-bold text-t-text-faint uppercase tracking-widest mb-1.5">
            {key}
          </label>
          {typeof value === "string" ? (
            key.includes("headline") || key.includes("title") ? (
              <input
                type="text"
                value={value}
                onChange={(e) => onUpdate({ [key]: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder-t-text-faint focus:border-[#f5a623]/50 focus:outline-none transition"
              />
            ) : (
              <textarea
                value={value}
                onChange={(e) => onUpdate({ [key]: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder-t-text-faint focus:border-[#f5a623]/50 focus:outline-none transition resize-none"
              />
            )
          ) : (
            <input
              type="text"
              value={String(value)}
              onChange={(e) => onUpdate({ [key]: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder-t-text-faint focus:border-[#f5a623]/50 focus:outline-none transition"
            />
          )}
        </div>
      ))}

      {aiMode && (
        <div className="pt-3 border-t border-white/10">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-xs font-bold text-white hover:shadow-[0_10px_40px_rgba(139,92,246,0.3)] transition">
            <Sparkles className="w-3.5 h-3.5" />
            Improve with AI
          </button>
        </div>
      )}
    </div>
  );
}
