import { Request, Response } from 'express';
export declare const eventsController: {
    list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    get: (req: Request, res: Response, next: import("express").NextFunction) => void;
    update: (req: Request, res: Response, next: import("express").NextFunction) => void;
    delete: (req: Request, res: Response, next: import("express").NextFunction) => void;
    archive: (req: Request, res: Response, next: import("express").NextFunction) => void;
    rsvp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelRsvp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAttendees: (req: Request, res: Response, next: import("express").NextFunction) => void;
    toggleInterest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    toggleLike: (req: Request, res: Response, next: import("express").NextFunction) => void;
    shareEvent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getComments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    addComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=events.controller.d.ts.map