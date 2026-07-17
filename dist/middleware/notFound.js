"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
const ApiError_1 = require("../utils/ApiError");
function notFound(req, _res, next) {
    next(ApiError_1.ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
//# sourceMappingURL=notFound.js.map