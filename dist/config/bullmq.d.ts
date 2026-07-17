export declare const QUEUE_NAMES: {
    readonly EMAIL: "email";
    readonly PUSH: "push";
    readonly STORY_EXPIRY: "story-expiry";
    readonly EVENT_REMINDER: "event-reminder";
    readonly MEDIA: "media";
    readonly SCHEDULED_POST: "scheduled-post";
    readonly ANALYTICS: "analytics";
};
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
interface JobData {
    [key: string]: any;
}
declare class SimpleQueue {
    private queueName;
    constructor(queueName: string);
    add(jobName: string, data: JobData, options?: {
        delay?: number;
        attempts?: number;
    }): Promise<void>;
    process(callback: (job: {
        name: string;
        data: JobData;
    }) => Promise<void>): Promise<void>;
    private removeJob;
}
export declare function getQueue(name: QueueName): SimpleQueue;
export declare class Worker {
    private queueName;
    private processor;
    constructor(queueName: string, processor: (job: any) => Promise<void>);
}
export declare const connection: null;
export {};
//# sourceMappingURL=bullmq.d.ts.map