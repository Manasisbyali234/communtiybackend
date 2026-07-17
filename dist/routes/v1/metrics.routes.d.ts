import client from 'prom-client';
export declare const httpRequestDuration: client.Histogram<"route" | "method" | "status_code">;
export declare const httpRequestTotal: client.Counter<"route" | "method" | "status_code">;
export declare const activeSockets: client.Gauge<string>;
export declare const queueDepth: client.Gauge<"queue">;
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=metrics.routes.d.ts.map