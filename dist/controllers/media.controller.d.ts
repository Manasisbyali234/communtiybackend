import { Request, Response } from 'express';
export declare const uploadMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultipleMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const mediaController: {
    uploadEventImage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadCommunityImage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadProfilePhoto: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadCoverPhoto: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadPostImage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadPostVideo: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadChatFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    upload: (req: Request, res: Response, next: import("express").NextFunction) => void;
    uploadMultiple: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    proxyFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getFileMetadata: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserFiles: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStorageStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=media.controller.d.ts.map