export declare class ApiError extends Error {
    statusCode: number;
    errors: unknown[];
    constructor(statusCode: number, message: string, errors?: unknown[], stack?: string);
    static badRequest(msg: string): ApiError;
    static unauthorized(msg?: string): ApiError;
    static forbidden(msg?: string): ApiError;
    static notFound(msg: string): ApiError;
    static conflict(msg: string): ApiError;
    static internal(msg?: string): ApiError;
}
//# sourceMappingURL=ApiError.d.ts.map