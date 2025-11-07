import { Queue } from "bullmq";
export declare const queuesEnabled: boolean;
export declare const aiGenerationQueue: Queue<any, any, string, any, any, string> | null;
export declare const renderQueue: Queue<any, any, string, any, any, string> | null;
export declare const analyticsQueue: Queue<any, any, string, any, any, string> | null;
export type QueueName = "aiGeneration" | "render" | "analytics";
export declare const enqueueJob: <T>(queueName: QueueName, jobName: string, data: T) => Promise<void>;
//# sourceMappingURL=queueService.d.ts.map