import { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { MatrimonyApprovalStatus, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { s3, storageBucket } from '../config/storage';
import { config } from '../config';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { notificationsService } from '../services/notifications.service';

const MIN_PHOTOS = 4;
const MAX_PHOTOS = 5;
const AGE_BUFFER = 2; // ±2 years smart default

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function _withAge(profile: any) {
  const { user, ...rest } = profile;
  return {
    ...rest,
    age: calcAge(new Date(profile.dateOfBirth)),
    avatarUrl: user?.avatarUrl ?? null,
  };
}

function computeMatchScore(mine: any, other: any): number {
  let score = 0;
  if (mine.partnerMinAge && mine.partnerMaxAge) {
    if (other.age >= mine.partnerMinAge && other.age <= mine.partnerMaxAge) score += 30;
    else if (other.age >= mine.partnerMinAge - 3 && other.age <= mine.partnerMaxAge + 3) score += 15;
  } else {
    score += 15;
  }
  if (!mine.partnerReligion || mine.partnerReligion.toLowerCase() === other.religion?.toLowerCase()) score += 25;
  if (!mine.partnerCaste || mine.partnerCaste.toLowerCase() === other.caste?.toLowerCase()) score += 20;
  if (!mine.partnerEducation || mine.partnerEducation === other.education) score += 15;
  if (!mine.partnerCity || mine.partnerCity.toLowerCase() === other.city?.toLowerCase()) score += 10;
  return Math.min(score, 100);
}

function _keyFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/media\/proxy\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// Build dateOfBirth range from age range
function _dobRange(minAge?: number, maxAge?: number) {
  if (minAge == null && maxAge == null) return undefined;
  if (typeof minAge === 'number' && isNaN(minAge)) return undefined;
  if (typeof maxAge === 'number' && isNaN(maxAge)) return undefined;
  const today = new Date();
  const range: any = {};
  if (maxAge != null) {
    const minDob = new Date(today);
    minDob.setFullYear(today.getFullYear() - maxAge);
    range.gte = minDob;
  }
  if (minAge != null) {
    const maxDob = new Date(today);
    maxDob.setFullYear(today.getFullYear() - minAge);
    range.lte = maxDob;
  }
  return range;
}

// ── Create Profile ────────────────────────────────────────────────────────────
export const createProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const existing = await prisma.matrimonyProfile.findUnique({ where: { userId } });
  if (existing) throw new ApiError(409, 'Profile already exists. Use update instead.');

  const {
    displayName, gender, dateOfBirth, height, maritalStatus, religion, caste,
    motherTongue, education, educationDetails, occupation, annualIncome,
    city, state, aboutMe, hobbies, diet, familyType, fatherOccupation,
    motherOccupation, siblings, photos, partnerMinAge, partnerMaxAge,
    partnerReligion, partnerCaste, partnerEducation, partnerCity,
  } = req.body;

  if (!displayName || !gender || !dateOfBirth || !city) {
    throw new ApiError(400, 'displayName, gender, dateOfBirth and city are required');
  }

  const parsedDob = new Date(dateOfBirth);
  if (isNaN(parsedDob.getTime())) {
    throw new ApiError(400, 'Invalid dateOfBirth format. Use YYYY-MM-DD');
  }

  const photoList: string[] = Array.isArray(photos) ? photos : [];
  if (photoList.length < MIN_PHOTOS) throw new ApiError(400, `At least ${MIN_PHOTOS} photos are required`);
  if (photoList.length > MAX_PHOTOS) throw new ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed`);

  const profile = await prisma.matrimonyProfile.create({
    data: {
      userId, displayName, gender,
      dateOfBirth: parsedDob,
      height: height ?? '',
      maritalStatus: maritalStatus ?? 'NEVER_MARRIED',
      religion: religion ?? '',
      caste, motherTongue: motherTongue ?? '',
      education: education ?? 'OTHER',
      educationDetails, occupation: occupation ?? '',
      annualIncome, city, state: state ?? '',
      aboutMe, hobbies: hobbies ?? [],
      diet, familyType, fatherOccupation, motherOccupation,
      siblings: siblings != null ? Number(siblings) : null,
      photos: photoList,
      approvalStatus: MatrimonyApprovalStatus.PENDING,
      partnerMinAge: partnerMinAge != null ? Number(partnerMinAge) : null,
      partnerMaxAge: partnerMaxAge != null ? Number(partnerMaxAge) : null,
      partnerReligion, partnerCaste, partnerEducation, partnerCity,
    },
    include: { user: { select: { avatarUrl: true } } },
  });

  // Notify all admins about new profile pending approval
  try {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true, deletedAt: null },
      select: { id: true },
    });
    await Promise.all(admins.map(admin =>
      notificationsService.create({
        recipientId: admin.id,
        type: 'MATRIMONY_INTEREST_RECEIVED',
        actorId: userId,
        entityId: profile.id,
        entityType: 'MatrimonyProfile',
        body: `New matrimony profile submitted by ${displayName} — pending approval`,
      }).catch(() => {})
    ));
  } catch { /* notification errors must not fail profile creation */ }

  res.status(201).json(new ApiResponse(201, _withAge(profile), 'Profile submitted for approval'));
});

// ── Get My Profile ────────────────────────────────────────────────────────────
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const profile = await prisma.matrimonyProfile.findUnique({
    where: { userId },
    include: { user: { select: { avatarUrl: true } } },
  });

  res.json(new ApiResponse(200, profile ? _withAge(profile) : null));
});

// ── Update Profile ────────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { id } = req.params;
  const profile = await prisma.matrimonyProfile.findUnique({ where: { id } });
  if (!profile) throw new ApiError(404, 'Profile not found');
  if (profile.userId !== userId) throw new ApiError(403, 'Forbidden');

  const { userId: _u, isVerified: _v, approvalStatus: _a, ...data } = req.body;

  if (data.photos !== undefined) {
    const photoList: string[] = Array.isArray(data.photos) ? data.photos : [];
    if (photoList.length < MIN_PHOTOS) throw new ApiError(400, `At least ${MIN_PHOTOS} photos are required`);
    if (photoList.length > MAX_PHOTOS) throw new ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed`);
  }

  const updated = await prisma.matrimonyProfile.update({
    where: { id },
    data: {
      ...data,
      // Re-submit for approval when profile is updated
      approvalStatus: MatrimonyApprovalStatus.PENDING,
      rejectionReason: null,
      dateOfBirth: data.dateOfBirth ? (() => { const d = new Date(data.dateOfBirth); if (isNaN(d.getTime())) throw new ApiError(400, 'Invalid dateOfBirth format. Use YYYY-MM-DD'); return d; })() : undefined,
      siblings: data.siblings != null ? Number(data.siblings) : undefined,
      partnerMinAge: data.partnerMinAge != null ? Number(data.partnerMinAge) : undefined,
      partnerMaxAge: data.partnerMaxAge != null ? Number(data.partnerMaxAge) : undefined,
    },
    include: { user: { select: { avatarUrl: true } } },
  });

  res.json(new ApiResponse(200, _withAge(updated), 'Profile updated and re-submitted for approval'));
});

// ── Browse Profiles ───────────────────────────────────────────────────────────
export const listProfiles = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const {
    gender, minAge, maxAge, religion, caste, maritalStatus,
    education, city, search, skip = '0', take = '20',
  } = req.query as Record<string, string>;

  // Only show APPROVED + active profiles
  const where: any = { isActive: true, approvalStatus: MatrimonyApprovalStatus.APPROVED };

  // Fetch requesting user's profile for exclusion + smart defaults
  let myProfile: { id: string; gender: string; dateOfBirth: Date } | null = null;
  if (userId) {
    myProfile = await prisma.matrimonyProfile.findUnique({
      where: { userId },
      select: { id: true, gender: true, dateOfBirth: true },
    });
    if (myProfile) where.id = { not: myProfile.id };
  }

  // ── Gender: auto opposite gender if not specified ──────────────────────────
  if (gender) {
    where.gender = gender;
  } else if (myProfile) {
    where.gender = myProfile.gender === 'MALE' ? 'FEMALE'
      : myProfile.gender === 'FEMALE' ? 'MALE'
      : undefined;
  }

  // ── Age: only filter when the client explicitly passes minAge or maxAge ─────
  // Never apply a smart default — that silently hides profiles when "Any Age" is selected.
  if (minAge || maxAge) {
    const range = _dobRange(
      minAge ? Number(minAge) : undefined,
      maxAge ? Number(maxAge) : undefined,
    );
    if (range) where.dateOfBirth = range;
  }

  if (religion) where.religion = { contains: religion, mode: 'insensitive' };
  if (caste) where.caste = { contains: caste, mode: 'insensitive' };
  if (maritalStatus) where.maritalStatus = maritalStatus;
  if (education) where.education = education;
  if (city) where.city = { contains: city, mode: 'insensitive' };

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      { occupation: { contains: search, mode: 'insensitive' } },
      { caste: { contains: search, mode: 'insensitive' } },
    ];
  }

  const profiles = await prisma.matrimonyProfile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: Number(skip),
    take: Number(take),
    include: { user: { select: { avatarUrl: true } } },
  });

  // Build interest map in one query
  let interestMap: Record<string, string> = {};
  if (myProfile) {
    const interests = await prisma.matrimonyInterest.findMany({
      where: { fromProfileId: myProfile.id },
      select: { toProfileId: true, status: true },
    });
    interestMap = Object.fromEntries(interests.map(i => [i.toProfileId, i.status]));
  }

  const result = profiles.map(p => ({
    ..._withAge(p),
    hasExpressedInterest: !!interestMap[p.id],
    interestStatus: interestMap[p.id] ?? null,
  }));

  res.json(new ApiResponse(200, result));
});

// ── Get Single Profile ────────────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const profile = await prisma.matrimonyProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { avatarUrl: true } } },
  });
  if (!profile) throw new ApiError(404, 'Profile not found');
  if (profile.approvalStatus !== MatrimonyApprovalStatus.APPROVED && profile.userId !== userId) {
    throw new ApiError(404, 'Profile not found');
  }

  let hasExpressedInterest = false;
  let interestStatus = null;

  if (userId) {
    const myProfile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
    if (myProfile) {
      const interest = await prisma.matrimonyInterest.findUnique({
        where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId: profile.id } },
      });
      hasExpressedInterest = !!interest;
      interestStatus = interest?.status ?? null;
    }
  }

  res.json(new ApiResponse(200, { ..._withAge(profile), hasExpressedInterest, interestStatus }));
});

// ── Best Matches ──────────────────────────────────────────────────────────────
export const getMatches = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({ where: { userId } });
  if (!myProfile) throw new ApiError(404, 'Create your profile first to see matches');

  const oppositeGender = myProfile.gender === 'MALE' ? 'FEMALE' : myProfile.gender === 'FEMALE' ? 'MALE' : undefined;
  const myAge = calcAge(new Date(myProfile.dateOfBirth));

  const where: any = { isActive: true, approvalStatus: MatrimonyApprovalStatus.APPROVED, id: { not: myProfile.id } };
  if (oppositeGender) where.gender = oppositeGender;

  if (myProfile.partnerReligion) where.religion = { contains: myProfile.partnerReligion, mode: 'insensitive' };
  if (myProfile.partnerCaste) where.caste = { contains: myProfile.partnerCaste, mode: 'insensitive' };

  // Use partner preference age range, fallback to ±2 of own age
  const minAge = myProfile.partnerMinAge ?? myAge - AGE_BUFFER;
  const maxAge = myProfile.partnerMaxAge ?? myAge + AGE_BUFFER;
  const dobRange = _dobRange(minAge, maxAge);
  if (dobRange) where.dateOfBirth = dobRange;

  const profiles = await prisma.matrimonyProfile.findMany({
    where,
    take: 50,
    include: { user: { select: { avatarUrl: true } } },
  });

  const scored = profiles
    .map(p => ({ ..._withAge(p), matchScore: computeMatchScore(myProfile, _withAge(p)) }))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, 20);

  res.json(new ApiResponse(200, scored));
});

// ── Express Interest ──────────────────────────────────────────────────────────
export const expressInterest = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true, approvalStatus: true },
  });
  if (!myProfile) throw new ApiError(404, 'Create your profile first');
  if (myProfile.approvalStatus !== MatrimonyApprovalStatus.APPROVED) {
    throw new ApiError(403, 'Your profile must be approved before sending interests');
  }

  const { toProfileId, message } = req.body;
  if (!toProfileId) throw new ApiError(400, 'toProfileId is required');
  if (toProfileId === myProfile.id) throw new ApiError(400, 'Cannot send interest to yourself');

  const toProfile = await prisma.matrimonyProfile.findUnique({
    where: { id: toProfileId },
    select: { id: true, userId: true, displayName: true, approvalStatus: true },
  });
  if (!toProfile || toProfile.approvalStatus !== MatrimonyApprovalStatus.APPROVED) throw new ApiError(404, 'Profile not found');

  const existing = await prisma.matrimonyInterest.findUnique({
    where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId } },
  });
  if (existing) throw new ApiError(409, 'Interest already sent');

  const interest = await prisma.matrimonyInterest.create({
    data: { fromProfileId: myProfile.id, toProfileId, message: message?.trim() || null },
    include: {
      fromProfile: { select: { id: true, displayName: true } },
      toProfile: { select: { id: true, displayName: true } },
    },
  });

  await notificationsService.create({
    recipientId: toProfile.userId,
    type: 'MATRIMONY_INTEREST_RECEIVED',
    actorId: userId,
    entityId: interest.id,
    entityType: 'MatrimonyInterest',
    body: `${myProfile.displayName} has sent you a matrimony interest 💍`,
  });

  res.status(201).json(new ApiResponse(201, interest, 'Interest sent'));
});

// ── Shared include for interest profile fields ───────────────────────────────
const _interestProfileSelect = {
  id: true, userId: true, displayName: true, dateOfBirth: true,
  city: true, occupation: true, photos: true,
  user: { select: { avatarUrl: true } },
} as const;

function _mapInterest(i: any) {
  return {
    ...i,
    fromProfile: i.fromProfile
      ? { ...i.fromProfile, age: calcAge(new Date(i.fromProfile.dateOfBirth)), avatarUrl: i.fromProfile.user?.avatarUrl ?? null }
      : null,
    toProfile: i.toProfile
      ? { ...i.toProfile, age: calcAge(new Date(i.toProfile.dateOfBirth)), avatarUrl: i.toProfile.user?.avatarUrl ?? null }
      : null,
  };
}

// ── Get Sent Interests ────────────────────────────────────────────────────────
export const getSentInterests = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!myProfile) return res.json(new ApiResponse(200, []));

  const interests = await prisma.matrimonyInterest.findMany({
    where: { fromProfileId: myProfile.id },
    orderBy: { createdAt: 'desc' },
    include: {
      fromProfile: { select: _interestProfileSelect },
      toProfile: { select: _interestProfileSelect },
    },
  });

  res.json(new ApiResponse(200, interests.map(_mapInterest)));
});

// ── Get Received Interests ────────────────────────────────────────────────────
export const getReceivedInterests = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!myProfile) return res.json(new ApiResponse(200, []));

  const interests = await prisma.matrimonyInterest.findMany({
    where: { toProfileId: myProfile.id },
    orderBy: { createdAt: 'desc' },
    include: {
      fromProfile: { select: _interestProfileSelect },
      toProfile: { select: _interestProfileSelect },
    },
  });

  res.json(new ApiResponse(200, interests.map(_mapInterest)));
});

// ── Get Interests (legacy combined — kept for backward compat) ────────────────
export const getInterests = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!myProfile) return res.json(new ApiResponse(200, { sent: [], received: [] }));

  const [sent, received] = await Promise.all([
    prisma.matrimonyInterest.findMany({
      where: { fromProfileId: myProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        fromProfile: { select: _interestProfileSelect },
        toProfile: { select: _interestProfileSelect },
      },
    }),
    prisma.matrimonyInterest.findMany({
      where: { toProfileId: myProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        fromProfile: { select: _interestProfileSelect },
        toProfile: { select: _interestProfileSelect },
      },
    }),
  ]);

  const result = {
    sent: sent.map(_mapInterest),
    received: received.map(_mapInterest),
  };
  console.log('[getInterests] userId:', userId, '| myProfileId:', myProfile.id,
    '| sent count:', result.sent.length, '| received count:', result.received.length);
  if (result.received.length > 0) {
    console.log('[getInterests] First received interest id:', result.received[0].id,
      '| status:', result.received[0].status,
      '| toProfileId:', result.received[0].toProfileId);
  }
  res.json(new ApiResponse(200, result));
});

// ── Respond to Interest ───────────────────────────────────────────────────────
export const respondInterest = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  console.log('[respondInterest] Logged-in User ID:', userId);
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true },
  });
  console.log('[respondInterest] My profile ID:', myProfile?.id);
  if (!myProfile) throw new ApiError(404, 'You do not have a matrimony profile');

  const { interestId } = req.params;
  const { status } = req.body;
  console.log('[respondInterest] Interest ID:', interestId, '| Requested status:', status);

  const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status;
  if (!['ACCEPTED', 'REJECTED'].includes(normalizedStatus)) {
    throw new ApiError(400, 'status must be ACCEPTED or REJECTED');
  }

  const interest = await prisma.matrimonyInterest.findUnique({
    where: { id: interestId },
    include: {
      fromProfile: { select: { ...(_interestProfileSelect) } },
      toProfile: { select: { ...(_interestProfileSelect) } },
    },
  });
  console.log('[respondInterest] Found interest:', interest?.id, '| toProfileId:', interest?.toProfileId, '| current status:', interest?.status);

  if (!interest) throw new ApiError(404, 'Interest not found');
  if (interest.toProfileId !== myProfile.id) {
    console.error('[respondInterest] FORBIDDEN — toProfileId:', interest.toProfileId, '!== myProfile.id:', myProfile.id);
    throw new ApiError(403, 'You are not the receiver of this interest');
  }

  // Idempotent: already at requested status
  if (interest.status === normalizedStatus) {
    return res.json(new ApiResponse(200, _mapInterest(interest), `Interest already ${normalizedStatus.toLowerCase()}`));
  }
  // Only allow responding to PENDING interests
  if (interest.status !== 'PENDING') {
    throw new ApiError(400, `Interest is already ${interest.status.toLowerCase()}. Cannot change again.`);
  }

  const updated = await prisma.matrimonyInterest.update({
    where: { id: interestId },
    data: { status: normalizedStatus as any },
    include: {
      fromProfile: { select: { ...(_interestProfileSelect) } },
      toProfile: { select: { ...(_interestProfileSelect) } },
    },
  });
  console.log('[respondInterest] DB updated. New status:', updated.status);

  if (normalizedStatus === 'ACCEPTED' && interest.fromProfile?.userId) {
    notificationsService.create({
      recipientId: interest.fromProfile.userId,
      type: 'MATRIMONY_INTEREST_ACCEPTED',
      actorId: userId,
      entityId: interest.id,
      entityType: 'MatrimonyInterest',
      body: `${myProfile.displayName} accepted your matrimony interest 💍`,
    }).catch(() => {});
  }

  res.json(new ApiResponse(200, _mapInterest(updated), `Interest ${normalizedStatus.toLowerCase()}`));
});

// ── Upload Profile Photo ──────────────────────────────────────────────────────
export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!req.file) throw new ApiError(400, 'No file provided');

  const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  if (!ALLOWED.has(req.file.mimetype.toLowerCase())) throw new ApiError(400, 'Only JPEG, PNG or WebP images allowed');
  if (req.file.size > 8 * 1024 * 1024) throw new ApiError(400, 'Photo must be under 8MB');

  const profile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { photos: true } });
  if (profile && profile.photos.length >= MAX_PHOTOS) {
    throw new ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed. Remove a photo first.`);
  }

  const ext = path.extname(req.file.originalname) || '.jpg';
  const key = `matrimony/${crypto.randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: storageBucket, Key: key,
    Body: req.file.buffer, ContentType: req.file.mimetype,
  }));

  const url = `${config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;
  res.json(new ApiResponse(200, { url }, 'Photo uploaded'));
});

// ── Delete Profile Photo ──────────────────────────────────────────────────────
export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { photoUrl } = req.body;
  if (!photoUrl) throw new ApiError(400, 'photoUrl is required');

  const profile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true, photos: true } });
  if (!profile) throw new ApiError(404, 'Profile not found');
  if (!profile.photos.includes(photoUrl)) throw new ApiError(404, 'Photo not found in profile');

  const key = _keyFromUrl(photoUrl);
  if (key) {
    try { await s3.send(new DeleteObjectCommand({ Bucket: storageBucket, Key: key })); } catch { }
  }

  const updatedPhotos = profile.photos.filter(p => p !== photoUrl);
  await prisma.matrimonyProfile.update({ where: { id: profile.id }, data: { photos: updatedPhotos } });

  res.json(new ApiResponse(200, { photos: updatedPhotos }, 'Photo deleted'));
});

// ── Admin: Approve Profile ────────────────────────────────────────────────────
export const approveProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const profile = await prisma.matrimonyProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, displayName: true },
  });
  if (!profile) throw new ApiError(404, 'Profile not found');

  await prisma.matrimonyProfile.update({
    where: { id },
    data: { approvalStatus: MatrimonyApprovalStatus.APPROVED, isVerified: true, rejectionReason: null },
  });

  await notificationsService.create({
    recipientId: profile.userId,
    type: 'MATRIMONY_PROFILE_APPROVED',
    entityId: id,
    entityType: 'MatrimonyProfile',
    body: `Your matrimony profile has been approved! You are now visible to other members 💍`,
  });

  res.json(new ApiResponse(200, null, 'Profile approved'));
});

// ── Admin: Reject Profile ─────────────────────────────────────────────────────
export const rejectProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const profile = await prisma.matrimonyProfile.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!profile) throw new ApiError(404, 'Profile not found');

  await prisma.matrimonyProfile.update({
    where: { id },
    data: { approvalStatus: MatrimonyApprovalStatus.REJECTED, rejectionReason: reason ?? null },
  });

  await notificationsService.create({
    recipientId: profile.userId,
    type: 'MATRIMONY_PROFILE_REJECTED',
    entityId: id,
    entityType: 'MatrimonyProfile',
    body: reason
      ? `Your matrimony profile was rejected: ${reason}`
      : `Your matrimony profile was rejected. Please update and resubmit.`,
  });

  res.json(new ApiResponse(200, null, 'Profile rejected'));
});

// ── Admin: List All Profiles ──────────────────────────────────────────────────
export const listProfilesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const where: any = {};
  if (status) where.approvalStatus = status;

  const profiles = await prisma.matrimonyProfile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, avatarUrl: true } } },
  });
  res.json(new ApiResponse(200, profiles.map(_withAge)));
});

// ── Admin: Delete Profile ─────────────────────────────────────────────────────
export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
  await prisma.matrimonyProfile.delete({ where: { id: req.params.id } });
  res.json(new ApiResponse(200, null, 'Profile deleted'));
});

// ── Legacy: kept for backward compat ─────────────────────────────────────────
export const verifyProfile = approveProfile;
