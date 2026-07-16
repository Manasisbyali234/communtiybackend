"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("../../controllers/media.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
// File upload endpoints
router.post('/upload', media_controller_1.uploadMiddleware, media_controller_1.mediaController.upload);
router.post('/upload-multiple', media_controller_1.uploadMultipleMiddleware, media_controller_1.mediaController.uploadMultiple);
// File retrieval endpoints
router.get('/:id', media_controller_1.mediaController.getFile);
router.get('/:id/metadata', media_controller_1.mediaController.getFileMetadata);
// User file management
router.get('/user/files', media_controller_1.mediaController.getUserFiles);
router.delete('/:id', media_controller_1.mediaController.deleteFile);
// Admin endpoints
router.get('/admin/stats', media_controller_1.mediaController.getStorageStats);
exports.default = router;
//# sourceMappingURL=media.routes.js.map