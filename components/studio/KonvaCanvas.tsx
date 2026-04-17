"use client";

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from "react-konva";
import type Konva from "konva";

export type StageRefType = React.RefObject<Konva.Stage | null>;

// ── Types ─────────────────────────────────────────────────────────────────────

type LayerType = "rect" | "text" | "image" | "gradient";

export type CanvasLayer = {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fill?: string;
  align?: string;
  stroke?: string;
  strokeWidth?: number;
  // rect/shape
  cornerRadius?: number;
  opacity?: number;
  // image
  src?: string;
};

export type CanvasState = {
  width: number;
  height: number;
  background: string;
  layers: CanvasLayer[];
};

interface KonvaCanvasProps {
  state: CanvasState;
  onChange: (state: CanvasState) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  scale?: number;
  stageRef?: StageRefType;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function KonvaCanvas({ state, onChange, selectedId, onSelect, scale = 1, stageRef: externalStageRef }: KonvaCanvasProps) {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef ?? internalStageRef;
  const transformerRef = useRef<Konva.Transformer>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  // Load images
  useEffect(() => {
    for (const layer of state.layers) {
      if (layer.type === "image" && layer.src && !loadedImages[layer.id]) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = layer.src;
        img.onload = () => {
          setLoadedImages(prev => ({ ...prev, [layer.id]: img }));
        };
      }
    }
  }, [state.layers, loadedImages]);

  // Attach transformer to selected node
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedId) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, state.layers]);

  function updateLayer(id: string, patch: Partial<CanvasLayer>) {
    onChange({
      ...state,
      layers: state.layers.map(l => l.id === id ? { ...l, ...patch } : l),
    });
  }

  function handleDragEnd(id: string, x: number, y: number) {
    updateLayer(id, { x, y });
  }

  function handleTransformEnd(id: string, node: Konva.Node) {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateLayer(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  }

  const bgColors = state.background.match(/#[a-fA-F0-9]{6}/g) ?? ["#0a0f1e", "#1a2040"];

  return (
    <Stage
      ref={stageRef}
      width={state.width * scale}
      height={state.height * scale}
      scaleX={scale}
      scaleY={scale}
      onClick={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      <Layer>
        {/* Background */}
        <Rect
          x={0} y={0}
          width={state.width} height={state.height}
          fill={bgColors[0]}
          onClick={() => onSelect(null)}
        />
        {/* Gradient overlay */}
        <Rect
          x={0} y={0}
          width={state.width} height={state.height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: state.width, y: state.height }}
          fillLinearGradientColorStops={[0, bgColors[0] + "ff", 1, (bgColors[1] ?? bgColors[0]) + "ff"]}
          onClick={() => onSelect(null)}
        />

        {/* Layers */}
        {state.layers.map(layer => {
          const isSelected = selectedId === layer.id;

          if (layer.type === "text") {
            return (
              <Text
                key={layer.id}
                id={layer.id}
                x={layer.x} y={layer.y}
                text={layer.text ?? ""}
                fontSize={layer.fontSize ?? 48}
                fontFamily={layer.fontFamily ?? "Inter"}
                fontStyle={layer.fontStyle ?? "bold"}
                fill={layer.fill ?? "#ffffff"}
                align={layer.align ?? "center"}
                stroke={layer.stroke}
                strokeWidth={layer.strokeWidth}
                strokeScaleEnabled={false}
                width={layer.width}
                wrap="word"
                draggable
                rotation={layer.rotation ?? 0}
                opacity={layer.opacity ?? 1}
                onClick={() => onSelect(layer.id)}
                onTap={() => onSelect(layer.id)}
                onDragEnd={e => handleDragEnd(layer.id, e.target.x(), e.target.y())}
                onTransformEnd={e => handleTransformEnd(layer.id, e.target)}
              />
            );
          }

          if (layer.type === "rect") {
            return (
              <Rect
                key={layer.id}
                id={layer.id}
                x={layer.x} y={layer.y}
                width={layer.width} height={layer.height}
                fill={layer.fill ?? "#f5a623"}
                stroke={layer.stroke}
                strokeWidth={layer.strokeWidth}
                cornerRadius={layer.cornerRadius ?? 12}
                opacity={layer.opacity ?? 1}
                rotation={layer.rotation ?? 0}
                draggable
                onClick={() => onSelect(layer.id)}
                onTap={() => onSelect(layer.id)}
                onDragEnd={e => handleDragEnd(layer.id, e.target.x(), e.target.y())}
                onTransformEnd={e => handleTransformEnd(layer.id, e.target)}
              />
            );
          }

          if (layer.type === "image" && loadedImages[layer.id]) {
            return (
              <KonvaImage
                key={layer.id}
                id={layer.id}
                x={layer.x} y={layer.y}
                width={layer.width} height={layer.height}
                image={loadedImages[layer.id]}
                opacity={layer.opacity ?? 1}
                rotation={layer.rotation ?? 0}
                draggable
                onClick={() => onSelect(layer.id)}
                onTap={() => onSelect(layer.id)}
                onDragEnd={e => handleDragEnd(layer.id, e.target.x(), e.target.y())}
                onTransformEnd={e => handleTransformEnd(layer.id, e.target)}
              />
            );
          }

          return null;
        })}

        <Transformer
          ref={transformerRef}
          rotateEnabled
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) return oldBox;
            return newBox;
          }}
          anchorStroke="#f5a623"
          borderStroke="#f5a623"
          anchorFill="#f5a623"
          anchorSize={8}
        />
      </Layer>
    </Stage>
  );
}

// ── Export helper (call from parent) ─────────────────────────────────────────

export function exportCanvasToBlob(stageRef: React.RefObject<Konva.Stage | null>, pixelRatio = 2): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!stageRef.current) { resolve(null); return; }
    stageRef.current.toBlob({ pixelRatio, callback: (blob) => resolve(blob) });
  });
}
