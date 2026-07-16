import { Request, Response } from 'express';
export declare const communitiesController: {
    list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    get: (req: Request, res: Response, next: import("express").NextFunction) => void;
    update: (req: Request, res: Response, next: import("express").NextFunction) => void;
    delete: (req: Request, res: Response, next: import("express").NextFunction) => void;
    join: (req: Request, res: Response, next: import("express").NextFunction) => void;
    leave: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMembers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPendingMembers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateMemberRole: (req: Request, res: Response, next: import("express").NextFunction) => void;
    removeMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    approveMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    rejectMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    inviteMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    acceptInvite: (req: Request, res: Response, next: import("express").NextFunction) => void;
    declineInvite: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyInvites: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRules: (req: Request, res: Response, next: import("express").NextFunction) => void;
    addRule: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRule: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteRule: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPosts: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=communities.controller.d.ts.map