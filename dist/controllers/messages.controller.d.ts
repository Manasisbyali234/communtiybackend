import { Request, Response } from 'express';
export declare const messagesController: {
    getConversations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getOrCreate: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
    sendMessage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    markRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
    addReaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    removeReaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteForEveryone: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteForMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=messages.controller.d.ts.map