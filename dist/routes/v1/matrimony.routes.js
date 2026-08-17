"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const adminAuth_1 = require("../../middleware/adminAuth");
const upload_1 = require("../../middleware/upload");
const asyncHandler_1 = require("../../utils/asyncHandler");
const matrimony_controller_1 = require("../../controllers/matrimony.controller");
const router = (0, express_1.Router)();
// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/all', adminAuth_1.adminAuth, matrimony_controller_1.listProfilesAdmin);
router.patch('/admin/:id/approve', adminAuth_1.adminAuth, matrimony_controller_1.approveProfile);
router.patch('/admin/:id/reject', adminAuth_1.adminAuth, matrimony_controller_1.rejectProfile);
router.delete('/admin/:id', adminAuth_1.adminAuth, matrimony_controller_1.deleteProfile);
// ── Photo upload / delete ─────────────────────────────────────────────────────
router.post('/upload-photo', auth_1.auth, upload_1.upload.single('file'), matrimony_controller_1.uploadPhoto);
router.delete('/delete-photo', auth_1.auth, matrimony_controller_1.deletePhoto);
// ── Authenticated user routes ─────────────────────────────────────────────────
router.get('/my-profile', auth_1.auth, matrimony_controller_1.getMyProfile);
router.get('/matches', auth_1.auth, matrimony_controller_1.getMatches);
router.get('/like-matches', auth_1.auth, matrimony_controller_1.getMyLikeMatches);
router.get('/matches/:matchId/chat', auth_1.auth, matrimony_controller_1.getMatchChat);
router.get('/interests', auth_1.auth, matrimony_controller_1.getInterests);
router.post('/interests', auth_1.auth, matrimony_controller_1.expressInterest);
router.patch('/interests/:interestId', auth_1.auth, matrimony_controller_1.respondInterest);
router.post('/like', auth_1.auth, matrimony_controller_1.likeProfile);
// ── Profile CRUD ──────────────────────────────────────────────────────────────
router.get('/profiles', auth_1.auth, matrimony_controller_1.listProfiles);
router.post('/profiles', auth_1.auth, matrimony_controller_1.createProfile);
router.get('/profiles/by-user/:userId', auth_1.auth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../../config/database')));
    const { ApiResponse } = await Promise.resolve().then(() => __importStar(require('../../utils/ApiResponse')));
    const profile = await prisma.matrimonyProfile.findUnique({ where: { userId: req.params.userId } });
    res.json(new ApiResponse(200, profile ?? null));
}));
router.get('/profiles/:id', auth_1.auth, matrimony_controller_1.getProfile);
router.put('/profiles/:id', auth_1.auth, matrimony_controller_1.updateProfile);
router.delete('/profiles/:id', auth_1.auth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../../config/database')));
    const { ApiResponse } = await Promise.resolve().then(() => __importStar(require('../../utils/ApiResponse')));
    const { ApiError } = await Promise.resolve().then(() => __importStar(require('../../utils/ApiError')));
    const userId = req.user?.id;
    const profile = await prisma.matrimonyProfile.findUnique({ where: { id: req.params.id }, select: { userId: true } });
    if (!profile)
        throw new ApiError(404, 'Profile not found');
    if (profile.userId !== userId)
        throw new ApiError(403, 'Forbidden');
    await prisma.matrimonyProfile.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Profile deleted'));
}));
exports.default = router;
//# sourceMappingURL=matrimony.routes.js.map