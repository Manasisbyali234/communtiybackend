"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = require("../utils/ApiError");
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
]);
const MAX_FILE_SIZE_MB = 50;
const storage = multer_1.default.memoryStorage();
function fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new ApiError_1.ApiError(415, `Unsupported media type: ${file.mimetype}`));
    }
}
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    },
});
//# sourceMappingURL=upload.js.map