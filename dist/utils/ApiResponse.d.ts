export declare class ApiResponse<T> {
    success: boolean;
    statusCode: number;
    data: T;
    message: string;
    constructor(statusCode: number, data: T, message?: string);
}
//# sourceMappingURL=ApiResponse.d.ts.map