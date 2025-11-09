import { Prisma } from "@prisma/client";
import type { TemplateOrientation } from "@prisma/client";
import { TemplateLayout } from "../types/template";
export interface TemplateInput {
    name: string;
    backgroundUrl?: string;
    backgroundColor?: string;
    orientation: TemplateOrientation;
    tags: string[];
    emotionFit: string[];
    placeholders: TemplateLayout["placeholders"];
    canvasPreset?: string;
    canvasWidth?: number;
    canvasHeight?: number;
}
export declare const createTemplate: (businessId: string, data: TemplateInput) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    placeholders: Prisma.JsonValue;
    backgroundUrl: string | null;
    backgroundColor: string | null;
    orientation: import(".prisma/client").$Enums.TemplateOrientation;
    tags: string[];
    emotionFit: string[];
    canvasPreset: string | null;
    canvasWidth: number | null;
    canvasHeight: number | null;
    businessId: string;
}>;
export declare const listTemplates: (businessId: string) => Prisma.PrismaPromise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    placeholders: Prisma.JsonValue;
    backgroundUrl: string | null;
    backgroundColor: string | null;
    orientation: import(".prisma/client").$Enums.TemplateOrientation;
    tags: string[];
    emotionFit: string[];
    canvasPreset: string | null;
    canvasWidth: number | null;
    canvasHeight: number | null;
    businessId: string;
}[]>;
export declare const updateTemplate: (id: string, businessId: string, data: Partial<TemplateInput>) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    placeholders: Prisma.JsonValue;
    backgroundUrl: string | null;
    backgroundColor: string | null;
    orientation: import(".prisma/client").$Enums.TemplateOrientation;
    tags: string[];
    emotionFit: string[];
    canvasPreset: string | null;
    canvasWidth: number | null;
    canvasHeight: number | null;
    businessId: string;
}>;
export declare const deleteTemplate: (id: string, businessId: string) => Promise<void>;
export declare const recommendTemplate: (businessId: string, preferences: {
    emotion?: string;
    style?: string;
    platform?: string;
    layoutType?: TemplateOrientation;
}) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    placeholders: Prisma.JsonValue;
    backgroundUrl: string | null;
    backgroundColor: string | null;
    orientation: import(".prisma/client").$Enums.TemplateOrientation;
    tags: string[];
    emotionFit: string[];
    canvasPreset: string | null;
    canvasWidth: number | null;
    canvasHeight: number | null;
    businessId: string;
}>;
//# sourceMappingURL=templateService.d.ts.map