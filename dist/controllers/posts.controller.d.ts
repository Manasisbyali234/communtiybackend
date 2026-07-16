import { Request, Response } from 'express';
export declare const postsController: {
    getFeed: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTrending: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDrafts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createPost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updatePost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deletePost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    publishDraft: (req: Request, res: Response, next: import("express").NextFunction) => void;
    likePost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    unlikePost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    bookmarkPost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    unbookmarkPost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getComments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    addComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    likeComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=posts.controller.d.ts.map