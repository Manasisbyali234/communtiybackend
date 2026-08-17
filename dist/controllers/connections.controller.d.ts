import { Request, Response } from 'express';
export declare const connectionsController: {
    send: (req: Request, res: Response, next: import("express").NextFunction) => void;
    accept: (req: Request, res: Response, next: import("express").NextFunction) => void;
    reject: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getConnections: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPending: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=connections.controller.d.ts.map