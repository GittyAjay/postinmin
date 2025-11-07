export type PlaceholderType = "text" | "image";
export interface TemplatePlaceholder {
    key: string;
    type: PlaceholderType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize?: number;
    color?: string;
}
export interface TemplateLayout {
    id: string;
    name: string;
    backgroundUrl?: string;
    orientation: "square" | "wide" | "story";
    tags: string[];
    emotionFit: string[];
    placeholders: TemplatePlaceholder[];
}
//# sourceMappingURL=template.d.ts.map