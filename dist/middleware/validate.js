"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
/**
 * Zod schema validation middleware.
 * Usage: router.post('/', validate({ body: CreatePostSchema }), controller)
 */
function validate(schemas) {
    return (req, _res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const errors = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                throw new ApiError_1.ApiError(400, 'Validation failed', errors);
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map