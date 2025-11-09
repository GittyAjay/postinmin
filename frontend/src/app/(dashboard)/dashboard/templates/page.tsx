"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FolderUp,
  Image as ImageIcon,
  LayoutGrid,
  Grid3X3,
  Loader2,
  PanelsTopLeft,
  PlusIcon,
  Redo2,
  SaveIcon,
  Search as SearchIcon,
  Shapes,
  Type as TypeIcon,
  Undo2,
  ZoomIn,
  ZoomOut,
  X,
  Magnet,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { z } from "zod";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmotionBadge } from "@/components/dashboard/emotion-badge";
import { TemplateCard } from "@/components/dashboard/template-card";
import { TemplateCanvas, TemplatePlaceholderList } from "@/components/template/template-canvas";
import { FileUpload } from "@/components/dashboard/file-upload";
import { ColorPicker } from "@/components/dashboard/color-picker";
import { api, endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Business, Template, TemplatePlaceholder } from "@/types/business";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CANVAS_PRESETS,
  DEFAULT_CANVAS_PRESET_ID,
  findCanvasPresetById,
  formatDimensions,
  inferCanvasPreset,
  resolveCanvasDimensions,
} from "@/lib/canvas-presets";
import { NEW_BUSINESS_ID, useBusinessStore } from "@/store/business-store";

const templateSchema = z.object({
  name: z.string().min(2),
  canvasPreset: z.string().min(1),
  tags: z.string().optional(),
  emotionFit: z.string().optional(),
});

type TemplateForm = z.infer<typeof templateSchema>;
type PanelKey = "templates" | "text" | "elements" | "images" | "uploads";

const DEFAULT_BACKGROUND_COLOR = "#0f172a";

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
};

const fetchTemplates = async (businessId?: string) => {
  if (!businessId) return [];
  const response = await api.get(`${endpoints.template}/${businessId}`);
  const data = response.data as Template[];

  return data.map((template) => ({
    ...template,
    backgroundUrl: template.backgroundUrl ?? undefined,
    backgroundColor: template.backgroundColor ?? undefined,
    canvasPreset: template.canvasPreset ?? undefined,
    canvasWidth: template.canvasWidth ?? undefined,
    canvasHeight: template.canvasHeight ?? undefined,
  }));
};

const MAX_HISTORY_LENGTH = 50;
const ASSET_LIBRARY_STORAGE_KEY = "template-asset-library:v1";
const MAX_LIBRARY_ITEMS = 60;

type StoredAsset = {
  url: string;
  uploadedAt: number;
  name?: string | null;
};

type AssetSource = "library" | "template-background" | "template-placeholder" | "prefill";

const ASSET_SOURCE_LABELS: Record<AssetSource, string> = {
  library: "Library",
  "template-background": "Background",
  "template-placeholder": "Placeholder",
  prefill: "Prefill",
};

const cloneTemplate = (template: Template): Template =>
  typeof structuredClone === "function"
    ? structuredClone(template)
    : (JSON.parse(JSON.stringify(template)) as Template);

const templatesAreEqual = (a: Template, b: Template) => JSON.stringify(a) === JSON.stringify(b);

function TemplatesPageContent() {
  const [editorTemplate, setEditorTemplate] = useState<Template | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [canvasScale, setCanvasScale] = useState(0.35);
  const [templateSearch, setTemplateSearch] = useState("");
  const [activePanel, setActivePanel] = useState<PanelKey | null>("templates");
  const [prefillContent, setPrefillContent] = useState<Record<string, { text?: string; imageUrl?: string }> | null>(null);
  const [showPlaceholderGuides, setShowPlaceholderGuides] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [storedAssets, setStoredAssets] = useState<StoredAsset[]>([]);
  const [copiedAssetUrl, setCopiedAssetUrl] = useState<string | null>(null);
  const stageRef = useRef<KonvaStage | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyRef = useRef<Template[]>([]);
  const futureRef = useRef<Template[]>([]);
  const pendingHistorySnapshotRef = useRef<Template | null>(null);
  const [historyStatus, setHistoryStatus] = useState({ canUndo: false, canRedo: false });
  const { data: businesses = [] } = useQuery({ queryKey: queryKeys.business, queryFn: fetchBusinesses, placeholderData: [] });
  const { activeBusinessId, setActiveBusinessId } = useBusinessStore();

  const toolbarButtonClass =
    "h-9 w-9 rounded-full border border-slate-300 bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800";
  const toolbarActiveClass = "border-blue-500 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-300";
  const toolbarGroupClass =
    "flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-2 py-1 dark:border-slate-800/60 dark:bg-slate-900/60";
  const toolbarLabelClass = "text-xs font-medium text-slate-600 dark:text-slate-300";
  const selectedBusiness =
    activeBusinessId && activeBusinessId !== NEW_BUSINESS_ID
      ? businesses.find((item) => item.id === activeBusinessId) ?? null
      : null;
  const activeCanvas = useMemo(() => {
    if (!editorTemplate) return null;
    return resolveCanvasDimensions({
      canvasPreset: editorTemplate.canvasPreset,
      canvasWidth: editorTemplate.canvasWidth,
      canvasHeight: editorTemplate.canvasHeight,
      orientation: editorTemplate.orientation,
    });
  }, [editorTemplate]);
  const activeCanvasPresetId = editorTemplate
    ? editorTemplate.canvasPreset ?? activeCanvas?.preset?.id ?? DEFAULT_CANVAS_PRESET_ID
    : undefined;

  const updateHistoryIndicators = useCallback(() => {
    const next = {
      canUndo: historyRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    };
    setHistoryStatus((previous) =>
      previous.canUndo === next.canUndo && previous.canRedo === next.canRedo ? previous : next,
    );
  }, []);

  const resetHistory = useCallback(() => {
    historyRef.current = [];
    futureRef.current = [];
    pendingHistorySnapshotRef.current = null;
    updateHistoryIndicators();
  }, [updateHistoryIndicators]);

  const commitTemplateChange = useCallback(
    (mutator: (draft: Template) => void, options?: { recordHistory?: boolean }) => {
      let changeType: "none" | "history" | "state-only" = "none";
      setEditorTemplate((previous) => {
        if (!previous) return previous;
        const draft = cloneTemplate(previous);
        mutator(draft);
        if (templatesAreEqual(previous, draft)) {
          return previous;
        }
        if (options?.recordHistory === false) {
          futureRef.current = [];
          changeType = "state-only";
          return draft;
        }
        historyRef.current.push(cloneTemplate(previous));
        if (historyRef.current.length > MAX_HISTORY_LENGTH) {
          historyRef.current.shift();
        }
        futureRef.current = [];
        changeType = "history";
        return draft;
      });
      if (changeType !== "none") {
      pendingHistorySnapshotRef.current = null;
        updateHistoryIndicators();
      }
    },
    [updateHistoryIndicators],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(ASSET_LIBRARY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredAsset[];
      if (!Array.isArray(parsed)) return;
      const sanitized = parsed
        .filter((item): item is StoredAsset => Boolean(item) && typeof item.url === "string")
        .slice(0, MAX_LIBRARY_ITEMS);
      if (sanitized.length) {
        setStoredAssets(sanitized);
      }
    } catch (error) {
      console.warn("[Templates] Failed to parse asset library from storage", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ASSET_LIBRARY_STORAGE_KEY, JSON.stringify(storedAssets));
  }, [storedAssets]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
    };
  }, []);

  const handlePrefillContentUpdate = useCallback((key: string, updates: { text?: string; imageUrl?: string } | null) => {
    setPrefillContent((previous) => {
      if (!updates || (updates.text === undefined && updates.imageUrl === undefined)) {
        if (!previous || !(key in previous)) return previous;
        const next = { ...previous };
        delete next[key];
        return Object.keys(next).length ? next : null;
      }
      const next = { ...(previous ?? {}) };
      next[key] = { ...(next[key] ?? {}), ...updates };
      return next;
    });
  }, []);

  const handlePrefillContentRename = useCallback((previousKey: string, nextKey: string) => {
    if (previousKey === nextKey) return;
    setPrefillContent((previous) => {
      if (!previous || !(previousKey in previous)) return previous;
      const next = { ...previous };
      const value = next[previousKey];
      delete next[previousKey];
      next[nextKey] = { ...(next[nextKey] ?? {}), ...value };
      return Object.keys(next).length ? next : null;
    });
  }, []);

  const recordAssetInLibrary = useCallback((url: string, name?: string | null) => {
    if (!url) return;
    setStoredAssets((previous) => {
      const sanitized = previous.filter(
        (item): item is StoredAsset => Boolean(item) && typeof item.url === "string",
      );
      const existing = sanitized.find((item) => item.url === url);
      const entry: StoredAsset = {
        url,
        uploadedAt: Date.now(),
        name: name ?? existing?.name ?? null,
      };
      const next = [entry, ...sanitized.filter((item) => item.url !== url)];
      return next.slice(0, MAX_LIBRARY_ITEMS);
    });
  }, []);

  const uploadTemplateAsset = useCallback(
    async (file: File) => {
      if (!selectedBusiness?.id) {
        toast.error("Select a business before uploading assets.");
        return null;
      }
      try {
        const data = new FormData();
        data.append("background", file);
        const response = await api.post(`${endpoints.template}/${selectedBusiness.id}/upload`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const { url } = response.data as { url: string };
        return url;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload asset";
        toast.error(message);
        return null;
      }
    },
    [selectedBusiness?.id],
  );

  const handleUndo = useCallback(() => {
    let restored: Template | null = null;
    setEditorTemplate((previous) => {
      if (!previous) return previous;
      const snapshot = historyRef.current.pop();
      if (!snapshot) return previous;
      futureRef.current.push(cloneTemplate(previous));
      restored = snapshot;
      return snapshot;
    });
    if (restored) {
      pendingHistorySnapshotRef.current = null;
      updateHistoryIndicators();
    }
  }, [updateHistoryIndicators]);

  const handleRedo = useCallback(() => {
    let restored: Template | null = null;
    setEditorTemplate((previous) => {
      if (!previous) return previous;
      const snapshot = futureRef.current.pop();
      if (!snapshot) return previous;
      historyRef.current.push(cloneTemplate(previous));
      if (historyRef.current.length > MAX_HISTORY_LENGTH) {
        historyRef.current.shift();
      }
      restored = snapshot;
      return snapshot;
    });
    if (restored) {
      pendingHistorySnapshotRef.current = null;
      updateHistoryIndicators();
    }
  }, [updateHistoryIndicators]);

  useEffect(() => {
    if (businesses.length === 0) {
      if (activeBusinessId !== NEW_BUSINESS_ID) {
        setActiveBusinessId(NEW_BUSINESS_ID);
      }
      return;
    }
    if (!activeBusinessId || activeBusinessId === NEW_BUSINESS_ID) {
      setActiveBusinessId(businesses[0].id);
      return;
    }
    const exists = businesses.some((item) => item.id === activeBusinessId);
    if (!exists) {
      setActiveBusinessId(businesses[0].id);
    }
  }, [businesses, activeBusinessId, setActiveBusinessId]);

  const {
    data: templates = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.templates(selectedBusiness?.id),
    queryFn: () => fetchTemplates(selectedBusiness?.id),
    enabled: Boolean(selectedBusiness?.id),
    placeholderData: [],
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasOpenedFromQuery = useRef(false);
  const returnToRef = useRef<string | null>(null);

  const handleBusinessChange = (value: string) => {
    if (value === NEW_BUSINESS_ID) {
      setActiveBusinessId(NEW_BUSINESS_ID);
      router.push("/dashboard/business");
      return;
    }
    setActiveBusinessId(value);
  };

  const selectValue =
    selectedBusiness?.id ?? (activeBusinessId === NEW_BUSINESS_ID ? NEW_BUSINESS_ID : "");

  const openTemplateEditor = (
    template: Template,
    options?: { prefill?: Record<string, { text?: string; imageUrl?: string }> | null; returnTo?: string | null },
  ) => {
    resetHistory();
    const nextDimensions = resolveCanvasDimensions({
      canvasPreset: template.canvasPreset,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      orientation: template.orientation,
    });
    const targetPreviewWidth = 420;
    const initialScale = Math.max(
      0.2,
      Math.min(1, Number((targetPreviewWidth / nextDimensions.width).toFixed(2))),
    );
    setEditorTemplate({
      ...template,
      backgroundUrl: template.backgroundUrl ?? undefined,
      backgroundColor: template.backgroundColor ?? undefined,
    });
    setCanvasScale(initialScale);
    setPrefillContent(options?.prefill ?? null);
    returnToRef.current = options?.returnTo ?? null;
    setEditorOpen(true);
  };

  useEffect(() => {
    if (!isEditorOpen) {
      stageRef.current = null;
      setShowPlaceholderGuides(true);
    }
  }, [isEditorOpen]);

  const createForm = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
    canvasPreset: DEFAULT_CANVAS_PRESET_ID,
      tags: "social, launch",
      emotionFit: "joy, trust",
    },
  });
const createFormPresetId = createForm.watch("canvasPreset");
const createFormPreset = useMemo(
  () => findCanvasPresetById(createFormPresetId) ?? CANVAS_PRESETS[0],
  [createFormPresetId],
);

  const createTemplate = useMutation({
    mutationFn: async (values: TemplateForm) => {
      if (!selectedBusiness?.id) throw new Error("Select a business first");
      const preset = findCanvasPresetById(values.canvasPreset) ?? CANVAS_PRESETS[0];
      const margin = Math.max(48, Math.round(preset.width * 0.06));
      const titleFontSize = Math.max(36, Math.round(preset.height * 0.065));
      const subtitleFontSize = Math.max(20, Math.round(preset.height * 0.04));
      const verticalSpacing = Math.max(24, Math.round(titleFontSize * 0.6));
      const baseTitleY = Math.max(60, Math.round(preset.height * 0.12));
      const imageWidth = Math.max(
        220,
        Math.round(
          preset.width *
            (preset.orientation === "story"
              ? 0.58
              : preset.orientation === "wide"
                ? 0.36
                : 0.42),
        ),
      );
      const imageHeight = Math.max(
        220,
        Math.round(
          preset.height *
            (preset.orientation === "story"
              ? 0.36
              : preset.orientation === "wide"
                ? 0.56
                : 0.38),
        ),
      );

      const layoutConfig = (() => {
        if (preset.orientation === "wide") {
          const titleMaxWidth = Math.max(340, Math.round(preset.width * 0.42));
          return {
            title: {
              x: margin,
              y: baseTitleY,
              maxWidth: titleMaxWidth,
              align: "left" as const,
            },
            subtitle: {
              x: margin,
              y: baseTitleY + titleFontSize + verticalSpacing,
              maxWidth: titleMaxWidth,
              align: "left" as const,
            },
            image: {
              x: Math.max(margin, preset.width - imageWidth - margin),
              y: Math.round((preset.height - imageHeight) / 2),
            },
          };
        }

        if (preset.orientation === "story") {
          const titleMaxWidth = Math.max(360, Math.round(preset.width * 0.78));
          const centeredX = Math.round((preset.width - titleMaxWidth) / 2);
          return {
            title: {
              x: centeredX,
              y: baseTitleY,
              maxWidth: titleMaxWidth,
              align: "center" as const,
            },
            subtitle: {
              x: centeredX,
              y: baseTitleY + titleFontSize + verticalSpacing,
              maxWidth: titleMaxWidth,
              align: "center" as const,
            },
            image: {
              x: Math.round((preset.width - imageWidth) / 2),
              y: Math.round(
                baseTitleY + titleFontSize + subtitleFontSize + verticalSpacing * 3,
              ),
            },
          };
        }

        const titleMaxWidth = Math.max(360, Math.round(preset.width * 0.64));
        const centeredX = Math.round((preset.width - titleMaxWidth) / 2);
        return {
          title: {
            x: centeredX,
            y: baseTitleY,
            maxWidth: titleMaxWidth,
            align: "center" as const,
          },
          subtitle: {
            x: centeredX,
            y: baseTitleY + titleFontSize + verticalSpacing,
            maxWidth: titleMaxWidth,
            align: "center" as const,
          },
          image: {
            x: Math.round((preset.width - imageWidth) / 2),
            y: Math.round(
              baseTitleY + titleFontSize + subtitleFontSize + verticalSpacing * 3,
            ),
          },
        };
      })();

      const imageY = Math.min(layoutConfig.image.y, preset.height - imageHeight - margin);
      const payload = {
        name: values.name,
        orientation: preset.orientation,
        canvasPreset: preset.id,
        canvasWidth: preset.width,
        canvasHeight: preset.height,
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
        tags: values.tags?.split(",").map((tag) => tag.trim()) ?? [],
        emotionFit: values.emotionFit?.split(",").map((emotion) => emotion.trim()) ?? ["joy"],
        placeholders: [
          {
            key: "title",
            type: "text",
            x: layoutConfig.title.x,
            y: layoutConfig.title.y,
            fontSize: titleFontSize,
            color: "#ffffff",
            maxWidth: layoutConfig.title.maxWidth,
            fontFamily: "Inter",
            fontWeight: "bold",
            letterSpacing: 0,
            lineHeight: 1.2,
            opacity: 1,
            rotation: 0,
            locked: false,
            align: layoutConfig.title.align,
          },
          {
            key: "subtitle",
            type: "text",
            x: layoutConfig.subtitle.x,
            y: layoutConfig.subtitle.y,
            fontSize: subtitleFontSize,
            color: "#e2e8f0",
            maxWidth: layoutConfig.subtitle.maxWidth,
            fontFamily: "Inter",
            fontWeight: "normal",
            letterSpacing: 0,
            lineHeight: 1.3,
            opacity: 1,
            rotation: 0,
            locked: false,
            align: layoutConfig.subtitle.align,
          },
          {
            key: "image",
            type: "image",
            x: layoutConfig.image.x,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
            opacity: 1,
            rotation: 0,
            locked: false,
          },
        ] satisfies TemplatePlaceholder[],
      };
      const response = await api.post(`${endpoints.template}/${selectedBusiness.id}`, payload);
      return response.data as Template;
    },
    onSuccess: () => {
      toast.success("Template created");
      createForm.reset({
        name: "",
        canvasPreset: DEFAULT_CANVAS_PRESET_ID,
        tags: "social, launch",
        emotionFit: "joy, trust",
      });
      void refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create template"),
  });

  const saveTemplate = useMutation({
    mutationFn: async (updated: Template) => {
      const payload: Template = {
        ...updated,
        backgroundUrl: updated.backgroundUrl ?? undefined,
        backgroundColor: updated.backgroundColor ?? undefined,
      };

      if (payload.backgroundUrl === undefined) {
        // Avoid sending null to the API – undefined will be stripped from the payload
        // ensuring templates without backgrounds don't trigger validation errors.
        delete (payload as Partial<Template>).backgroundUrl;
      }
      if (payload.backgroundColor === undefined) {
        delete (payload as Partial<Template>).backgroundColor;
      }
      if (payload.canvasPreset === undefined) {
        delete (payload as Partial<Template>).canvasPreset;
      }
      if (payload.canvasWidth === undefined) {
        delete (payload as Partial<Template>).canvasWidth;
      }
      if (payload.canvasHeight === undefined) {
        delete (payload as Partial<Template>).canvasHeight;
      }

      const response = await api.put(`${endpoints.template}/${updated.businessId}/${updated.id}`, payload);
      return response.data as Template;
    },
    onSuccess: () => {
      toast.success("Template updated");
      void refetch();
      setEditorOpen(false);
      resetHistory();
      const destination = returnToRef.current;
      if (destination) {
        returnToRef.current = null;
        router.push(destination);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update template"),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (template: Template) => {
      await api.delete(`${endpoints.template}/${template.businessId}/${template.id}`);
    },
    onMutate: (template) => {
      setDeletingTemplateId(template.id);
    },
    onSuccess: (_data, variables) => {
      toast.success("Template deleted");
      if (editorTemplate?.id === variables.id) {
        setEditorOpen(false);
        setEditorTemplate(null);
      }
      void refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete template");
    },
    onSettled: () => {
      setDeletingTemplateId(null);
    },
  });

  const handlePlaceholderUpdate = (
    placeholders: TemplatePlaceholder[],
    options?: { recordHistory?: boolean },
  ) => {
    const clonePlaceholders = () =>
      placeholders.map((placeholder) => ({
        ...placeholder,
        dashPattern: placeholder.dashPattern ? [...placeholder.dashPattern] : undefined,
      }));

    if (options?.recordHistory === false) {
      let didChange = false;
      setEditorTemplate((previous) => {
        if (!previous) return previous;
        const nextPlaceholders = clonePlaceholders();
        const nextTemplate: Template = { ...previous, placeholders: nextPlaceholders };
        if (templatesAreEqual(previous, nextTemplate)) {
          return previous;
        }
        if (!pendingHistorySnapshotRef.current) {
          pendingHistorySnapshotRef.current = cloneTemplate(previous);
        }
        didChange = true;
        return nextTemplate;
      });
      if (didChange) {
        if (futureRef.current.length > 0) {
          futureRef.current = [];
        }
        updateHistoryIndicators();
      }
      return;
    }

    let didChange = false;
    setEditorTemplate((previous) => {
      if (!previous) return previous;
      const nextPlaceholders = clonePlaceholders();
      const nextTemplate: Template = { ...previous, placeholders: nextPlaceholders };
      if (templatesAreEqual(previous, nextTemplate)) {
        pendingHistorySnapshotRef.current = null;
        return previous;
      }

      const snapshot = pendingHistorySnapshotRef.current ?? cloneTemplate(previous);
      historyRef.current.push(snapshot);
      if (historyRef.current.length > MAX_HISTORY_LENGTH) {
        historyRef.current.shift();
      }
      pendingHistorySnapshotRef.current = null;
      futureRef.current = [];
      didChange = true;
      return nextTemplate;
    });
    if (didChange) {
      updateHistoryIndicators();
    }
  };

  const handlePlaceholderChange = (index: number, updates: Partial<TemplatePlaceholder>) => {
    commitTemplateChange((draft) => {
      if (!draft.placeholders[index]) return;
      draft.placeholders[index] = {
        ...draft.placeholders[index],
        ...updates,
      };
    });
  };

  const handleFrameStyleChange = (updates: Partial<Template>) => {
    commitTemplateChange((draft) => {
      Object.assign(draft, updates);
    });
  };

  useEffect(() => {
    if (hasOpenedFromQuery.current) return;
    const templateId = searchParams.get("templateId");
    if (!templateId) return;
    const match = templates.find((template) => template.id === templateId);
    if (!match) return;
    const contentParam = searchParams.get("content");
    const returnToParam = searchParams.get("returnTo");
    const returnTo = returnToParam ? decodeURIComponent(returnToParam) : null;
    let prefill: Record<string, { text?: string; imageUrl?: string }> | null = null;
    if (contentParam) {
      try {
        prefill = JSON.parse(contentParam) as Record<string, { text?: string; imageUrl?: string }>;
      } catch {
        prefill = null;
      }
    }
    openTemplateEditor(match, { prefill, returnTo });
    hasOpenedFromQuery.current = true;
    router.replace("/dashboard/templates", { scroll: false });
  }, [router, searchParams, templates]);

  const handleAddPlaceholder = (
    type: TemplatePlaceholder["type"],
    options?: { shape?: TemplatePlaceholder["shape"]; imageUrl?: string },
  ) => {
    let insertedKey: string | null = null;
    commitTemplateChange((draft) => {
      const typeCount = draft.placeholders.filter((placeholder) => placeholder.type === type).length;
      const baseKey = type === "text" ? "text" : type === "image" ? "image" : "shape";
      const key = createUniquePlaceholderKey(draft.placeholders, `${baseKey}-${typeCount + 1}`);
      const basePositions =
        type === "text"
          ? { x: 60, y: 80 + typeCount * 70 }
          : { x: 140, y: 180 + typeCount * 150 };
      const newZIndex = draft.placeholders.reduce((max, placeholder) => Math.max(max, placeholder.zIndex ?? 0), 0) + 1;

      let newPlaceholder: TemplatePlaceholder;
      if (type === "text") {
        newPlaceholder = {
          key,
          type: "text",
          x: basePositions.x,
          y: basePositions.y,
          fontSize: 32,
          color: "#ffffff",
          maxWidth: 320,
          fontFamily: "Inter",
          fontWeight: "bold",
          letterSpacing: 0,
          lineHeight: 1.2,
          opacity: 1,
          rotation: 0,
          locked: false,
          zIndex: newZIndex,
        };
      } else if (type === "image") {
        newPlaceholder = {
          key,
          type: "image",
          x: basePositions.x,
          y: basePositions.y,
          width: 220,
          height: 220,
          opacity: 1,
          rotation: 0,
          locked: false,
          zIndex: newZIndex,
          imageUrl: options?.imageUrl,
        };
      } else {
        const shape = options?.shape ?? "rectangle";
        if (shape === "circle") {
          newPlaceholder = {
            key,
            type: "shape",
            x: basePositions.x,
            y: basePositions.y,
            shape: "circle",
            width: 200,
            height: 200,
            fillColor: "#f97316",
            borderColor: "#1e293b",
            borderWidth: 0,
            borderRadius: undefined,
            dashPattern: undefined,
            opacity: 1,
            rotation: 0,
            locked: false,
            zIndex: newZIndex,
          };
        } else if (shape === "triangle") {
          newPlaceholder = {
            key,
            type: "shape",
            x: basePositions.x,
            y: basePositions.y,
            shape: "triangle",
            width: 260,
            height: 220,
            fillColor: "#0ea5e9",
            borderColor: "#0ea5e9",
            borderWidth: 0,
            borderRadius: undefined,
            dashPattern: undefined,
            opacity: 1,
            rotation: 0,
            locked: false,
            zIndex: newZIndex,
          };
        } else if (shape === "line") {
          newPlaceholder = {
            key,
            type: "shape",
            x: basePositions.x,
            y: basePositions.y,
            shape: "line",
            width: 260,
            height: 6,
            fillColor: "#3b82f6",
            borderColor: "#3b82f6",
            borderWidth: 6,
            borderRadius: undefined,
            dashPattern: undefined,
            opacity: 1,
            rotation: 0,
            locked: false,
            zIndex: newZIndex,
          };
        } else {
          newPlaceholder = {
            key,
            type: "shape",
            x: basePositions.x,
            y: basePositions.y,
            shape: "rectangle",
            width: 240,
            height: 160,
            fillColor: "#60a5fa",
            borderColor: "#1e293b",
            borderWidth: 2,
            borderRadius: 32,
            dashPattern: undefined,
            opacity: 1,
            rotation: 0,
            locked: false,
            zIndex: newZIndex,
          };
        }
      }

      draft.placeholders.push(newPlaceholder);
      insertedKey = newPlaceholder.key;
    });
    if (type === "image" && options?.imageUrl && insertedKey) {
      handlePrefillContentUpdate(insertedKey, { imageUrl: options.imageUrl });
    }
  };

  const handlePlaceholderDuplicate = (index: number) => {
    commitTemplateChange((draft) => {
      const original = draft.placeholders[index];
      if (!original) return;
      const baseKey = `${original.key}-copy`;
      const uniqueKey = createUniquePlaceholderKey(draft.placeholders, baseKey);
      const duplicate: TemplatePlaceholder = {
        ...original,
        key: uniqueKey,
        x: original.x + 24,
        y: original.y + 24,
        locked: false,
        opacity: original.opacity ?? 1,
        rotation: original.rotation ?? 0,
        dashPattern: original.dashPattern ? [...original.dashPattern] : undefined,
      };
      draft.placeholders.splice(index + 1, 0, duplicate);
    });
  };

  const handlePlaceholderDelete = (index: number) => {
    commitTemplateChange((draft) => {
      draft.placeholders = draft.placeholders.filter((_, idx) => idx !== index);
    });
  };

  const handlePlaceholderReorder = (index: number, direction: "up" | "down") => {
    commitTemplateChange((draft) => {
      if (direction === "up" && index > 0) {
        [draft.placeholders[index - 1], draft.placeholders[index]] = [
          draft.placeholders[index],
          draft.placeholders[index - 1],
        ];
      }
      if (direction === "down" && index < draft.placeholders.length - 1) {
        [draft.placeholders[index + 1], draft.placeholders[index]] = [
          draft.placeholders[index],
          draft.placeholders[index + 1],
        ];
      }
    });
  };

  const handlePlaceholderLockToggle = (index: number) => {
    commitTemplateChange((draft) => {
      if (!draft.placeholders[index]) return;
      draft.placeholders[index] = {
        ...draft.placeholders[index],
        locked: !draft.placeholders[index].locked,
      };
    });
  };

  const handleBackgroundUpload = async (file: File) => {
    const url = await uploadTemplateAsset(file);
    if (!url) return;
    toast.success("Background uploaded");
    recordAssetInLibrary(url, file.name);
    commitTemplateChange((draft) => {
      draft.backgroundUrl = url;
    });
  };

  const handleBackgroundImageClear = () => {
    commitTemplateChange((draft) => {
      draft.backgroundUrl = undefined;
    });
  };

  const handleBackgroundColorChange = (value: string) => {
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(value)) {
      return;
    }
    commitTemplateChange((draft) => {
      draft.backgroundColor = value.toLowerCase();
    });
  };

  const handleBackgroundColorReset = () => {
    commitTemplateChange((draft) => {
      draft.backgroundColor = DEFAULT_BACKGROUND_COLOR;
    });
  };

  const handleImagePlaceholderUpload = async (index: number, file: File) => {
    const url = await uploadTemplateAsset(file);
    if (!url) return "";
    toast.success("Image uploaded");
    recordAssetInLibrary(url, file.name);
    let placeholderKey: string | null = null;
    commitTemplateChange((draft) => {
      const placeholder = draft.placeholders[index];
      if (!placeholder) return;
      placeholder.imageUrl = url;
      placeholderKey = placeholder.key;
    });
    if (placeholderKey) {
      handlePrefillContentUpdate(placeholderKey, { imageUrl: url });
    }
    return url;
  };

  const handleAssetLibraryUpload = async (file: File) => {
    const url = await uploadTemplateAsset(file);
    if (!url) return;
    recordAssetInLibrary(url, file.name);
    toast.success("Asset uploaded to library");
  };

  const handleAssetRemove = (url: string) => {
    setStoredAssets((previous) => {
      if (!previous.some((item) => item.url === url)) return previous;
      toast.success("Removed from library");
      return previous.filter((item) => item.url !== url);
    });
  };

  const handleApplyAssetToBackground = (url: string) => {
    if (!editorTemplate) {
      toast.error("Select a template before updating the background.");
      return;
    }
    recordAssetInLibrary(url);
    commitTemplateChange((draft) => {
      draft.backgroundUrl = url;
    });
    toast.success("Background updated");
    setActivePanel("images");
  };

  const handleInsertAssetAsPlaceholder = (url: string) => {
    if (!editorTemplate) {
      toast.error("Select a template before adding placeholders.");
      return;
    }
    recordAssetInLibrary(url);
    handleAddPlaceholder("image", { imageUrl: url });
    toast.success("Image placeholder added");
    setActivePanel("images");
  };

  const handleCopyAssetUrl = async (url: string) => {
    if (!navigator?.clipboard?.writeText) {
      toast.error("Clipboard not available. Copy manually instead.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAssetUrl(url);
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
      copyResetRef.current = setTimeout(() => setCopiedAssetUrl(null), 2000);
    } catch {
      toast.error("Clipboard not available. Copy manually instead.");
    }
  };

  const handleOpenAsset = (url: string) => {
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const assetDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  );

  const assetLibraryItems = useMemo(() => {
    const map = new Map<
      string,
      { url: string; uploadedAt: number; name?: string | null; sources: Set<AssetSource> }
    >();

    const add = (
      rawUrl: string | undefined,
      source: AssetSource,
      meta?: { uploadedAt?: number; name?: string | null },
    ) => {
      if (!rawUrl) return;
      const url = rawUrl.trim();
      if (!url) return;
      const existing = map.get(url);
      if (existing) {
        existing.sources.add(source);
        if (meta?.uploadedAt && meta.uploadedAt > existing.uploadedAt) {
          existing.uploadedAt = meta.uploadedAt;
        }
        if (meta?.name && !existing.name) {
          existing.name = meta.name;
        }
        return;
      }
      map.set(url, {
        url,
        uploadedAt: meta?.uploadedAt ?? 0,
        name: meta?.name ?? null,
        sources: new Set<AssetSource>([source]),
      });
    };

    storedAssets.forEach((item) =>
      add(item.url, "library", { uploadedAt: item.uploadedAt, name: item.name ?? null }),
    );

    if (editorTemplate?.backgroundUrl) {
      add(editorTemplate.backgroundUrl, "template-background");
    }

    editorTemplate?.placeholders.forEach((placeholder) => {
      if (placeholder.type === "image" && placeholder.imageUrl) {
        add(placeholder.imageUrl, "template-placeholder");
      }
    });

    if (prefillContent) {
      Object.values(prefillContent).forEach((entry) => {
        if (entry?.imageUrl) {
          add(entry.imageUrl, "prefill");
        }
      });
    }

    const storedUrls = new Set(storedAssets.map((item) => item.url));

    const priority = (sources: AssetSource[]) => {
      if (sources.includes("library")) return 3;
      if (sources.includes("template-background")) return 2;
      if (sources.includes("template-placeholder")) return 1;
      return 0;
    };

    const deriveName = (url: string, name?: string | null) => {
      if (name) return name;
      try {
        const segments = url.split("/");
        return decodeURIComponent(segments[segments.length - 1] ?? url);
      } catch {
        return url;
      }
    };

    return Array.from(map.values())
      .map((item) => ({
        url: item.url,
        uploadedAt: item.uploadedAt,
        name: deriveName(item.url, item.name),
        sources: Array.from(item.sources),
        isLibraryManaged: storedUrls.has(item.url),
      }))
      .sort((a, b) => {
        const priorityDiff = priority(b.sources) - priority(a.sources);
        if (priorityDiff !== 0) return priorityDiff;
        return b.uploadedAt - a.uploadedAt;
      });
  }, [storedAssets, editorTemplate, prefillContent]);

  const emotionTags = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((template) => template.emotionFit.forEach((emotion) => set.add(emotion)));
    return Array.from(set);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return templates;
    const query = templateSearch.toLowerCase();
    return templates.filter((template) => template.name.toLowerCase().includes(query));
  }, [templates, templateSearch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isEditorOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return;
  }, [isEditorOpen]);

  const adjustZoom = (direction: "in" | "out") => {
    setCanvasScale((prev) => {
      const delta = 0.05;
      const next = direction === "in" ? prev + delta : prev - delta;
      return Math.max(0.2, Math.min(Number(next.toFixed(2)), 1));
    });
  };

  const handleCanvasScaleChange = useCallback((value: number) => {
    setCanvasScale(Math.max(0.2, Math.min(Number(value.toFixed(3)), 1)));
  }, []);

  const handleCanvasPresetChange = useCallback(
    (presetId: string) => {
      const preset = findCanvasPresetById(presetId);
      if (!preset) return;
      commitTemplateChange((draft) => {
        draft.orientation = preset.orientation;
        draft.canvasPreset = preset.id;
        draft.canvasWidth = preset.width;
        draft.canvasHeight = preset.height;
      });
      const targetPreviewWidth = 420;
      const computedScale = Math.max(
        0.2,
        Math.min(1, Number((targetPreviewWidth / preset.width).toFixed(2))),
      );
      setCanvasScale(computedScale);
    },
    [commitTemplateChange],
  );

  const handleTemplateSelect = (template: Template) => {
    resetHistory();
    const nextDimensions = resolveCanvasDimensions({
      canvasPreset: template.canvasPreset,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      orientation: template.orientation,
    });
    const targetPreviewWidth = 420;
    const nextScale = Math.max(
      0.2,
      Math.min(1, Number((targetPreviewWidth / nextDimensions.width).toFixed(2))),
    );
    setEditorTemplate({
      ...template,
      backgroundUrl: template.backgroundUrl ?? undefined,
      backgroundColor: template.backgroundColor ?? undefined,
    });
    setCanvasScale(nextScale);
    setPrefillContent(null);
  };

  const createUniquePlaceholderKey = (
    placeholders: TemplatePlaceholder[],
    baseKey: string,
    ignoreIndex?: number,
  ) => {
    const existingKeys = new Set(
      placeholders.filter((_, idx) => idx !== ignoreIndex).map((placeholder) => placeholder.key),
    );
    if (!existingKeys.has(baseKey)) {
      return baseKey;
    }
    let counter = 2;
    let candidate = `${baseKey}-${counter}`;
    while (existingKeys.has(candidate)) {
      counter += 1;
      candidate = `${baseKey}-${counter}`;
    }
    return candidate;
  };

  const handleGridSizeChange = (value: number) => {
    if (Number.isNaN(value)) return;
    const clamped = Math.min(240, Math.max(5, Math.round(value)));
    setGridSize(clamped);
  };

  const waitForNextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "template";

  const handleTemplateDownload = async (format: "png" | "json") => {
    if (!editorTemplate) {
      toast.error("Select a template to download.");
      return;
    }

    const filenameBase = slugify(editorTemplate.name);

    if (format === "json") {
      const exportPayload = {
        ...editorTemplate,
        backgroundUrl: editorTemplate.backgroundUrl ?? null,
        backgroundColor: editorTemplate.backgroundColor ?? null,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filenameBase}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Template JSON downloaded");
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      toast.error("Preview is still loading. Try again in a moment.");
      return;
    }

    const guidesWereVisible = showPlaceholderGuides;
    if (guidesWereVisible) {
      setShowPlaceholderGuides(false);
      await waitForNextFrame();
    }

    try {
      const { width: resolvedWidth } = resolveCanvasDimensions({
        canvasPreset: editorTemplate.canvasPreset,
        canvasWidth: editorTemplate.canvasWidth,
        canvasHeight: editorTemplate.canvasHeight,
        orientation: editorTemplate.orientation,
      });
      const currentWidth = stage.width();
      const pixelRatio =
        currentWidth > 0 ? Math.max(1, resolvedWidth / currentWidth) : Math.max(1, 1 / Math.max(canvasScale, 0.01));
      const dataUrl = stage.toDataURL({ pixelRatio });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${filenameBase}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Template PNG downloaded");
    } catch (error) {
      console.error("Failed to export template as PNG", error);
      toast.error("Unable to download image. Ensure background assets allow downloads.");
    } finally {
      if (guidesWereVisible) {
        await waitForNextFrame();
        setShowPlaceholderGuides(true);
      }
    }
  };

  const handleTemplatedPrefill = useCallback(
    (prefill: Record<string, { text?: string; imageUrl?: string }> | null) => {
      if (!prefill) return;
      const nextPrefill = { ...prefill };
      Object.keys(nextPrefill).forEach((key) => {
        if (nextPrefill[key].imageUrl) {
          nextPrefill[key].imageUrl = nextPrefill[key].imageUrl.replace(/^https?:\/\//, "");
        }
      });
      return nextPrefill;
    },
    [],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Template builder</h1>
          <p className="text-sm text-slate-500">
            Upload backgrounds, refine placeholders, and give DeepSeek the perfect stage for your copy.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={selectValue || undefined}
            onValueChange={handleBusinessChange}
            disabled={businesses.length === 0}
          >
            <SelectTrigger className="min-w-[220px] rounded-xl border border-slate-200 bg-white text-left text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <SelectValue placeholder="Choose a business" />
            </SelectTrigger>
            <SelectContent align="end" className="max-h-80 min-w-[240px]">
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_BUSINESS_ID} className="text-blue-600 focus:text-blue-600">
                <span className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Create new business
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setActiveBusinessId(NEW_BUSINESS_ID);
              router.push("/dashboard/business");
            }}
          >
            Manage businesses
          </Button>
        </div>
      </div>

      <Tabs defaultValue="gallery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/40">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="create">Create new</TabsTrigger>
        </TabsList>
        <TabsContent value="gallery" className="space-y-4">
          {!selectedBusiness ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
              Select or create a business to view its template library.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {emotionTags.map((emotion) => (
                  <EmotionBadge key={emotion} emotion={emotion} />
                ))}
              </div>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-72 rounded-3xl" />
                  ))}
                </div>
              ) : filteredTemplates.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={(value) => {
                        openTemplateEditor(value);
                      }}
                      onUse={() => {
                        toast.info("Template will be applied on the next AI generation run.");
                      }}
                      onDelete={(value) => {
                        toast.custom(
                          (toastId) => {
                            const target = value;
                            return (
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Delete "{target.name}"?</p>
                              <p className="text-xs text-slate-500">
                                This removes the template permanently. Any posts already using it will need a new template.
                              </p>
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => toast.dismiss(toastId)}>
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 text-white hover:bg-red-700"
                                  onClick={() => {
                                    toast.dismiss(toastId);
                                    deleteTemplateMutation.mutate(target);
                                  }}
                                  disabled={deleteTemplateMutation.isPending && deletingTemplateId === target.id}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            );
                          },
                          { id: `confirm-delete-${template.id}`, duration: 10000 },
                        );
                      }}
                      isDeleting={deleteTemplateMutation.isPending && deletingTemplateId === template.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                  No templates yet. Use the "Create new" tab to design the first template for this business.
                </div>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="create">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader>
              <CardTitle>Create a template</CardTitle>
              <CardDescription>
                {selectedBusiness
                  ? `Templates created here will be tied to ${selectedBusiness.name}.`
                  : "Choose a business to enable template creation."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedBusiness ? (
                <Form {...createForm}>
                  <form
                    onSubmit={createForm.handleSubmit((values) => createTemplate.mutate(values))}
                    className="grid gap-6 md:grid-cols-2"
                  >
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template name</FormLabel>
                          <FormControl>
                            <Input placeholder="Story - Bold announcement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="canvasPreset"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canvas preset</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose a preset" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent align="start" className="max-h-80 min-w-[18rem]">
                              {CANVAS_PRESETS.map((preset) => (
                                <SelectItem key={preset.id} value={preset.id}>
                                  <span className="flex flex-col text-left">
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                      {preset.label}
                                    </span>
                                    {preset.description ? (
                                      <span className="text-xs text-slate-500">{preset.description}</span>
                                    ) : null}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {createFormPreset ? (
                            <p className="text-xs text-slate-500">
                              {formatDimensions(createFormPreset.width, createFormPreset.height)} • {createFormPreset.orientation.toUpperCase()}
                            </p>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input placeholder="social, promo, instagram" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="emotionFit"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Emotion fit</FormLabel>
                          <FormControl>
                            <Input placeholder="joy, trust" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      disabled={!selectedBusiness || createTemplate.isPending}
                    >
                      {createTemplate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusIcon className="mr-2 h-4 w-4" />}
                      Save template
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                  Select or create a business to start designing templates.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-900">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white dark:text-slate-50">AI</div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Template Editor</p>
                <h2 className="text-lg font-semibold">{editorTemplate?.name ?? "Template preview"}</h2>
              </div>
              {editorTemplate && activeCanvas ? (
                <div className="flex flex-col items-start gap-1">
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
                  >
                    {formatDimensions(activeCanvas.width, activeCanvas.height)}
                  </Badge>
                  {activeCanvas.preset ? (
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {activeCanvas.preset.label.split(" (")[0]}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={handleUndo}
                disabled={!historyStatus.canUndo}
                title={historyStatus.canUndo ? "Undo last change" : "Nothing to undo"}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={handleRedo}
                disabled={!historyStatus.canRedo}
                title={historyStatus.canRedo ? "Redo last undo" : "Nothing to redo"}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                    disabled={!editorTemplate}
                    title="Download template"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled={!editorTemplate} onClick={() => void handleTemplateDownload("png")}>
                    Download as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!editorTemplate} onClick={() => void handleTemplateDownload("json")}>
                    Download as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setEditorOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
            <aside className="hidden w-20 flex-col items-center gap-6 border-r border-slate-200 bg-slate-100 py-6 lg:flex dark:border-slate-900 dark:bg-slate-950/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-600 shadow-inner dark:bg-slate-900 dark:text-slate-200">
                <PanelsTopLeft className="h-5 w-5" />
              </div>
              <nav className="flex flex-1 flex-col items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <button
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    activePanel === "templates" &&
                      "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:bg-blue-600 dark:text-white",
                  )}
                  onClick={() => setActivePanel((current) => (current === "templates" ? null : "templates"))}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    activePanel === "text" &&
                      "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:bg-blue-600 dark:text-white",
                  )}
                  onClick={() => setActivePanel((current) => (current === "text" ? null : "text"))}
                >
                  <TypeIcon className="h-5 w-5" />
                </button>
                <button
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    activePanel === "elements" &&
                      "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:bg-blue-600 dark:text-white",
                  )}
                  onClick={() => setActivePanel((current) => (current === "elements" ? null : "elements"))}
                >
                  <Shapes className="h-5 w-5" />
                </button>
                <button
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    activePanel === "images" &&
                      "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:bg-blue-600 dark:text-white",
                  )}
                  onClick={() => setActivePanel((current) => (current === "images" ? null : "images"))}
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    activePanel === "uploads" &&
                      "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:bg-blue-600 dark:text-white",
                  )}
                  onClick={() => setActivePanel((current) => (current === "uploads" ? null : "uploads"))}
                >
                  <FolderUp className="h-5 w-5" />
                </button>
              </nav>
            </aside>

            <aside
              className={cn(
                "hidden flex-col bg-white transition-[width,opacity] duration-200 ease-out md:flex dark:bg-slate-950/60",
                activePanel
                  ? "w-80 border-r border-slate-200 opacity-100 dark:border-slate-900"
                  : "w-0 border-r-0 opacity-0 pointer-events-none",
              )}
            >
              {activePanel === "templates" && (
                <>
                  <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-900">
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-inner dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      <SearchIcon className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="search"
                        value={templateSearch}
                        onChange={(event) => setTemplateSearch(event.target.value)}
                        placeholder="Search templates..."
                        className="flex-1 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    <div className="grid gap-4">
                      {filteredTemplates.length ? (
                        filteredTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template)}
                            className={cn(
                              "group overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3 text-left transition hover:border-blue-400/60 hover:bg-slate-50 dark:border-transparent dark:bg-slate-900/60 dark:hover:border-blue-500/40 dark:hover:bg-slate-900",
                              editorTemplate?.id === template.id
                                ? "border-blue-500/60 dark:border-blue-500/60"
                                : "",
                            )}
                          >
                            <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-900/60 dark:bg-slate-900">
                              {template.backgroundUrl ? (
                                <Image
                                  src={template.backgroundUrl}
                                  alt={template.name}
                                  fill
                                  className="object-cover transition group-hover:scale-105"
                                  sizes="(min-width: 768px) 320px, 100vw"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.18em] text-slate-500">
                                  No background
                                </div>
                              )}
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-100">{template.name}</p>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                              {template.orientation}
                            </p>
                          </button>
                        ))
                      ) : (
                        <p className="px-1 text-xs text-slate-500">No templates match that search.</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activePanel === "text" && (
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Text placeholders</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => handleAddPlaceholder("text")}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    {editorTemplate ? (
                      <TemplatePlaceholderList
                        template={editorTemplate}
                        onChange={handlePlaceholderChange}
                        filterType="text"
                        onTypeToggle={(type) => type === "image" && setActivePanel("images")}
                        onDuplicate={handlePlaceholderDuplicate}
                        onDelete={handlePlaceholderDelete}
                        onReorder={handlePlaceholderReorder}
                        onLockToggle={handlePlaceholderLockToggle}
                        content={prefillContent ?? undefined}
                        onContentUpdate={handlePrefillContentUpdate}
                        onContentRename={handlePrefillContentRename}
                      />
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <Skeleton key={index} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-900/60" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activePanel === "images" && (
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-5">
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Frame border</h3>
                        <ColorPicker
                          value={editorTemplate?.frameBorderColor ?? "#ffffff"}
                          onChange={(color) => handleFrameStyleChange({ frameBorderColor: color })}
                          label={null}
                          className="w-full sm:w-48 gap-0"
                          triggerClassName="h-9 justify-start"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-600">Border width</label>
                          <input
                            type="number"
                            min="0"
                            max="40"
                            value={editorTemplate?.frameBorderWidth ?? 0}
                            onChange={(event) => handleFrameStyleChange({ frameBorderWidth: Math.max(0, parseInt(event.target.value) || 0) })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-600">Border radius</label>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={editorTemplate?.frameBorderRadius ?? 0}
                            onChange={(event) => handleFrameStyleChange({ frameBorderRadius: Math.max(0, parseInt(event.target.value) || 0) })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Background</h3>
                      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <ColorPicker
                          value={editorTemplate?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR}
                          onChange={(color) => handleBackgroundColorChange(color)}
                          label="Fallback color"
                          className="w-full sm:w-64 gap-1"
                          triggerClassName="h-10 justify-start"
                        />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            onClick={handleBackgroundColorReset}
                          >
                            Use default
                          </Button>
                        </div>
                      </div>
                      <FileUpload
                        label="Upload PNG background"
                        onUpload={handleBackgroundUpload}
                        accept={["image/png", "image/jpeg", "image/webp"]}
                      />
                      {editorTemplate?.backgroundUrl ? (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Current background</p>
                          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                            <div className="relative h-48 w-full">
                              <Image
                                src={editorTemplate.backgroundUrl}
                                alt="Template background"
                                fill
                                className="object-cover"
                                sizes="(min-width: 768px) 320px, 100vw"
                                unoptimized
                                priority
                              />
                            </div>
                          </div>
                          <p className="break-all text-[11px] text-slate-500">{editorTemplate.backgroundUrl}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            onClick={handleBackgroundImageClear}
                          >
                            Remove background image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-500">
                            No background image selected. The fallback color will be used when rendering this template.
                          </p>
                          <div
                            className="h-20 rounded-2xl border border-dashed border-slate-300 shadow-inner dark:border-slate-700"
                            style={{
                              background: editorTemplate?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Image placeholders</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          onClick={() => handleAddPlaceholder("image")}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    {editorTemplate ? (
                      <TemplatePlaceholderList
                        template={editorTemplate}
                        onChange={handlePlaceholderChange}
                        filterType="image"
                        onTypeToggle={(type) => type === "text" && setActivePanel("text")}
                        onImageUpload={handleImagePlaceholderUpload}
                        onDuplicate={handlePlaceholderDuplicate}
                        onDelete={handlePlaceholderDelete}
                        onReorder={handlePlaceholderReorder}
                        onLockToggle={handlePlaceholderLockToggle}
                        content={prefillContent ?? undefined}
                        onContentUpdate={handlePrefillContentUpdate}
                        onContentRename={handlePrefillContentRename}
                      />
                      ) : (
                        <div className="space-y-2">
                          {Array.from({ length: 2 }).map((_, index) => (
                            <Skeleton key={index} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-900/60" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activePanel === "elements" && (
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-5">
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shapes</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-500/20"
                            onClick={() => handleAddPlaceholder("shape", { shape: "rectangle" })}
                          >
                            Add rectangle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-500/20"
                            onClick={() => handleAddPlaceholder("shape", { shape: "circle" })}
                          >
                            Add circle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-500/20"
                            onClick={() => handleAddPlaceholder("shape", { shape: "triangle" })}
                          >
                            Add triangle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-500/20"
                            onClick={() => handleAddPlaceholder("shape", { shape: "line" })}
                          >
                            Add line
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Layer shapes (rectangles, circles, triangles, lines) to build backgrounds, callouts, and accents. Use the list below to fine tune styling, order, and locking.
                      </p>
                    </div>
                    {editorTemplate ? (
                      <TemplatePlaceholderList
                        template={editorTemplate}
                        onChange={handlePlaceholderChange}
                        filterType="shape"
                        onDuplicate={handlePlaceholderDuplicate}
                        onDelete={handlePlaceholderDelete}
                        onReorder={handlePlaceholderReorder}
                        onLockToggle={handlePlaceholderLockToggle}
                        content={prefillContent ?? undefined}
                        onContentUpdate={handlePrefillContentUpdate}
                        onContentRename={handlePrefillContentRename}
                      />
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, index) => (
                          <Skeleton key={index} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-900/60" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activePanel === "uploads" && (
                <div className="flex h-full flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Asset uploads
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Drop branded imagery to reuse it across backgrounds and image placeholders.
                    </p>
                    <FileUpload
                      label="Upload brand asset"
                      onUpload={handleAssetLibraryUpload}
                      accept={["image/png", "image/jpeg", "image/webp"]}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Library
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {assetLibraryItems.length} asset{assetLibraryItems.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {assetLibraryItems.length ? (
                      <div className="grid gap-3">
                        {assetLibraryItems.map((asset) => (
                          <div
                            key={asset.url}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-blue-400/40"
                          >
                            <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                              <Image
                                src={asset.url}
                                alt={asset.name}
                                fill
                                className="object-cover"
                                sizes="(min-width: 768px) 320px, 100vw"
                                unoptimized
                              />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {asset.sources.map((source) => (
                                  <Badge
                                    key={`${asset.url}-${source}`}
                                    variant="outline"
                                    className="border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                  >
                                    {ASSET_SOURCE_LABELS[source]}
                                  </Badge>
                                ))}
                              </div>
                              {asset.uploadedAt ? (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {assetDateFormatter.format(new Date(asset.uploadedAt))}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs">
                              <p className="truncate font-medium text-slate-700 dark:text-slate-200" title={asset.name}>
                                {asset.name}
                              </p>
                              <p className="truncate text-slate-500 dark:text-slate-400" title={asset.url}>
                                {asset.url}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                onClick={() => handleApplyAssetToBackground(asset.url)}
                              >
                                Use as background
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                onClick={() => handleInsertAssetAsPlaceholder(asset.url)}
                              >
                                Add image layer
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                onClick={() => handleCopyAssetUrl(asset.url)}
                                title="Copy URL"
                              >
                                {copiedAssetUrl === asset.url ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                onClick={() => handleOpenAsset(asset.url)}
                                title="Open in new tab"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40"
                                onClick={() => handleAssetRemove(asset.url)}
                                disabled={!asset.isLibraryManaged}
                                title={asset.isLibraryManaged ? "Remove from library" : "Managed by template"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                        <FolderUp className="h-6 w-6 text-slate-400" />
                        <p className="max-w-[16rem]">
                          Store your brand visuals here to reuse them across templates.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>

            <main className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-200 px-8 py-4 dark:border-slate-900">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
                    Preview
                  </span>
                  <span>{editorTemplate?.name ?? "Select a template"}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {editorTemplate ? (
                    <Select value={activeCanvasPresetId} onValueChange={handleCanvasPresetChange}>
                      <SelectTrigger className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 md:min-w-[220px]">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent align="end" className="max-h-80 min-w-[20rem]">
                        {CANVAS_PRESETS.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            <span className="flex flex-col text-left">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{preset.label}</span>
                              {preset.description ? <span className="text-xs text-slate-500">{preset.description}</span> : null}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <div className={cn(toolbarGroupClass, "gap-1 pr-3")}>
                    <Button variant="ghost" size="icon" className={cn(toolbarButtonClass, "h-8 w-8 border-0 bg-transparent")} onClick={() => adjustZoom("out")}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[48px] rounded-full bg-white/70 px-2 py-1 text-center text-xs font-semibold text-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
                      {Math.round(canvasScale * 100)}%
                    </span>
                    <Button variant="ghost" size="icon" className={cn(toolbarButtonClass, "h-8 w-8 border-0 bg-transparent")} onClick={() => adjustZoom("in")}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(toolbarButtonClass, showGrid && toolbarActiveClass)}
                      onClick={() => setShowGrid((prev) => !prev)}
                      title={showGrid ? "Hide grid" : "Show grid"}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(toolbarButtonClass, snapToGrid && toolbarActiveClass)}
                      onClick={() => setSnapToGrid((prev) => !prev)}
                      title={snapToGrid ? "Disable snap to grid" : "Enable snap to grid"}
                    >
                      <Magnet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(toolbarButtonClass, showPlaceholderGuides && toolbarActiveClass)}
                      onClick={() => setShowPlaceholderGuides((prev) => !prev)}
                      title={showPlaceholderGuides ? "Hide placeholder guides" : "Show placeholder guides"}
                    >
                      {showPlaceholderGuides ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className={cn(toolbarGroupClass, "gap-2 pr-3")}>
                    <span className={toolbarLabelClass}>Grid</span>
                    <Input
                      type="number"
                      min={5}
                      max={240}
                      value={gridSize}
                      onChange={(event) => handleGridSizeChange(Number(event.target.value))}
                      onBlur={(event) => handleGridSizeChange(Number(event.target.value))}
                      className="h-7 w-16 rounded-full border-0 bg-white/80 px-2 text-center text-xs font-semibold text-slate-600 focus-visible:ring-0 dark:bg-slate-900/40 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden px-8 py-8">
                <div className="flex h-full min-h-[360px] items-center justify-center bg-transparent">
                  {editorTemplate ? (
                    <TemplateCanvas
                      template={editorTemplate}
                      onPlaceholderUpdate={handlePlaceholderUpdate}
                      className="w-full"
                      scale={canvasScale}
                      content={prefillContent ?? undefined}
                      showPlaceholderGuides={showPlaceholderGuides}
                      showGrid={showGrid}
                      snapToGrid={snapToGrid}
                      gridSize={gridSize}
                      onStageReady={(stage) => {
                        stageRef.current = stage;
                      }}
                      onScaleChange={handleCanvasScaleChange}
                    />
                  ) : (
                    <Skeleton className="h-[360px] w-full rounded-[2rem] bg-slate-200 dark:bg-slate-900/60" />
                  )}
                </div>
              </div>

            </main>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-8 py-4 dark:border-slate-900 dark:bg-slate-950">
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              className="border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" disabled={!editorTemplate || saveTemplate.isPending} onClick={() => editorTemplate && saveTemplate.mutate(editorTemplate)}>
              {saveTemplate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading templates…</div>}>
      <TemplatesPageContent />
    </Suspense>
  );
}