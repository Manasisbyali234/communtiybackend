"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const adminAuth_1 = require("../../middleware/adminAuth");
const upload_1 = require("../../middleware/upload");
const matrimony_controller_1 = require("../../controllers/matrimony.controller");
const router = (0, express_1.Router)();
// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/all', adminAuth_1.adminAuth, matrimony_controller_1.listProfilesAdmin); // ?status=PENDING|APPROVED|REJECTED
router.patch('/admin/:id/approve', adminAuth_1.adminAuth, matrimony_controller_1.approveProfile);
router.patch('/admin/:id/reject', adminAuth_1.adminAuth, matrimony_controller_1.rejectProfile);
router.delete('/admin/:id', adminAuth_1.adminAuth, matrimony_controller_1.deleteProfile);
// ── Photo upload / delete ─────────────────────────────────────────────────────
router.post('/upload-photo', auth_1.auth, upload_1.upload.single('file'), matrimony_controller_1.uploadPhoto);
router.delete('/delete-photo', auth_1.auth, matrimony_controller_1.deletePhoto);
// ── Authenticated user routes ─────────────────────────────────────────────────
router.get('/my-profile', auth_1.auth, matrimony_controller_1.getMyProfile);
router.get('/matches', auth_1.auth, matrimony_controller_1.getMatches);
router.get('/interests', auth_1.auth, matrimony_controller_1.getInterests);
router.post('/interests', auth_1.auth, matrimony_controller_1.expressInterest);
router.patch('/interests/:interestId', auth_1.auth, matrimony_controller_1.respondInterest);
// ── Profile CRUD ──────────────────────────────────────────────────────────────
router.get('/profiles', auth_1.auth, matrimony_controller_1.listProfiles);
router.post('/profiles', auth_1.auth, matrimony_controller_1.createProfile);
router.get('/profiles/:id', auth_1.auth, matrimony_controller_1.getProfile);
router.put('/profiles/:id', auth_1.auth, matrimony_controller_1.updateProfile);
exports.default = router;
//# sourceMappingURL=matrimony.routes.js.map