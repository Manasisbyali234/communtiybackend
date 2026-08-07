"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const media_controller_1 = require("../../controllers/media.controller");
const auth_1 = require("../../middleware/auth");
const ApiError_1 = require("../../utils/ApiError");
const router = (0, express_1.Router)();
// Public proxy route — no auth needed so images load in <Image> components
// Handles both encoded keys (feed%2Ffile.jpg) and slash-separated paths (feed/file.jpg)
router.get('/proxy/:key(*)', media_controller_1.mediaController.proxyFile);
router.use(auth_1.auth);
// Converts MulterError → ApiError so errorHandler returns 4xx instead of 500
function multerErrorHandler(err, _req, _res, next) {
    if (err instanceof multer_1.default.MulterError) {
        return next(new ApiError_1.ApiError(400, `Upload error: ${err.message}`));
    }
    next(err);
}
router.post('/upload-chat', media_controller_1.uploadMiddleware, multerErrorHandler, media_controller_1.mediaController.uploadChatFile);
router.post('/upload-event', media_controller_1.uploadMiddleware, multerErrorHandler, media_controller_1.mediaController.uploadEventImage);
router.post('/upload-profile-photo', media_controller_1.uploadMiddleware, multerErrorHandler, media_controller_1.mediaController.uploadProfilePhoto);
router.post('/upload-cover-photo', media_controller_1.uploadMiddleware, multerErrorHandler, media_controller_1.mediaController.uploadCoverPhoto);
router.post('/upload-post-image', media_controller_1.uploadMiddleware, multerErrorHandler, media_controller_1.mediaController.uploadPostImage);
router.post('/upload-post-video', media_controller_1.uploadMiddleware, multerErrorHandler, media_controller_1.mediaController.uploadPostVideo);
router.post('/upload', media_controller_1.uploadMiddleware, multerErrorHandler, media_controller_1.mediaController.upload);
router.post('/upload-multiple', media_controller_1.uploadMultipleMiddleware, multerErrorHandler, media_controller_1.mediaController.uploadMultiple);
router.get('/user/files', media_controller_1.mediaController.getUserFiles);
router.get('/admin/stats', media_controller_1.mediaController.getStorageStats);
router.get('/:id/metadata', media_controller_1.mediaController.getFileMetadata);
router.get('/:id', media_controller_1.mediaController.getFile);
router.delete('/:id', media_controller_1.mediaController.deleteFile);
exports.default = router;
//# sourceMappingURL=media.routes.js.map