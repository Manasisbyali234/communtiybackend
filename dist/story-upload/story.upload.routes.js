"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const ApiError_1 = require("../utils/ApiError");
const story_upload_middleware_1 = require("./story.upload.middleware");
const story_upload_controller_1 = require("./story.upload.controller");
const router = (0, express_1.Router)();
// Public proxy — no auth so <Image> / <video> tags load without a token
router.get('/proxy/:key(*)', story_upload_controller_1.storyUploadController.proxyMedia);
// Multer error → ApiError
function multerErrHandler(err, _req, _res, next) {
    if (err instanceof multer_1.default.MulterError) {
        return next(new ApiError_1.ApiError(400, `Story upload error: ${err.message}`));
    }
    next(err);
}
router.use(auth_1.auth);
// Upload media only → returns S3 URL (frontend then calls POST /stories with the URL)
router.post('/upload', story_upload_middleware_1.storyUpload.single('file'), multerErrHandler, story_upload_controller_1.storyUploadController.uploadMedia);
// Upload + create story in one request
router.post('/create', story_upload_middleware_1.storyUpload.single('file'), multerErrHandler, story_upload_controller_1.storyUploadController.uploadAndCreate);
exports.default = router;
//# sourceMappingURL=story.upload.routes.js.map