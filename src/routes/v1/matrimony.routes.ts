import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { adminAuth } from '../../middleware/adminAuth';
import { upload } from '../../middleware/upload';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createProfile, getMyProfile, updateProfile,
  listProfiles, getProfile, getMatches,
  expressInterest, getInterests, respondInterest,
  approveProfile, rejectProfile, listProfilesAdmin,
  deleteProfile, uploadPhoto, deletePhoto,
  likeProfile, getMyLikeMatches, getMatchChat,
} from '../../controllers/matrimony.controller';

const router = Router();

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/all', adminAuth, listProfilesAdmin);
router.patch('/admin/:id/approve', adminAuth, approveProfile);
router.patch('/admin/:id/reject', adminAuth, rejectProfile);
router.delete('/admin/:id', adminAuth, deleteProfile);

// ── Photo upload / delete ─────────────────────────────────────────────────────
router.post('/upload-photo', auth, upload.single('file'), uploadPhoto);
router.delete('/delete-photo', auth, deletePhoto);

// ── Authenticated user routes ─────────────────────────────────────────────────
router.get('/my-profile', auth, getMyProfile);
router.get('/matches', auth, getMatches);
router.get('/like-matches', auth, getMyLikeMatches);
router.get('/matches/:matchId/chat', auth, getMatchChat);
router.get('/interests', auth, getInterests);
router.post('/interests', auth, expressInterest);
router.patch('/interests/:interestId', auth, respondInterest);
router.post('/like', auth, likeProfile);

// ── Profile CRUD ──────────────────────────────────────────────────────────────
router.get('/profiles', auth, listProfiles);
router.post('/profiles', auth, createProfile);
router.get('/profiles/by-user/:userId', auth, asyncHandler(async (req, res) => {
  const { prisma } = await import('../../config/database');
  const { ApiResponse } = await import('../../utils/ApiResponse');
  const profile = await prisma.matrimonyProfile.findUnique({ where: { userId: req.params.userId } });
  res.json(new ApiResponse(200, profile ?? null));
}));
router.get('/profiles/:id', auth, getProfile);
router.put('/profiles/:id', auth, updateProfile);

export default router;
