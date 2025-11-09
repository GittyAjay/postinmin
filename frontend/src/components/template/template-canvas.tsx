"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Group, Layer, Rect, Stage, Text, Image as KonvaImage, Line, Circle, Transformer } from "react-konva";
import useImage from "use-image";

import { Template, TemplatePlaceholder } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/dashboard/file-upload";
import { ColorPicker } from "@/components/dashboard/color-picker";
import { Toggle } from "@/components/ui/toggle";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { ArrowDown, ArrowUp, Copy, Lock, Unlock, Trash2 } from "lucide-react";
import type { Text as KonvaText } from "konva/lib/shapes/Text";
type EditingTextState = {
  key: string;
  value: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  color: string;
  lineHeight: number;
  align?: string;
};

interface TemplateCanvasProps {
  template: Template;
  onPlaceholderUpdate: (placeholders: TemplatePlaceholder[], options?: { recordHistory?: boolean }) => void;
  className?: string;
  scale?: number;
  interactive?: boolean;
  content?: Record<string, { text?: string; imageUrl?: string }>;
  showPlaceholderGuides?: boolean;
  onStageReady?: (stage: KonvaStage) => void;
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  onScaleChange?: (nextScale: number) => void;
}

export const TEMPLATE_DIMENSIONS = {
  square: { width: 1080, height: 1080 },
  wide: { width: 1200, height: 630 },
  story: { width: 1080, height: 1920 },
} as const;

const DEFAULT_TEXT_MAX_WIDTH = 320;
const DEFAULT_LINE_HEIGHT = 1.2;
const MIN_LINE_HEIGHT = 0.6;
const MAX_LINE_HEIGHT = 3;
const MIN_LETTER_SPACING = -10;
const MAX_LETTER_SPACING = 50;

export const TemplateCanvas = ({
  template,
  onPlaceholderUpdate,
  className,
  scale = 0.4,
  interactive = true,
  content,
  showPlaceholderGuides,
  onStageReady,
  showGrid = false,
  snapToGrid = false,
  gridSize = 20,
  onScaleChange,
}: TemplateCanvasProps) => {
  const image = useImage(template.backgroundUrl ?? "", "anonymous");
  const placeholdersRef = useRef(template.placeholders);
  const stageRef = useRef<KonvaStage | null>(null);
  const transformerRef = useRef<KonvaTransformer | null>(null);
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({});
  const [hoveredPlaceholderKey, setHoveredPlaceholderKey] = useState<string | null>(null);
  const [selectedPlaceholderKey, setSelectedPlaceholderKey] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [inlineTextOverrides, setInlineTextOverrides] = useState<Record<string, string>>({});
  const [editingText, setEditingText] = useState<EditingTextState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    placeholdersRef.current = template.placeholders;
  }, [template.placeholders]);

  useEffect(() => {
    setInlineTextOverrides((previous) => {
      const next: Record<string, string> = {};
      template.placeholders.forEach((placeholder) => {
        const sample = placeholder.sampleText;
        if (typeof sample === "string" && sample.trim().length > 0) {
          next[placeholder.key] = sample;
        }
      });

      const previousKeys = Object.keys(previous);
      const nextKeys = Object.keys(next);
      const isSame =
        previousKeys.length === nextKeys.length &&
        nextKeys.every((key) => previous[key] === next[key]);

      return isSame ? previous : next;
    });
  }, [template.placeholders]);

  const activeEditingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editingText) {
      activeEditingKeyRef.current = null;
      return;
    }

    if (!textareaRef.current) return;

    const hasKeyChanged = activeEditingKeyRef.current !== editingText.key;
    activeEditingKeyRef.current = editingText.key;

      textareaRef.current.focus();

    if (hasKeyChanged) {
      textareaRef.current.select();
    }
  }, [editingText?.key]);

  useEffect(() => {
    if (editingText && textareaRef.current) {
      const element = textareaRef.current;
      element.style.height = "auto";
      element.style.height = `${Math.max(editingText.height, element.scrollHeight)}px`;
    }
  }, [editingText]);

  const fallbackDimensions = TEMPLATE_DIMENSIONS[template.orientation] ?? TEMPLATE_DIMENSIONS.square;
  const baseWidth = template.canvasWidth ?? fallbackDimensions.width;
  const baseHeight = template.canvasHeight ?? fallbackDimensions.height;
  const normalizedScale = Math.max(0.2, Math.min(scale, 1));
  const backgroundColor = template.backgroundColor ?? "#0f172a";
  
  // The display dimensions (what the user sees)
  const displayWidth = baseWidth * normalizedScale;
  const displayHeight = baseHeight * normalizedScale;
  const frameBorderWidth = template.frameBorderWidth ?? 0;
  const frameBorderColor = template.frameBorderColor ?? "transparent";
  const frameBorderRadius = template.frameBorderRadius ?? 0;
  const guidesVisible = showPlaceholderGuides ?? interactive;

  const updatePlaceholder = (index: number, updates: Partial<TemplatePlaceholder>, options?: { recordHistory?: boolean }) => {
    if (!interactive) return;
    const next = placeholdersRef.current.map((placeholder, idx) => (idx === index ? { ...placeholder, ...updates } : placeholder));
    placeholdersRef.current = next;
    onPlaceholderUpdate(next, options);
  };

  const updatePlaceholderByKey = (
    key: string,
    updates: Partial<TemplatePlaceholder>,
    options?: { recordHistory?: boolean },
  ) => {
    if (!interactive) return;
    const next = placeholdersRef.current.map((placeholder) => (placeholder.key === key ? { ...placeholder, ...updates } : placeholder));
    placeholdersRef.current = next;
    onPlaceholderUpdate(next, options);
  };

  const registerNode = useCallback((key: string, node: Konva.Node | null) => {
    if (node) {
      nodeRefs.current[key] = node;
    } else {
      delete nodeRefs.current[key];
    }
  }, []);

  const selectedPlaceholder = useMemo(
    () => template.placeholders.find((placeholder) => placeholder.key === selectedPlaceholderKey) ?? null,
    [selectedPlaceholderKey, template.placeholders],
  );

  useEffect(() => {
    if (selectedPlaceholderKey && !selectedPlaceholder) {
      setSelectedPlaceholderKey(null);
    }
  }, [selectedPlaceholder, selectedPlaceholderKey]);

  const transformerBoundBox = useCallback(
    (oldBox: any, newBox: any) => {
      if (!selectedPlaceholder) return newBox;
      const minSize =
        selectedPlaceholder.type === "shape" && selectedPlaceholder.shape === "line" ? 4 : selectedPlaceholder.type === "text" ? 24 : 12;
      if (newBox.width < minSize || newBox.height < minSize) {
        return oldBox;
      }
      return newBox;
    },
    [selectedPlaceholder],
  );

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (!selectedPlaceholderKey) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = nodeRefs.current[selectedPlaceholderKey];
    if (!node) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes([node]);

    const defaultAnchors = ["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"];

    if (selectedPlaceholder?.type === "shape" && selectedPlaceholder.shape === "line") {
      transformer.enabledAnchors(["middle-left", "middle-right", "top-center", "bottom-center"]);
    } else if (selectedPlaceholder?.type === "text") {
      transformer.enabledAnchors(["middle-left", "middle-right", "top-left", "top-right", "bottom-left", "bottom-right"]);
    } else {
      transformer.enabledAnchors(defaultAnchors);
    }

    transformer.rotateEnabled(!selectedPlaceholder?.locked);
    if (selectedPlaceholder?.locked) {
      transformer.enabledAnchors([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedPlaceholder, selectedPlaceholderKey]);

  const handleTextEditStart = useCallback(
    (placeholder: TemplatePlaceholder, textNode: KonvaText | null) => {
      if (!interactive || placeholder.locked) return;
      if (!textNode || !stageRef.current) return;

      const stage = stageRef.current;
      const containerRect = stage.container().getBoundingClientRect();
      const rect = textNode.getClientRect();
      const scaleFactor = stage.scaleX();

      const left = containerRect.left + rect.x * scaleFactor;
      const top = containerRect.top + rect.y * scaleFactor;
      const width = Math.max(40, rect.width * scaleFactor);
      const height = Math.max(24, rect.height * scaleFactor);

      const initialValue =
        inlineTextOverrides[placeholder.key] ??
        placeholder.sampleText ??
        content?.[placeholder.key]?.text ??
        placeholder.key.toUpperCase();

      setEditingText({
        key: placeholder.key,
        value: initialValue,
        left,
        top,
        width,
        height,
        fontSize: (placeholder.fontSize ?? 28) * scaleFactor,
        fontFamily: placeholder.fontFamily ?? "Inter",
        fontWeight: placeholder.fontWeight ?? "bold",
        fontStyle: placeholder.fontStyle ?? "normal",
        color: placeholder.color ?? "#FFFFFF",
        lineHeight: placeholder.lineHeight ?? 1.2,
        align: placeholder.align ?? "left",
      });
      setSelectedPlaceholderKey(placeholder.key);
      setIsTransforming(true);
    },
    [content, inlineTextOverrides, interactive],
  );

  const handleTextEditCommit = useCallback(() => {
    if (!editingText) return;
    const normalized = editingText.value.replace(/\r\n/g, "\n");
    const trimmed = normalized.trim();

    const currentPlaceholder = placeholdersRef.current.find((item) => item.key === editingText.key);
    const defaultValue = currentPlaceholder ? currentPlaceholder.key.toUpperCase() : editingText.key.toUpperCase();
    const nextValue = trimmed.length ? normalized : defaultValue;

    setInlineTextOverrides((previous) => ({
      ...previous,
      [editingText.key]: nextValue,
    }));

    updatePlaceholderByKey(editingText.key, {
      sampleText: nextValue,
    }, { recordHistory: true });

    setEditingText(null);
    setIsTransforming(false);
  }, [editingText, updatePlaceholderByKey]);

  const handleTextEditCancel = useCallback(() => {
    setEditingText(null);
    setIsTransforming(false);
  }, []);

  return (
    <div className={cn("w-full flex items-center justify-center", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          borderRadius: `${frameBorderRadius}px`,
          border: frameBorderWidth > 0 ? `${frameBorderWidth}px solid ${frameBorderColor}` : undefined,
          boxSizing: "border-box",
          background: backgroundColor,
        }}
      >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          borderRadius: `${frameBorderRadius > frameBorderWidth ? frameBorderRadius - frameBorderWidth : 0}px`,
          overflow: frameBorderRadius > 0 ? "hidden" : "visible",
          background: backgroundColor,
        }}
      >
          <Stage
            ref={(node) => {
              stageRef.current = node;
              if (node) {
                onStageReady?.(node);
              }
            }}
          width={baseWidth}
          height={baseHeight}
          scaleX={normalizedScale}
          scaleY={normalizedScale}
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
          }}
            onMouseLeave={() => {
              if (hoveredPlaceholderKey !== null) {
                setHoveredPlaceholderKey(null);
              }
            }}
            onMouseDown={(event) => {
              const stage = event.target.getStage();
              if (!stage) return;
              const clickedOnEmpty = event.target === stage || event.target.name() === "canvas-background";
              if (clickedOnEmpty && !isTransforming) {
                setSelectedPlaceholderKey(null);
              }
            }}
            onWheel={(event) => {
              if (!interactive || editingText) return;
              event.evt.preventDefault();
              const currentScale = Math.max(0.2, Math.min(scale, 1));
              const step = 0.03;
              const delta = event.evt.deltaY;
              const next = delta < 0 ? currentScale + step : currentScale - step;
              const clamped = Math.max(0.2, Math.min(Number(next.toFixed(3)), 1));
              if (clamped === currentScale) return;
              onScaleChange?.(clamped);
            }}
          >
            <Layer>
              {image[0] ? (
                <KonvaImage name="canvas-background" image={image[0]} width={baseWidth} height={baseHeight} />
              ) : (
                <Rect name="canvas-background" width={baseWidth} height={baseHeight} fill={backgroundColor} />
              )}
            </Layer>
            {showGrid ? (
              <Layer listening={false} opacity={0.35}>
                <GridOverlay width={baseWidth} height={baseHeight} gridSize={gridSize} />
              </Layer>
            ) : null}
            <Layer>
              {[...template.placeholders]
                .slice()
                .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                .map((placeholder, sortedIndex) => {
                  const originalIndex = template.placeholders.findIndex((item) => item.key === placeholder.key);
                  return (
                <PlaceholderNode
                  key={placeholder.key}
                  placeholder={placeholder}
                  onDrag={(position, meta) =>
                    updatePlaceholder(originalIndex === -1 ? sortedIndex : originalIndex, position, meta)
                  }
                  interactive={interactive}
                  content={content?.[placeholder.key]}
                  showGuide={guidesVisible}
                  snapToGrid={snapToGrid}
                  gridSize={gridSize}
                  isHovered={hoveredPlaceholderKey === placeholder.key}
                  isSelected={selectedPlaceholderKey === placeholder.key}
                  onHoverChange={(hovered) => {
                    if (!interactive) return;
                    setHoveredPlaceholderKey(hovered ? placeholder.key : null);
                  }}
                  onSelect={() => {
                    if (!interactive) return;
                    setSelectedPlaceholderKey((current) => (current === placeholder.key ? null : placeholder.key));
                  }}
                  onTransform={(updates, meta) => updatePlaceholderByKey(placeholder.key, updates, meta)}
                  onTransformStateChange={(active) => setIsTransforming(active)}
                  inlineTextValue={interactive ? inlineTextOverrides[placeholder.key] : undefined}
                  editingTextKey={editingText?.key ?? null}
                  onTextEditStart={handleTextEditStart}
                  registerNode={registerNode}
                />
              );
                })}
            </Layer>
            <Layer>
              <Transformer
                ref={transformerRef}
                anchorSize={8}
                borderStroke="#2563eb"
                anchorStroke="#2563eb"
                anchorFill="#ffffff"
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                boundBoxFunc={transformerBoundBox}
              />
            </Layer>
          </Stage>
        </div>
      </div>
      {editingText ? (
        <textarea
          ref={textareaRef}
          value={editingText.value}
        onChange={(event) => {
          const rawValue = event.target.value;
          const normalizedValue = rawValue.replace(/\r\n/g, "\n");
          const key = editingText?.key;
          setEditingText((current) => (current ? { ...current, value: normalizedValue } : current));
          if (!key) return;
          const trimmed = normalizedValue.trim();
          updatePlaceholderByKey(key, {
            sampleText: trimmed.length ? normalizedValue : undefined,
          }, { recordHistory: false });
          setInlineTextOverrides((previous) => {
            if (!trimmed.length) {
              if (!(key in previous)) {
                return previous;
              }
              const next = { ...previous };
              delete next[key];
              return next;
            }
            if (previous[key] === normalizedValue) {
              return previous;
            }
            return { ...previous, [key]: normalizedValue };
          });
        }}
          onBlur={handleTextEditCommit}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              handleTextEditCancel();
            } else if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleTextEditCommit();
            }
          }}
        style={{
            position: "fixed",
            left: editingText.left,
            top: editingText.top,
            width: editingText.width,
            minHeight: editingText.height,
            padding: "4px",
            margin: 0,
            border: "1px solid #2563eb",
            borderRadius: "6px",
            fontSize: `${editingText.fontSize}px`,
            fontFamily: editingText.fontFamily,
            fontWeight: editingText.fontWeight?.toString(),
          fontStyle: editingText.fontStyle?.includes("italic") ? "italic" : "normal",
            lineHeight: `${editingText.lineHeight}`,
            color: editingText.color,
          textAlign: editingText.align === "center" || editingText.align === "right" ? editingText.align : "left",
            background: "rgba(15, 23, 42, 0.08)",
            resize: "none",
            outline: "none",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            zIndex: 1000,
          }}
        />
      ) : null}
    </div>
  );
};

interface TemplatePlaceholderListProps {
  template: Template;
  onChange: (index: number, updates: Partial<TemplatePlaceholder>) => void;
  filterType?: TemplatePlaceholder["type"];
  onTypeToggle?: (newType: TemplatePlaceholder["type"]) => void;
  onImageUpload?: (index: number, file: File) => Promise<string | void>;
  onDuplicate?: (index: number) => void;
  onDelete?: (index: number) => void;
  onReorder?: (index: number, direction: "up" | "down") => void;
  onLockToggle?: (index: number) => void;
  content?: Record<string, { text?: string; imageUrl?: string }>;
  onContentUpdate?: (key: string, updates: { text?: string; imageUrl?: string } | null) => void;
  onContentRename?: (previousKey: string, nextKey: string) => void;
}

export const TemplatePlaceholderList = ({
  template,
  onChange,
  filterType,
  onTypeToggle,
  onImageUpload,
  onDuplicate,
  onDelete,
  onReorder,
  onLockToggle,
  content,
  onContentUpdate,
  onContentRename,
}: TemplatePlaceholderListProps) => {
  const normalizeKey = (value: string, fallback: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  };

  const makeUniqueKey = (candidate: string, currentIndex: number) => {
    if (
      !template.placeholders.some((placeholder, index) => index !== currentIndex && placeholder.key === candidate)
    ) {
      return candidate;
    }

    let suffix = 2;
    let uniqueCandidate = `${candidate}-${suffix}`;
    while (
      template.placeholders.some((placeholder, index) => index !== currentIndex && placeholder.key === uniqueCandidate)
    ) {
      suffix += 1;
      uniqueCandidate = `${candidate}-${suffix}`;
    }
    return uniqueCandidate;
  };

  return (
    <div className="space-y-3">
      {template.placeholders.map((placeholder, index) =>
        filterType && placeholder.type !== filterType ? null : (
          <div
            key={index}
            className="template-placeholder-card rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Name
                  </label>
                  <Input
                    value={placeholder.key}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      if (!rawValue.trim()) {
                        onChange(index, { key: placeholder.key });
                        return;
                      }
                      const normalized = normalizeKey(rawValue, placeholder.key);
                      const unique = makeUniqueKey(normalized, index);
                      onChange(index, { key: unique });
                      if (unique !== placeholder.key) {
                        onContentRename?.(placeholder.key, unique);
                      }
                    }}
                    className="h-9 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                  />
                </div>
                <div className="flex items-center gap-1 pt-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => onDuplicate?.(index)}
                    title="Duplicate layer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => onReorder?.(index, "up")}
                    title="Move up"
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => onReorder?.(index, "down")}
                    title="Move down"
                    disabled={index === template.placeholders.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg border text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                      placeholder.locked
                        ? "border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400/60 dark:text-blue-300 dark:hover:bg-blue-500/15"
                        : "border-slate-200 dark:border-slate-700",
                    )}
                    onClick={() => onLockToggle?.(index)}
                    title={placeholder.locked ? "Unlock layer" : "Lock layer"}
                  >
                    {placeholder.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                    onClick={() => {
                      onContentUpdate?.(placeholder.key, null);
                      onDelete?.(index);
                    }}
                    title="Delete layer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {!filterType && (
                  <Toggle
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize shadow-sm transition-all hover:bg-slate-200 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-blue-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:data-[state=on]:bg-blue-500"
                    pressed={placeholder.type === "text"}
                    onPressedChange={(pressed) => {
                      const nextType: TemplatePlaceholder["type"] = pressed ? "text" : "image";
                      if (nextType === "text") {
                        onChange(index, {
                          type: "text",
                          fontSize: placeholder.fontSize ?? 28,
                          color: placeholder.color ?? "#ffffff",
                          maxWidth: placeholder.maxWidth ?? DEFAULT_TEXT_MAX_WIDTH,
                        });
                      } else {
                        onChange(index, {
                          type: "image",
                          width: placeholder.width ?? 220,
                          height: placeholder.height ?? 220,
                          maxWidth: undefined,
                        });
                        onContentUpdate?.(placeholder.key, null);
                      }
                      onTypeToggle?.(nextType);
                    }}
                  >
                    {placeholder.type === "text" ? "Text" : "Image"}
                  </Toggle>
                )}
                <div className="grid flex-1 min-w-[200px] grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-600 dark:text-slate-300">Position X</label>
                    <Input
                      type="number"
                      value={placeholder.x.toString()}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-blue-400/30"
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") return;
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        onChange(index, { x: value });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-600 dark:text-slate-300">Position Y</label>
                    <Input
                      type="number"
                      value={placeholder.y.toString()}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-blue-400/30"
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") return;
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        onChange(index, { y: value });
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-500">{placeholder.type}</p>
            </div>

            {/* Text Options - Only show for text type */}
            {placeholder.type === "text" && (
              <div className="space-y-3 bg-slate-50/50 px-4 py-3 dark:bg-slate-900/40">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Sample text</label>
                  <Textarea
                    value={(content?.[placeholder.key]?.text ?? placeholder.sampleText) ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      const trimmed = value.trim();
                      onChange(index, { sampleText: trimmed.length ? value : undefined });
                      onContentUpdate?.(placeholder.key, trimmed.length ? { text: value } : null);
                    }}
                    placeholder="Add default copy for this placeholder"
                    className="min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-blue-400/30"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Default copy shown before AI content fills this placeholder.
                  </p>
                </div>
                {/* Font Size and Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Font Size</label>
                    <input
                      type="number"
                      min="8"
                      max="120"
                      value={placeholder.fontSize !== undefined ? placeholder.fontSize.toString() : ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          onChange(index, { fontSize: undefined });
                          return;
                        }
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        onChange(index, { fontSize: value });
                      }}
                      onBlur={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          onChange(index, { fontSize: 28 });
                          return;
                        }
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        const clamped = Math.min(120, Math.max(8, Math.round(value)));
                        if (clamped !== value) {
                          onChange(index, { fontSize: clamped });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Color</label>
                    <ColorPicker
                      value={placeholder.color ?? "#FFFFFF"}
                      onChange={(color) => onChange(index, { color })}
                      className="w-full"
                      triggerClassName="justify-start"
                      label={null}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Max Width</label>
                  <input
                    type="number"
                    min="40"
                    max="800"
                    value={(placeholder.maxWidth ?? DEFAULT_TEXT_MAX_WIDTH).toString()}
                    onChange={(event) => {
                      const raw = event.target.value;
                      const value = Number(raw);
                      if (Number.isNaN(value)) return;
                      onChange(index, { maxWidth: value });
                    }}
                    onBlur={(event) => {
                      const raw = event.target.value;
                      if (raw === "") {
                        onChange(index, { maxWidth: DEFAULT_TEXT_MAX_WIDTH });
                        return;
                      }
                      const value = Number(raw);
                      if (Number.isNaN(value)) return;
                      const clamped = Math.min(800, Math.max(40, Math.round(value)));
                      if (clamped !== value) {
                        onChange(index, { maxWidth: clamped });
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                  />
                </div>

                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Font Family</label>
                  <select
                    value={placeholder.fontFamily ?? "Inter"}
                    onChange={(e) => onChange(index, { fontFamily: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>

                {/* Text Style Toggles */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Text Style</label>
                  <div className="flex gap-2">
                    <Toggle
                      pressed={placeholder.fontWeight === "bold"}
                      onPressedChange={(pressed) => onChange(index, { fontWeight: pressed ? "bold" : "normal" })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-slate-50 data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[state=on]:bg-blue-500"
                    >
                      B
                    </Toggle>
                    <Toggle
                      pressed={placeholder.fontStyle === "italic"}
                      onPressedChange={(pressed) => onChange(index, { fontStyle: pressed ? "italic" : "normal" })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs italic shadow-sm hover:bg-slate-50 data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[state=on]:bg-blue-500"
                    >
                      I
                    </Toggle>
                    <Toggle
                      pressed={placeholder.textDecoration === "underline"}
                      onPressedChange={(pressed) => onChange(index, { textDecoration: pressed ? "underline" : "none" })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs underline shadow-sm hover:bg-slate-50 data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[state=on]:bg-blue-500"
                    >
                      U
                    </Toggle>
                  </div>
                </div>

                {/* Text Alignment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Text Alignment</label>
                  <div className="flex gap-2">
                    <Toggle
                      pressed={placeholder.align === "left"}
                      onPressedChange={(pressed) => pressed && onChange(index, { align: "left" })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-slate-50 data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[state=on]:bg-blue-500"
                    >
                      Left
                    </Toggle>
                    <Toggle
                      pressed={placeholder.align === "center"}
                      onPressedChange={(pressed) => pressed && onChange(index, { align: "center" })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-slate-50 data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[state=on]:bg-blue-500"
                    >
                      Center
                    </Toggle>
                    <Toggle
                      pressed={placeholder.align === "right"}
                      onPressedChange={(pressed) => pressed && onChange(index, { align: "right" })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-slate-50 data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[state=on]:bg-blue-500"
                    >
                      Right
                    </Toggle>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Line gap</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {(placeholder.lineHeight ?? DEFAULT_LINE_HEIGHT).toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={MIN_LINE_HEIGHT}
                        max={MAX_LINE_HEIGHT}
                        step="0.05"
                        value={(placeholder.lineHeight ?? DEFAULT_LINE_HEIGHT).toFixed(2)}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isNaN(value)) return;
                          const clamped = Math.min(MAX_LINE_HEIGHT, Math.max(MIN_LINE_HEIGHT, Number(value.toFixed(2))));
                          onChange(index, { lineHeight: clamped });
                        }}
                        className="h-2 flex-1 cursor-pointer rounded-full bg-slate-200"
                      />
                      <Input
                        type="number"
                        step="0.05"
                        min={MIN_LINE_HEIGHT}
                        max={MAX_LINE_HEIGHT}
                        value={(placeholder.lineHeight ?? DEFAULT_LINE_HEIGHT).toFixed(2)}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === "") {
                            onChange(index, { lineHeight: DEFAULT_LINE_HEIGHT });
                            return;
                          }
                          const value = Number(raw);
                          if (Number.isNaN(value)) return;
                          const clamped = Math.min(MAX_LINE_HEIGHT, Math.max(MIN_LINE_HEIGHT, Number(value.toFixed(2))));
                          onChange(index, { lineHeight: clamped });
                        }}
                        className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Adjust spacing between lines for multi-line text blocks.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Letter spacing</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {(placeholder.letterSpacing ?? 0).toFixed(1)}px
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={MIN_LETTER_SPACING}
                        max={MAX_LETTER_SPACING}
                        step="0.5"
                        value={(placeholder.letterSpacing ?? 0).toFixed(1)}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isNaN(value)) return;
                          const clamped = Math.min(MAX_LETTER_SPACING, Math.max(MIN_LETTER_SPACING, Number(value.toFixed(1))));
                          onChange(index, { letterSpacing: clamped });
                        }}
                        className="h-2 flex-1 cursor-pointer rounded-full bg-slate-200"
                      />
                      <Input
                        type="number"
                        step="0.5"
                        min={MIN_LETTER_SPACING}
                        max={MAX_LETTER_SPACING}
                        value={(placeholder.letterSpacing ?? 0).toFixed(1)}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === "") {
                            onChange(index, { letterSpacing: 0 });
                            return;
                          }
                          const value = Number(raw);
                          if (Number.isNaN(value)) return;
                          const clamped = Math.min(MAX_LETTER_SPACING, Math.max(MIN_LETTER_SPACING, Number(value.toFixed(1))));
                          onChange(index, { letterSpacing: clamped });
                        }}
                        className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {placeholder.type === "image" && (
              <div className="space-y-3 bg-slate-50/50 px-4 py-3">
                {content?.[placeholder.key]?.imageUrl || placeholder.imageUrl ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Preview</label>
                    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                      <img
                        src={content?.[placeholder.key]?.imageUrl ?? placeholder.imageUrl}
                        alt={placeholder.key}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
                {onImageUpload ? (
                  <FileUpload
                    label={placeholder.imageUrl || content?.[placeholder.key]?.imageUrl ? "Replace image" : "Upload image"}
                    accept={["image/png", "image/jpeg", "image/webp"]}
                    onUpload={async (file) => {
                      const url = await onImageUpload?.(index, file);
                      if (!url) return;
                      onChange(index, { imageUrl: url });
                      onContentUpdate?.(placeholder.key, { imageUrl: url });
                    }}
                  />
                ) : (
                  <p className="text-xs text-slate-500">Image upload unavailable in this context.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Width</label>
                    <input
                      type="number"
                      min="40"
                      max="800"
                      value={placeholder.width !== undefined ? placeholder.width.toString() : ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          onChange(index, { width: undefined });
                          return;
                        }
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        onChange(index, { width: value });
                      }}
                      onBlur={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          onChange(index, { width: 220 });
                          return;
                        }
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        const clamped = Math.min(800, Math.max(40, Math.round(value)));
                        if (clamped !== value) {
                          onChange(index, { width: clamped });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Height</label>
                    <input
                      type="number"
                      min="40"
                      max="800"
                      value={placeholder.height !== undefined ? placeholder.height.toString() : ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          onChange(index, { height: undefined });
                          return;
                        }
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        onChange(index, { height: value });
                      }}
                      onBlur={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          onChange(index, { height: 220 });
                          return;
                        }
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        const clamped = Math.min(800, Math.max(40, Math.round(value)));
                        if (clamped !== value) {
                          onChange(index, { height: clamped });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400/30"
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Border</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Toggle outline styling for this image.</p>
                    </div>
                    <Toggle
                      pressed={(placeholder.borderWidth ?? 0) > 0}
                      onPressedChange={(pressed) =>
                        onChange(index, {
                          borderWidth: pressed ? Math.max(1, placeholder.borderWidth ?? 4) : 0,
                        })
                      }
                      className="h-8 rounded-full border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-100 data-[state=on]:border-blue-500 data-[state=on]:bg-blue-500 data-[state=on]:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[state=on]:bg-blue-500"
                    >
                      {(placeholder.borderWidth ?? 0) > 0 ? "Enabled" : "Disabled"}
                    </Toggle>
                  </div>
                  {(placeholder.borderWidth ?? 0) > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Width</label>
                        <Input
                          type="number"
                          min="1"
                          max="40"
                          value={(placeholder.borderWidth ?? 1).toString()}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isNaN(value)) return;
                            onChange(index, { borderWidth: Math.min(40, Math.max(1, Math.round(value))) });
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Radius</label>
                        <Input
                          type="number"
                          min="0"
                          max="200"
                          value={(placeholder.borderRadius ?? 0).toString()}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isNaN(value)) return;
                            onChange(index, { borderRadius: Math.min(200, Math.max(0, Math.round(value))) });
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Color</label>
                        <ColorPicker
                          value={placeholder.borderColor ?? "#38bdf8"}
                          onChange={(color) => onChange(index, { borderColor: color })}
                          className="w-full"
                          triggerClassName="justify-start"
                          label={null}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <p className="text-xs text-slate-500">
                  Drag on the canvas to reposition. Width/height stay linked to the selection.
                </p>
              </div>
            )}

            {placeholder.type === "shape" && (
              <div className="space-y-3 bg-slate-50/50 px-4 py-3">
                {(() => {
                  const shapeType = placeholder.shape ?? "rectangle";
                  return (
                    <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Shape type</label>
                  <select
                        value={shapeType}
                    onChange={(event) => {
                      const nextShape = event.target.value as TemplatePlaceholder["shape"];
                      if (nextShape === "circle") {
                        const diameter = Math.max(40, Math.round(placeholder.width ?? placeholder.height ?? 200));
                        onChange(index, {
                          shape: nextShape,
                          width: diameter,
                          height: diameter,
                          borderRadius: undefined,
                            borderWidth: placeholder.borderWidth ?? 0,
                        });
                        return;
                      }
                        if (nextShape === "line") {
                          const length = Math.max(40, Math.round(placeholder.width ?? 260));
                          const thickness = Math.max(2, Math.round(placeholder.borderWidth ?? placeholder.height ?? 6));
                          const color = placeholder.fillColor ?? "#3b82f6";
                          onChange(index, {
                            shape: nextShape,
                            width: length,
                            height: thickness,
                            borderWidth: thickness,
                            borderRadius: undefined,
                            fillColor: color,
                            borderColor: color,
                          });
                          return;
                        }
                        if (nextShape === "triangle") {
                          onChange(index, {
                            shape: nextShape,
                            borderRadius: undefined,
                            width: placeholder.width ?? 240,
                            height: placeholder.height ?? 200,
                            borderWidth: placeholder.borderWidth ?? 0,
                          });
                          return;
                        }
                        onChange(index, {
                          shape: nextShape,
                          borderRadius: placeholder.borderRadius ?? 24,
                          width: placeholder.width ?? 240,
                          height: placeholder.height ?? 160,
                          borderWidth: placeholder.borderWidth ?? 2,
                        });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                        <option value="triangle">Triangle</option>
                        <option value="line">Line</option>
                  </select>
                </div>

                      <div className={cn("grid gap-3", shapeType === "line" ? "grid-cols-1" : "grid-cols-2")}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      {shapeType === "line" ? "Line color" : "Fill color"}
                    </label>
                    <ColorPicker
                      value={placeholder.fillColor ?? "#60a5fa"}
                      onChange={(color) =>
                        onChange(index, {
                          fillColor: color,
                          ...(shapeType === "line" ? { borderColor: color } : null),
                        })
                      }
                      className="w-full"
                      triggerClassName="justify-start"
                      label={null}
                    />
                  </div>
                  {shapeType !== "line" ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Outline color</label>
                      <ColorPicker
                        value={placeholder.borderColor ?? "#1e293b"}
                        onChange={(color) => onChange(index, { borderColor: color })}
                        className="w-full"
                        triggerClassName="justify-start"
                        label={null}
                      />
                    </div>
                  ) : null}
                      </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-600">
                            {shapeType === "line" ? "Line thickness" : "Outline width"}
                          </label>
                    <Input
                      type="number"
                      min="0"
                      max="40"
                      value={(placeholder.borderWidth ?? 0).toString()}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isNaN(value)) return;
                        const nextValue = Math.max(0, value);
                        onChange(index, {
                          borderWidth: nextValue,
                          ...(shapeType === "line" ? { height: Math.max(2, nextValue) } : null),
                        });
                      }}
                      onBlur={(event) => {
                        const raw = Number(event.target.value);
                        if (Number.isNaN(raw)) {
                          const fallback = shapeType === "line" ? 6 : 0;
                          onChange(index, {
                            borderWidth: fallback,
                            ...(shapeType === "line" ? { height: Math.max(2, fallback) } : null),
                          });
                          return;
                        }
                        const clamped = Math.min(40, Math.max(0, Math.round(raw)));
                        onChange(index, {
                          borderWidth: clamped,
                          ...(shapeType === "line" ? { height: Math.max(2, clamped) } : null),
                        });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-600">
                            {shapeType === "line" ? "Line style" : "Outline style"}
                          </label>
                    <select
                      value={placeholder.dashPattern?.length ? placeholder.dashPattern.join(",") : "solid"}
                      onChange={(event) => {
                        const style = event.target.value;
                        if (style === "solid") {
                          onChange(index, { dashPattern: undefined });
                          return;
                        }
                        if (style === "12,6") {
                          onChange(index, { dashPattern: [12, 6] });
                          return;
                        }
                        onChange(index, { dashPattern: [4, 4] });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="solid">Solid</option>
                      <option value="12,6">Dashed</option>
                      <option value="4,4">Dotted</option>
                    </select>
                  </div>
                </div>

                      {shapeType === "circle" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Diameter</label>
                    <Input
                      type="number"
                      min="40"
                      max="800"
                      value={Math.round(placeholder.width ?? placeholder.height ?? 200).toString()}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") return;
                        const value = Number(raw);
                        if (Number.isNaN(value)) return;
                        onChange(index, { width: value, height: value });
                      }}
                      onBlur={(event) => {
                        const raw = Number(event.target.value);
                        if (Number.isNaN(raw)) {
                          onChange(index, { width: 200, height: 200 });
                          return;
                        }
                        const clamped = Math.min(800, Math.max(40, Math.round(raw)));
                        onChange(index, { width: clamped, height: clamped });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                      ) : shapeType === "line" ? (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-600">Length</label>
                          <Input
                            type="number"
                            min="40"
                            max="1000"
                            value={(placeholder.width ?? 260).toString()}
                            onChange={(event) => {
                              const raw = event.target.value;
                              if (raw === "") return;
                              const value = Number(raw);
                              if (Number.isNaN(value)) return;
                              onChange(index, { width: value });
                            }}
                            onBlur={(event) => {
                              const raw = Number(event.target.value);
                              if (Number.isNaN(raw)) {
                                onChange(index, { width: 260 });
                                return;
                              }
                              const clamped = Math.min(1000, Math.max(40, Math.round(raw)));
                              onChange(index, { width: clamped });
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">Width</label>
                      <Input
                        type="number"
                        min="40"
                        max="800"
                        value={(placeholder.width ?? 240).toString()}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === "") return;
                          const value = Number(raw);
                          if (Number.isNaN(value)) return;
                          onChange(index, { width: value });
                        }}
                        onBlur={(event) => {
                          const raw = Number(event.target.value);
                          if (Number.isNaN(raw)) {
                            onChange(index, { width: 240 });
                            return;
                          }
                          const clamped = Math.min(800, Math.max(40, Math.round(raw)));
                          onChange(index, { width: clamped });
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Height</label>
                      <Input
                        type="number"
                        min="40"
                        max="800"
                        value={(placeholder.height ?? 160).toString()}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === "") return;
                          const value = Number(raw);
                          if (Number.isNaN(value)) return;
                          onChange(index, { height: value });
                        }}
                        onBlur={(event) => {
                          const raw = Number(event.target.value);
                          if (Number.isNaN(raw)) {
                            onChange(index, { height: 160 });
                            return;
                          }
                          const clamped = Math.min(800, Math.max(40, Math.round(raw)));
                          onChange(index, { height: clamped });
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                      )}

                      {shapeType === "rectangle" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Corner radius</label>
                    <Input
                      type="number"
                      min="0"
                      max="400"
                      value={(placeholder.borderRadius ?? 24).toString()}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isNaN(value)) return;
                        onChange(index, { borderRadius: Math.max(0, value) });
                      }}
                      onBlur={(event) => {
                        const raw = Number(event.target.value);
                        if (Number.isNaN(raw)) {
                          onChange(index, { borderRadius: 24 });
                          return;
                        }
                        const clamped = Math.min(400, Math.max(0, Math.round(raw)));
                        onChange(index, { borderRadius: clamped });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                      ) : null}

                <p className="text-xs text-slate-500">
                  Shapes respect snap-to-grid settings. Use rotation and opacity controls below for additional styling.
                </p>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Opacity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((placeholder.opacity ?? 1) * 100)}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      onChange(index, { opacity: Math.min(1, Math.max(0, value / 100)) });
                    }}
                    className="h-2 flex-1 cursor-pointer rounded-full bg-slate-200"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round((placeholder.opacity ?? 1) * 100).toString()}
                    onChange={(event) => {
                      const raw = Number(event.target.value);
                      if (Number.isNaN(raw)) return;
                      onChange(index, { opacity: Math.min(1, Math.max(0, raw / 100)) });
                    }}
                    className="h-9 w-20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Rotation</label>
                <Input
                  type="number"
                  min="-180"
                  max="180"
                  value={Math.round(placeholder.rotation ?? 0).toString()}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isNaN(value)) return;
                    onChange(index, { rotation: value });
                  }}
                />
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
};

interface PlaceholderNodeProps {
  placeholder: TemplatePlaceholder;
  onDrag: (position: { x: number; y: number }, options?: { recordHistory?: boolean }) => void;
  interactive: boolean;
  content?: { text?: string; imageUrl?: string };
  showGuide: boolean;
  snapToGrid: boolean;
  gridSize: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
  onTransform: (updates: Partial<TemplatePlaceholder>, options?: { recordHistory?: boolean }) => void;
  onTransformStateChange: (active: boolean) => void;
  registerNode: (key: string, node: Konva.Node | null) => void;
  inlineTextValue?: string;
  editingTextKey?: string | null;
  onTextEditStart?: (placeholder: TemplatePlaceholder, textNode: KonvaText | null) => void;
}

const PlaceholderNode = ({
  placeholder,
  onDrag,
  interactive,
  content,
  showGuide,
  snapToGrid,
  gridSize,
  isHovered,
  isSelected,
  onHoverChange,
  onSelect,
  onTransform,
  onTransformStateChange,
  registerNode,
  inlineTextValue,
  editingTextKey,
  onTextEditStart,
}: PlaceholderNodeProps) => {
  const [placeholderImage] = useImage(content?.imageUrl ?? placeholder.imageUrl ?? "", "anonymous");
  const opacity = placeholder.opacity ?? 1;
  const rotation = placeholder.rotation ?? 0;
  const locked = placeholder.locked ?? false;
  const nodeRef = useRef<Konva.Group>(null);
  const textNodeRef = useRef<KonvaText | null>(null);
  const showHoverOutline =
    interactive && (isHovered || isSelected) && !(placeholder.type === "text" && editingTextKey === placeholder.key);
  const textFillColor = placeholder.color ?? "#FFFFFF";

  useEffect(() => {
    registerNode(placeholder.key, nodeRef.current ?? null);
    return () => registerNode(placeholder.key, null);
  }, [placeholder.key, registerNode]);

  const handleDrag = useCallback(
    (event: Konva.KonvaEventObject<DragEvent>) => {
      if (!interactive || locked) return;
      let nextX = event.target.x();
      let nextY = event.target.y();
      if (snapToGrid && gridSize > 0) {
        const snappedX = Math.round(nextX / gridSize) * gridSize;
        const snappedY = Math.round(nextY / gridSize) * gridSize;
        if (snappedX !== nextX || snappedY !== nextY) {
          event.target.x(snappedX);
          event.target.y(snappedY);
        }
        nextX = snappedX;
        nextY = snappedY;
      }
      const shouldRecord = event.type === "dragend";
      onDrag({ x: nextX, y: nextY }, { recordHistory: shouldRecord });
    },
    [gridSize, interactive, locked, onDrag, snapToGrid],
  );

  const handleTransformStart = useCallback(() => {
    if (!interactive || locked) return;
    onTransformStateChange(true);
  }, [interactive, locked, onTransformStateChange]);

  const handleTransformEnd = useCallback(() => {
    onTransformStateChange(false);
    if (!interactive || locked) return;
    const node = nodeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const updates: Partial<TemplatePlaceholder> = {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      rotation: Math.round(node.rotation()),
    };

    if (placeholder.type === "text") {
      const baseWidth = placeholder.maxWidth ?? DEFAULT_TEXT_MAX_WIDTH;
      const baseFontSize = placeholder.fontSize ?? 28;
      const baseLineHeight = placeholder.lineHeight ?? 1.2;
      updates.maxWidth = Math.max(60, Math.round(baseWidth * scaleX));
      if (scaleY !== 1) {
        updates.fontSize = Math.max(8, Math.round(baseFontSize * scaleY));
        updates.lineHeight = Math.max(0.6, Number((baseLineHeight * scaleY).toFixed(2)));
      }
    } else if (placeholder.type === "image") {
      const baseWidth = placeholder.width ?? 220;
      const baseHeight = placeholder.height ?? 220;
      updates.width = Math.max(32, Math.round(baseWidth * scaleX));
      updates.height = Math.max(32, Math.round(baseHeight * scaleY));
    } else if (placeholder.type === "shape") {
      const shapeType = placeholder.shape ?? "rectangle";
      if (shapeType === "circle") {
        const baseDiameter = placeholder.width ?? placeholder.height ?? 200;
        const diameter = Math.max(32, Math.round(baseDiameter * ((scaleX + scaleY) / 2)));
        updates.width = diameter;
        updates.height = diameter;
      } else if (shapeType === "line") {
        const baseLength = placeholder.width ?? 260;
        const baseThickness = placeholder.borderWidth ?? placeholder.height ?? 6;
        const length = Math.max(40, Math.round(baseLength * scaleX));
        const thickness = Math.max(2, Math.round(baseThickness * scaleY));
        updates.width = length;
        updates.height = thickness;
        updates.borderWidth = thickness;
      } else if (shapeType === "triangle") {
        const baseWidth = placeholder.width ?? 260;
        const baseHeight = placeholder.height ?? 220;
        updates.width = Math.max(40, Math.round(baseWidth * scaleX));
        updates.height = Math.max(40, Math.round(baseHeight * scaleY));
      } else {
        const baseWidth = placeholder.width ?? 240;
        const baseHeight = placeholder.height ?? 160;
        updates.width = Math.max(32, Math.round(baseWidth * scaleX));
        updates.height = Math.max(32, Math.round(baseHeight * scaleY));
        if (placeholder.borderRadius !== undefined) {
          const adjustedRadius = Math.max(0, Math.round((placeholder.borderRadius ?? 0) * ((scaleX + scaleY) / 2)));
          const maxRadius = Math.min(updates.width ?? baseWidth, updates.height ?? baseHeight) / 2;
          updates.borderRadius = Math.min(adjustedRadius, maxRadius);
        }
      }
    }

    node.scaleX(1);
    node.scaleY(1);
    onTransform(updates, { recordHistory: true });
  }, [interactive, locked, onTransform, onTransformStateChange, placeholder]);

  if (placeholder.type === "shape") {
    const shapeType = placeholder.shape ?? "rectangle";
    const shapeWidth = placeholder.width ?? (shapeType === "circle" ? 200 : shapeType === "line" ? 260 : 240);
    const shapeHeight =
      placeholder.height ??
      (shapeType === "circle"
        ? shapeWidth
        : shapeType === "line"
          ? Math.max(2, placeholder.borderWidth ?? 6)
          : shapeType === "triangle"
            ? 200
            : 160);
    const fillColor =
      placeholder.fillColor ??
      (shapeType === "line"
        ? "rgba(59, 130, 246, 1)"
        : shapeType === "triangle"
          ? "rgba(14, 165, 233, 0.18)"
          : "rgba(59, 130, 246, 0.16)");
    const strokeColor =
      placeholder.borderColor ??
      (shapeType === "line" ? fillColor : shapeType === "triangle" ? "rgba(14, 165, 233, 0.9)" : "rgba(15, 23, 42, 0.55)");
    const strokeWidth = Math.max(
      0,
      placeholder.borderWidth ??
        (shapeType === "rectangle" ? 2 : shapeType === "triangle" ? 0 : shapeType === "line" ? 6 : 0),
    );
    const cornerRadius = shapeType === "rectangle" ? placeholder.borderRadius ?? 24 : undefined;
    const dash = placeholder.dashPattern && placeholder.dashPattern.length ? placeholder.dashPattern : undefined;
    const radius = Math.min(shapeWidth, shapeHeight) / 2;

    return (
      <Group
        ref={nodeRef}
        x={placeholder.x}
        y={placeholder.y}
        opacity={opacity}
        rotation={rotation}
        draggable={interactive && !locked}
        listening={interactive && !locked}
        onDragMove={interactive && !locked ? handleDrag : undefined}
        onDragEnd={interactive && !locked ? handleDrag : undefined}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onClick={(event) => {
          event.cancelBubble = true;
          onSelect();
        }}
      >
        {shapeType === "circle" ? (
          <Circle
            x={radius}
            y={radius}
            radius={radius}
            fill={fillColor}
            stroke={strokeWidth > 0 ? strokeColor : undefined}
            strokeWidth={strokeWidth}
            dash={dash}
          />
        ) : shapeType === "triangle" ? (
          <Line
            points={[shapeWidth / 2, 0, shapeWidth, shapeHeight, 0, shapeHeight]}
            closed
            fill={fillColor}
            stroke={strokeWidth > 0 ? strokeColor : undefined}
            strokeWidth={strokeWidth}
            dash={dash}
          />
        ) : shapeType === "line" ? (
          <Line
            points={[0, shapeHeight / 2, shapeWidth, shapeHeight / 2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth || shapeHeight}
            dash={dash}
            lineCap="round"
          />
        ) : (
          <Rect
            width={shapeWidth}
            height={shapeHeight}
            cornerRadius={cornerRadius}
            fill={fillColor}
            stroke={strokeWidth > 0 ? strokeColor : undefined}
            strokeWidth={strokeWidth}
            dash={dash}
          />
        )}
        {showHoverOutline ? (
          <>
            {shapeType === "circle" ? (
              <>
                <Circle
                  x={radius}
                  y={radius}
                  radius={radius}
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  opacity={0.9}
                  listening={false}
                />
                {["top", "right", "bottom", "left"].map((position) => {
                  const handleRadius = 5;
                  const coords =
                    position === "top"
                      ? { x: radius, y: 0 }
                      : position === "right"
                        ? { x: radius * 2, y: radius }
                        : position === "bottom"
                          ? { x: radius, y: radius * 2 }
                          : { x: 0, y: radius };
                  return (
                    <Circle
                      key={position}
                      x={coords.x}
                      y={coords.y}
                      radius={handleRadius}
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth={1}
                      listening={false}
                    />
                  );
                })}
                <Line
                  points={[radius, -24, radius, 0]}
                  stroke="#2563eb"
                  strokeWidth={1}
                  listening={false}
                />
                <Circle
                  x={radius}
                  y={-24}
                  radius={6}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={1}
                  listening={false}
                />
              </>
            ) : shapeType === "triangle" ? (
              <>
                <Line
                  points={[shapeWidth / 2, 0, shapeWidth, shapeHeight, 0, shapeHeight]}
                  closed
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  listening={false}
                />
                {[[shapeWidth / 2, 0], [shapeWidth, shapeHeight], [0, shapeHeight]].map(([x, y], idx) => (
                  <Rect
                    key={idx}
                    x={x - 5}
                    y={y - 5}
                    width={10}
                    height={10}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth={1}
                    cornerRadius={2}
                    listening={false}
                  />
                ))}
                <Line
                  points={[shapeWidth / 2, -28, shapeWidth / 2, 0]}
                  stroke="#2563eb"
                  strokeWidth={1}
                  listening={false}
                />
                <Circle
                  x={shapeWidth / 2}
                  y={-28}
                  radius={6}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={1}
                  listening={false}
                />
              </>
            ) : shapeType === "line" ? (
              <>
                <Rect
                  x={-4}
                  y={-Math.max(6, strokeWidth) / 2}
                  width={shapeWidth + 8}
                  height={Math.max(6, strokeWidth) + 8}
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  listening={false}
                />
                {[0, shapeWidth].map((x, idx) => (
                  <Circle
                    key={idx}
                    x={x}
                    y={shapeHeight / 2}
                    radius={6}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth={1}
                    listening={false}
                  />
                ))}
                <Line
                  points={[shapeWidth / 2, -26, shapeWidth / 2, shapeHeight / 2]}
                  stroke="#2563eb"
                  strokeWidth={1}
                  listening={false}
                />
                <Circle
                  x={shapeWidth / 2}
                  y={-26}
                  radius={6}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={1}
                  listening={false}
                />
              </>
            ) : (
              <>
                <Rect
                  width={shapeWidth}
                  height={shapeHeight}
                  cornerRadius={cornerRadius}
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  listening={false}
                />
                {[0, shapeHeight].map((y) =>
                  [0, shapeWidth].map((x) => (
                    <Rect
                      key={`${x}-${y}`}
                      x={x - 5}
                      y={y - 5}
                      width={10}
                      height={10}
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth={1}
                      cornerRadius={2}
                      listening={false}
                    />
                  )),
                )}
                <Line
                  points={[shapeWidth / 2, -28, shapeWidth / 2, 0]}
                  stroke="#2563eb"
                  strokeWidth={1}
                  listening={false}
                />
                <Circle
                  x={shapeWidth / 2}
                  y={-28}
                  radius={6}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={1}
                  listening={false}
                />
              </>
            )}
          </>
        ) : null}
        {showGuide ? (
          shapeType === "circle" ? (
            <Circle
              x={radius}
              y={radius}
              radius={radius}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[8, 6]}
              opacity={0.25}
            />
          ) : shapeType === "triangle" ? (
            <Line
              points={[shapeWidth / 2, 0, shapeWidth, shapeHeight, 0, shapeHeight]}
              closed
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[8, 6]}
              opacity={0.25}
            />
          ) : shapeType === "line" ? (
            <Line
              points={[0, shapeHeight / 2, shapeWidth, shapeHeight / 2]}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[6, 6]}
              opacity={0.25}
            />
          ) : (
            <Rect
              width={shapeWidth}
              height={shapeHeight}
              cornerRadius={cornerRadius}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[8, 6]}
              opacity={0.25}
            />
          )
        ) : null}
      </Group>
    );
  }

  if (placeholder.type === "image") {
    const borderColor = placeholder.borderColor ?? "#38bdf8";
    const borderWidth = placeholder.borderWidth ?? 3;
    const borderRadius = placeholder.borderRadius ?? 12;
    const imgWidth = placeholder.width ?? 220;
    const imgHeight = placeholder.height ?? 220;

    return (
      <Group
        ref={nodeRef}
        x={placeholder.x}
        y={placeholder.y}
        opacity={opacity}
        rotation={rotation}
        draggable={interactive && !locked}
        listening={interactive && !locked}
        onDragMove={interactive && !locked ? handleDrag : undefined}
        onDragEnd={interactive && !locked ? handleDrag : undefined}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onClick={(event) => {
          event.cancelBubble = true;
          onSelect();
        }}
      >
        {placeholderImage ? (
          <KonvaImage width={imgWidth} height={imgHeight} image={placeholderImage} cornerRadius={borderRadius} />
        ) : showGuide ? (
          <Rect
            width={imgWidth}
            height={imgHeight}
            cornerRadius={borderRadius}
            stroke={borderColor}
            strokeWidth={Math.max(borderWidth, 2)}
            dash={[10, 8]}
            fill="rgba(15, 23, 42, 0.05)"
          />
        ) : null}
        {borderWidth > 0 && placeholderImage ? (
          <Rect
            width={imgWidth}
            height={imgHeight}
            cornerRadius={borderRadius}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        ) : null}
        {showHoverOutline ? (
          <>
            <Rect
              width={imgWidth}
              height={imgHeight}
              cornerRadius={borderRadius}
              stroke="#2563eb"
              strokeWidth={1.5}
              dash={[6, 4]}
              listening={false}
            />
            {[0, imgHeight].map((y) =>
              [0, imgWidth].map((x) => (
                <Rect
                  key={`${x}-${y}`}
                  x={x - 5}
                  y={y - 5}
                  width={10}
                  height={10}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={1}
                  cornerRadius={2}
                  listening={false}
                />
              )),
            )}
            <Line
              points={[imgWidth / 2, -28, imgWidth / 2, 0]}
              stroke="#2563eb"
              strokeWidth={1}
              listening={false}
            />
            <Circle
              x={imgWidth / 2}
              y={-28}
              radius={6}
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth={1}
              listening={false}
            />
          </>
        ) : null}
      </Group>
    );
  }

  const isEditingThisText = editingTextKey === placeholder.key;
  const textContent =
    inlineTextValue ??
    content?.text ??
    placeholder.sampleText ??
    placeholder.key.toUpperCase();

  if (!interactive && process.env.NODE_ENV !== "production") {
    try {
      console.debug("[TemplateCanvas] Render placeholder", {
        key: placeholder.key,
        resolvedText: textContent,
        hasContent: Boolean(content?.text),
        sampleText: placeholder.sampleText,
      });
    } catch {
      // Ignore logging errors in older browsers.
    }
  }
  const textWidth = placeholder.maxWidth ?? DEFAULT_TEXT_MAX_WIDTH;
  const estimatedTextHeight = textNodeRef.current?.height() ?? (placeholder.fontSize ?? 28) * (placeholder.lineHeight ?? 1.2) * 1.4;
  const textHitWidth = Math.max(40, textWidth);
  const textHitHeight = Math.max(24, estimatedTextHeight);
  const resolvedAlign: "left" | "center" | "right" =
    placeholder.align === "center" || placeholder.align === "right" ? placeholder.align : "left";

  return (
    <Group
      ref={nodeRef}
      x={placeholder.x}
      y={placeholder.y}
      draggable={interactive && !locked}
      listening={interactive && !locked}
      onDragMove={interactive && !locked ? handleDrag : undefined}
      onDragEnd={interactive && !locked ? handleDrag : undefined}
      onTransformStart={handleTransformStart}
      onTransformEnd={handleTransformEnd}
      opacity={opacity}
      rotation={rotation}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onDblClick={(event) => {
        event.cancelBubble = true;
        onSelect();
        if (placeholder.type === "text") {
          onTextEditStart?.(placeholder, textNodeRef.current);
        }
      }}
      onClick={(event) => {
        event.cancelBubble = true;
        onSelect();
      }}
    >
      <Rect
        width={textHitWidth}
        height={textHitHeight}
        fill="rgba(15,23,42,0.001)"
        strokeEnabled={false}
        listening={interactive && !locked && !isEditingThisText && placeholder.type === "text"}
        onDblClick={(event) => {
          event.cancelBubble = true;
          onSelect();
          if (placeholder.type === "text") {
            onTextEditStart?.(placeholder, textNodeRef.current);
          }
        }}
      />
      <Text
        ref={(node) => {
          textNodeRef.current = node;
        }}
        text={textContent}
        width={textWidth}
        wrap="word"
        fontSize={placeholder.fontSize ?? 28}
        fill={textFillColor}
        fontFamily={placeholder.fontFamily ?? "Inter"}
        fontStyle={`${placeholder.fontWeight ?? "bold"} ${placeholder.fontStyle ?? "normal"}`}
        textDecoration={placeholder.textDecoration ?? ""}
        align={resolvedAlign}
        letterSpacing={placeholder.letterSpacing ?? 0}
        lineHeight={placeholder.lineHeight ?? 1.2}
        listening={false}
        visible={!isEditingThisText}
        onDblClick={(event) => {
          event.cancelBubble = true;
          onSelect();
          if (placeholder.type === "text") {
            onTextEditStart?.(placeholder, textNodeRef.current);
          }
        }}
      />
      {showHoverOutline && !isEditingThisText ? (
        <>
          <Rect
            width={textHitWidth}
            height={textHitHeight}
            stroke="#2563eb"
            strokeWidth={1.5}
            dash={[6, 4]}
            listening={false}
          />
          {[0, textHitHeight].map((y) =>
            [0, textHitWidth].map((x) => (
              <Rect
                key={`${x}-${y}`}
                x={x - 5}
                y={y - 5}
                width={10}
                height={10}
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth={1}
                cornerRadius={2}
                listening={false}
              />
            )),
          )}
          <Line
            points={[
              (placeholder.maxWidth ?? DEFAULT_TEXT_MAX_WIDTH) / 2,
              -28,
              (placeholder.maxWidth ?? DEFAULT_TEXT_MAX_WIDTH) / 2,
              0,
            ]}
            stroke="#2563eb"
            strokeWidth={1}
            listening={false}
          />
          <Circle
            x={(placeholder.maxWidth ?? DEFAULT_TEXT_MAX_WIDTH) / 2}
            y={-28}
            radius={6}
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth={1}
            listening={false}
          />
        </>
      ) : null}
    </Group>
  );
};

interface GridOverlayProps {
  width: number;
  height: number;
  gridSize: number;
}

const GridOverlay = ({ width, height, gridSize }: GridOverlayProps) => {
  if (gridSize <= 0) return null;
  const verticalLines = [];
  for (let x = gridSize; x < width; x += gridSize) {
    verticalLines.push(
      <Line key={`v-${x}`} points={[x, 0, x, height]} stroke="#94a3b8" strokeWidth={1} dash={[4, 6]} />,
    );
  }
  const horizontalLines = [];
  for (let y = gridSize; y < height; y += gridSize) {
    horizontalLines.push(
      <Line key={`h-${y}`} points={[0, y, width, y]} stroke="#94a3b8" strokeWidth={1} dash={[4, 6]} />,
    );
  }

  return (
    <>
      {verticalLines}
      {horizontalLines}
    </>
  );
};