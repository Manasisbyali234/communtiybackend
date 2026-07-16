import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidateSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
/**
 * Zod schema validation middleware.
 * Usage: router.post('/', validate({ body: CreatePostSchema }), controller)
 */
export declare function validate(schemas: ValidateSchemas): (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map