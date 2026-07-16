import { Request, Response } from 'express';
export declare const uploadMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultipleMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const mediaController: {
    upload: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadMultiple: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getFileMetadata: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserFiles: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStorageStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=media.controller.d.ts.map