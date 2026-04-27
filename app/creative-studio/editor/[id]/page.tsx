"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import {
  ArrowLeft, Download, Share2, Undo2, Redo2, ZoomIn, ZoomOut,
  Type, Image as ImageIcon, Square, Circle, Sparkles, Layers,
  Palette, Upload, Trash2, Copy, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Save, Eye, Wand2, FileDown, FileImage,
} from "lucide-react";

type Layer = {
  id: string;
  type: "text" | "image" | "shape";
  content?: string;
  src?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  opacity: number;
};

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [layers, setLayers] = useState<Layer[]>([
    {
      id: "1",
      type: "text",
      content: "Your Headline Here",
      x: 50,
      y: 100,
      width: 400,
      height: 60,
      rotation: 0,
      color: "#ffffff",
      fontSize: 48,
      fontWeight: "bold",
      textAlign: "left",
      opacity: 1,
    },
    {
      id: "2",
      type: "text",
      content: "Subheadline goes here",
      x: 50,
      y: 180,
      width: 350,
      height: 30,
      rotation: 0,
      color: "#f5a623",
      fontSize: 24,
      fontWeight: "normal",
      textAlign: "left",
      opacity: 1,
    },
  ]);

  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<"design" | "text" | "elements" | "uploads">("design");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTextLayer = () => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: "text",
      content: "New Text",
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      rotation: 0,
      color: "#ffffff",
      fontSize: 32,
      fontWeight: "normal",
      textAlign: "left",
      opacity: 1,
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const addShapeLayer = (shapeType: "rectangle" | "circle") => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: "shape",
      content: shapeType,
      x: 150,
      y: 150,
      width: 200,
      height: 200,
      rotation: 0,
      color: "#f5a623",
      opacity: 1,
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map(layer => layer.id === id ? { ...layer, ...updates } : layer));
  };

  const deleteLayer = (id: string) => {
    setLayers(layers.filter(layer => layer.id !== id));
    if (selectedLayer === id) setSelectedLayer(null);
  };

  const duplicateLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer) {
      const newLayer = { ...layer, id: Date.now().toString(), x: layer.x + 20, y: layer.y + 20 };
      setLayers([...layers, newLayer]);
      setSelectedLayer(newLayer.id);
    }
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newLayer: Layer = {
        id: Date.now().toString(),
        type: "image",
        src: url,
        x: 100,
        y: 100,
        width: 400,
        height: 400,
        rotation: 0,
        opacity: 1,
      };
      setLayers([...layers, newLayer]);
      setSelectedLayer(newLayer.id);
    }
  };

  // Export Functions
  const exportAsImage = async (format: "png" | "jpg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const canvasImage = await html2canvas(canvas, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `design-${Date.now()}.${format}`;
      link.href = canvasImage.toDataURL(`image/${format === "jpg" ? "jpeg" : "png"}`);
      link.click();
      setShowExportMenu(false);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    if (e.button !== 0) return;
    setSelectedLayer(layerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedLayer) return;

    const dx = (e.clientX - dragStart.x) / (zoom / 100);
    const dy = (e.clientY - dragStart.y) / (zoom / 100);

    setLayers(layers => layers.map(layer =>
      layer.id === selectedLayer
        ? { ...layer, x: layer.x + dx, y: layer.y + dy }
        : layer
    ));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, selectedLayer, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global mouse listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove as any);
      window.addEventListener("mouseup", handleMouseUp as any);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove as any);
        window.removeEventListener("mouseup", handleMouseUp as any);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 bg-[#0c0a08] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-sm font-bold text-white">Untitled Design</h1>
          <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            AUTO-SAVED
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition">
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-white/10 mx-2" />

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className="p-1 hover:bg-white/10 rounded transition"
            >
              <ZoomOut className="w-4 h-4 text-white/70" />
            </button>
            <span className="text-xs text-white/70 font-semibold min-w-[3rem] text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-1 hover:bg-white/10 rounded transition"
            >
              <ZoomIn className="w-4 h-4 text-white/70" />
            </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />

          <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition text-sm font-semibold flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition text-sm font-semibold flex items-center gap-1.5">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-white/20 bg-[#0c0a08] shadow-2xl overflow-hidden z-50">
                <button
                  onClick={() => exportAsImage("png")}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  Export as PNG
                </button>
                <button
                  onClick={() => exportAsImage("jpg")}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  Export as JPG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-20 bg-[#0c0a08] border-r border-white/10 flex flex-col items-center py-4 gap-2 shrink-0">
          <ToolButton
            icon={Palette}
            label="Design"
            active={activeTab === "design"}
            onClick={() => setActiveTab("design")}
          />
          <ToolButton
            icon={Type}
            label="Text"
            active={activeTab === "text"}
            onClick={() => setActiveTab("text")}
          />
          <ToolButton
            icon={Square}
            label="Elements"
            active={activeTab === "elements"}
            onClick={() => setActiveTab("elements")}
          />
          <ToolButton
            icon={Upload}
            label="Uploads"
            active={activeTab === "uploads"}
            onClick={() => setActiveTab("uploads")}
          />
          <div className="flex-1" />
          <ToolButton
            icon={Wand2}
            label="AI Generate"
            onClick={() => {}}
            highlight
          />
        </div>

        {/* Properties Sidebar */}
        <div className="w-72 bg-[#0c0a08] border-r border-white/10 overflow-y-auto shrink-0">
          <div className="p-4">
            {activeTab === "design" && (
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Design</h3>
                <div className="space-y-3">
                  <button className="w-full p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left">
                    <p className="text-sm font-semibold text-white mb-1">Background</p>
                    <p className="text-xs text-white/40">Change canvas background</p>
                  </button>
                  <button className="w-full p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left">
                    <p className="text-sm font-semibold text-white mb-1">Resize</p>
                    <p className="text-xs text-white/40">1080 x 1080 px (Square)</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "text" && (
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Add Text</h3>
                <div className="space-y-2">
                  <button
                    onClick={addTextLayer}
                    className="w-full p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left"
                  >
                    <p className="text-2xl font-bold text-white mb-1">Add a heading</p>
                  </button>
                  <button
                    onClick={addTextLayer}
                    className="w-full p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left"
                  >
                    <p className="text-lg text-white mb-1">Add a subheading</p>
                  </button>
                  <button
                    onClick={addTextLayer}
                    className="w-full p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left"
                  >
                    <p className="text-sm text-white/70 mb-1">Add body text</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "elements" && (
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Elements</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addShapeLayer("rectangle")}
                    className="aspect-square rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
                  >
                    <Square className="w-8 h-8 text-white/50" />
                  </button>
                  <button
                    onClick={() => addShapeLayer("circle")}
                    className="aspect-square rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
                  >
                    <Circle className="w-8 h-8 text-white/50" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "uploads" && (
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Uploads</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 rounded-lg border-2 border-dashed border-white/10 hover:border-[#f5a623]/30 hover:bg-white/5 transition text-center"
                >
                  <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white/50">Click to upload image</p>
                  <p className="text-xs text-white/30 mt-1">PNG, JPG up to 10MB</p>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#2a2a2a]">
          {/* Canvas Wrapper */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div
              ref={canvasRef}
              className="relative bg-white shadow-2xl"
              style={{
                width: `${1080 * (zoom / 100)}px`,
                height: `${1080 * (zoom / 100)}px`,
              }}
            >
              {/* Layers */}
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onMouseDown={(e) => handleMouseDown(e, layer.id)}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`absolute cursor-move select-none ${
                    selectedLayer === layer.id ? "ring-2 ring-[#f5a623] ring-offset-2" : ""
                  }`}
                  style={{
                    left: `${layer.x * (zoom / 100)}px`,
                    top: `${layer.y * (zoom / 100)}px`,
                    width: `${layer.width * (zoom / 100)}px`,
                    height: `${layer.height * (zoom / 100)}px`,
                    transform: `rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity,
                  }}
                >
                  {layer.type === "text" && (
                    <div
                      style={{
                        color: layer.color,
                        fontSize: `${(layer.fontSize || 32) * (zoom / 100)}px`,
                        fontWeight: layer.fontWeight,
                        textAlign: layer.textAlign as any,
                        lineHeight: 1.2,
                      }}
                      className="w-full h-full flex items-center pointer-events-none"
                    >
                      {layer.content}
                    </div>
                  )}

                  {layer.type === "image" && layer.src && (
                    <img
                      src={layer.src}
                      alt="Layer"
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  )}

                  {layer.type === "shape" && (
                    <div
                      style={{
                        backgroundColor: layer.color,
                        borderRadius: layer.content === "circle" ? "50%" : "0",
                      }}
                      className="w-full h-full pointer-events-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Layer Properties */}
        {selectedLayerData && (
          <div className="w-72 bg-[#0c0a08] border-l border-white/10 overflow-y-auto shrink-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Properties</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => duplicateLayer(selectedLayerData.id)}
                    className="p-1.5 rounded hover:bg-white/10 transition"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4 text-white/50" />
                  </button>
                  <button
                    onClick={() => deleteLayer(selectedLayerData.id)}
                    className="p-1.5 rounded hover:bg-white/10 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>

              {selectedLayerData.type === "text" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Text Content</label>
                    <textarea
                      value={selectedLayerData.content}
                      onChange={(e) => updateLayer(selectedLayerData.id, { content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#f5a623]/50 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Font Size</label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={selectedLayerData.fontSize}
                      onChange={(e) => updateLayer(selectedLayerData.id, { fontSize: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-white/70 text-right mt-1">{selectedLayerData.fontSize}px</div>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Text Color</label>
                    <input
                      type="color"
                      value={selectedLayerData.color}
                      onChange={(e) => updateLayer(selectedLayerData.id, { color: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Text Align</label>
                    <div className="flex gap-2">
                      {["left", "center", "right"].map((align) => (
                        <button
                          key={align}
                          onClick={() => updateLayer(selectedLayerData.id, { textAlign: align })}
                          className={`flex-1 p-2 rounded-lg border transition ${
                            selectedLayerData.textAlign === align
                              ? "border-[#f5a623] bg-[#f5a623]/10"
                              : "border-white/10 hover:bg-white/5"
                          }`}
                        >
                          {align === "left" && <AlignLeft className="w-4 h-4 text-white/70 mx-auto" />}
                          {align === "center" && <AlignCenter className="w-4 h-4 text-white/70 mx-auto" />}
                          {align === "right" && <AlignRight className="w-4 h-4 text-white/70 mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedLayerData.type === "shape" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Fill Color</label>
                    <input
                      type="color"
                      value={selectedLayerData.color}
                      onChange={(e) => updateLayer(selectedLayerData.id, { color: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {selectedLayerData.type === "image" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 mb-1">Image Layer</p>
                    <p className="text-xs text-white/60">Use the canvas to drag and position</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/30 mb-1 block">Width</label>
                        <input
                          type="number"
                          value={Math.round(selectedLayerData.width)}
                          onChange={(e) => updateLayer(selectedLayerData.id, { width: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5a623]/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/30 mb-1 block">Height</label>
                        <input
                          type="number"
                          value={Math.round(selectedLayerData.height)}
                          onChange={(e) => updateLayer(selectedLayerData.id, { height: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5a623]/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="text-xs text-white/40 mb-2 block">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedLayerData.opacity}
                  onChange={(e) => updateLayer(selectedLayerData.id, { opacity: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-white/70 text-right mt-1">{(selectedLayerData.opacity * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  highlight,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 transition group ${
        highlight
          ? "bg-gradient-to-r from-[#f5a623] to-[#ff6b6b]"
          : active
          ? "bg-[#f5a623]/20 text-[#f5a623]"
          : "text-white/40 hover:text-white/80 hover:bg-white/5"
      }`}
      title={label}
    >
      <Icon className={`w-5 h-5 ${highlight ? "text-white" : ""}`} />
      <span className={`text-[9px] font-semibold ${highlight ? "text-white" : ""}`}>{label}</span>
    </button>
  );
}
