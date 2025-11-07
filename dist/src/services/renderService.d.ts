import { TemplateLayout } from "../types/template";
export interface RenderContent {
    title: string;
    subtitle?: string;
    caption?: string;
    hashtags?: string[];
    emotion?: string;
}
export declare function renderPost(template: TemplateLayout, backgroundUrl: string, content: RenderContent): Promise<string>;
//# sourceMappingURL=renderService.d.ts.map