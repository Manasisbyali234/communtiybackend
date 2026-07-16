export declare const redis: {
    set(key: string, value: any, mode?: string, ttl?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(...keys: string[]): Promise<void>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    setex(key: string, seconds: number, value: any): Promise<void>;
    flushall(): Promise<void>;
    ping(): Promise<string>;
    quit(): Promise<void>;
    on(event: string, callback: (err?: Error) => void): void;
};
export declare function connectRedis(): Promise<void>;
//# sourceMappingURL=redis.d.ts.map