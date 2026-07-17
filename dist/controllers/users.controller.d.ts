import { Request, Response } from 'express';
export declare const usersController: {
    getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updatePushToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getBookmarks: (req: Request, res: Response, next: import("express").NextFunction) => void;
    listDeviceTokens: (req: Request, res: Response, next: import("express").NextFunction) => void;
    registerDeviceToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    unregisterDeviceToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    blockUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    unblockUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getBlocked: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    follow: (req: Request, res: Response, next: import("express").NextFunction) => void;
    unfollow: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getFollowers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getFollowing: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserPosts: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=users.controller.d.ts.map