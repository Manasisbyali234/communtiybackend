"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = require("../utils/ApiError");
const media_service_1 = require("../services/media.service");
const STORY_ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/avi', 'video/webm', 'video/x-msvideo',
]);
function storyFileFilter(_req, file, cb) {
    if (STORY_ALLOWED_TYPES.has(file.mimetype.toLowerCase())) {
        cb(null, true);
    }
    else {
        cb(new ApiError_1.ApiError(415, `Unsupported story media type: ${file.mimetype}`));
    }
}
exports.storyUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: storyFileFilter,
    limits: { fileSize: media_service_1.MAX_MEDIA_UPLOAD_SIZE },
});
//# sourceMappingURL=story.upload.middleware.js.map