export type PlaceholderType = "text" | "image" | "shape";

export interface TemplatePlaceholder {
  key: string;
  type: PlaceholderType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  fontSize?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  imageUrl?: string;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | number;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  align?: "left" | "center" | "right";
  opacity?: number;
  rotation?: number;
  locked?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  zIndex?: number;
  shape?: "rectangle" | "circle" | "triangle" | "line";
  fillColor?: string;
  dashPattern?: number[];
  sampleText?: string;
}

export interface TemplateLayout {
  id: string;
  name: string;
  backgroundUrl?: string;
  orientation: "square" | "wide" | "story";
  tags: string[];
  emotionFit: string[];
  placeholders: TemplatePlaceholder[];
  frameBorderColor?: string;
  frameBorderWidth?: number;
  frameBorderRadius?: number;
  canvasPreset?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

