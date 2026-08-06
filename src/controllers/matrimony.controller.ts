import { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/database';
import { s3, storageBucket } from '../config/storage';
import { config } from '../config';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { notificationsService } from '../services/notifications.service';

const MIN_PHOTOS = 4;
const MAX_PHOTOS = 5;

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

  // Age preference (30 pts)
  if (mine.partnerMinAge && mine.partnerMaxAge) {
    if (other.age >= mine.partnerMinAge && other.age <= mine.partnerMaxAge) score += 30;
    else if (other.age >= mine.partnerMinAge - 3 && other.age <= mine.partnerMaxAge + 3) score += 15;
  } else {
    score += 15;
  }

  // Religion (25 pts)
  if (!mine.partnerReligion || mine.partnerReligion.toLowerCase() === other.religion?.toLowerCase()) score += 25;

  // Caste (20 pts)
  if (!mine.partnerCaste || mine.partnerCaste.toLowerCase() === other.caste?.toLowerCase()) score += 20;

  // Education (15 pts)
  if (!mine.partnerEducation || mine.partnerEducation === other.education) score += 15;

  // City (10 pts)
  if (!mine.partnerCity || mine.partnerCity.toLowerCase() === other.city?.toLowerCase()) score += 10;

  return Math.min(score, 100);
}

// Extract S3 key from a proxy URL
function _keyFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/media\/proxy\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
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

  const photoList: string[] = Array.isArray(photos) ? photos : [];
  if (photoList.length < MIN_PHOTOS) {
    throw new ApiError(400, `At least ${MIN_PHOTOS} photos are required`);
  }
  if (photoList.length > MAX_PHOTOS) {
    throw new ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed`);
  }

  const profile = await prisma.matrimonyProfile.create({
    data: {
      userId,
      displayName,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      height: height ?? '',
      maritalStatus: maritalStatus ?? 'NEVER_MARRIED',
      religion: religion ?? '',
      caste,
      motherTongue: motherTongue ?? '',
      education: education ?? 'OTHER',
      educationDetails,
      occupation: occupation ?? '',
      annualIncome,
      city,
      state: state ?? '',
      aboutMe,
      hobbies: hobbies ?? [],
      diet,
      familyType,
      fatherOccupation,
      motherOccupation,
      siblings: siblings != null ? Number(siblings) : null,
      photos: photoList,
      partnerMinAge: partnerMinAge != null ? Number(partnerMinAge) : null,
      partnerMaxAge: partnerMaxAge != null ? Number(partnerMaxAge) : null,
      partnerReligion,
      partnerCaste,
      partnerEducation,
      partnerCity,
    },
    include: { user: { select: { avatarUrl: true } } },
  });

  res.status(201).json(new ApiResponse(201, _withAge(profile), 'Profile created'));
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

  const { userId: _u, isVerified: _v, ...data } = req.body;

  // Validate photo count if photos are being updated
  if (data.photos !== undefined) {
    const photoList: string[] = Array.isArray(data.photos) ? data.photos : [];
    if (photoList.length < MIN_PHOTOS) {
      throw new ApiError(400, `At least ${MIN_PHOTOS} photos are required`);
    }
    if (photoList.length > MAX_PHOTOS) {
      throw new ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed`);
    }
  }

  const updated = await prisma.matrimonyProfile.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      siblings: data.siblings != null ? Number(data.siblings) : undefined,
      partnerMinAge: data.partnerMinAge != null ? Number(data.partnerMinAge) : undefined,
      partnerMaxAge: data.partnerMaxAge != null ? Number(data.partnerMaxAge) : undefined,
    },
    include: { user: { select: { avatarUrl: true } } },
  });

  res.json(new ApiResponse(200, _withAge(updated), 'Profile updated'));
});

// ── Browse Profiles ───────────────────────────────────────────────────────────
export const listProfiles = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const {
    gender, minAge, maxAge, religion, caste, maritalStatus,
    education, city, search, skip = '0', take = '20',
  } = req.query as Record<string, string>;

  const where: any = { isActive: true };

  // Fetch myProfile once — used for both exclusion and interest map
  let myProfile: { id: string } | null = null;
  if (userId) {
    myProfile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
    if (myProfile) where.id = { not: myProfile.id };
  }

  if (gender) where.gender = gender;
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

  if (minAge || maxAge) {
    const today = new Date();
    where.dateOfBirth = {};
    if (maxAge) {
      const minDob = new Date(today);
      minDob.setFullYear(today.getFullYear() - Number(maxAge) - 1);
      where.dateOfBirth.gte = minDob;
    }
    if (minAge) {
      const maxDob = new Date(today);
      maxDob.setFullYear(today.getFullYear() - Number(minAge));
      where.dateOfBirth.lte = maxDob;
    }
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
  const where: any = { isActive: true, id: { not: myProfile.id } };
  if (oppositeGender) where.gender = oppositeGender;

  if (myProfile.partnerReligion) where.religion = { contains: myProfile.partnerReligion, mode: 'insensitive' };
  if (myProfile.partnerCaste) where.caste = { contains: myProfile.partnerCaste, mode: 'insensitive' };

  if (myProfile.partnerMinAge || myProfile.partnerMaxAge) {
    const today = new Date();
    where.dateOfBirth = {};
    if (myProfile.partnerMaxAge) {
      const minDob = new Date(today);
      minDob.setFullYear(today.getFullYear() - myProfile.partnerMaxAge - 1);
      where.dateOfBirth.gte = minDob;
    }
    if (myProfile.partnerMinAge) {
      const maxDob = new Date(today);
      maxDob.setFullYear(today.getFullYear() - myProfile.partnerMinAge);
      where.dateOfBirth.lte = maxDob;
    }
  }

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
    select: { id: true, displayName: true },
  });
  if (!myProfile) throw new ApiError(404, 'Create your profile first');

  const { toProfileId, message } = req.body;
  if (!toProfileId) throw new ApiError(400, 'toProfileId is required');
  if (toProfileId === myProfile.id) throw new ApiError(400, 'Cannot send interest to yourself');

  const toProfile = await prisma.matrimonyProfile.findUnique({
    where: { id: toProfileId },
    select: { id: true, userId: true, displayName: true },
  });
  if (!toProfile) throw new ApiError(404, 'Target profile not found');

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

  // Notify the recipient
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

// ── Get Interests (sent + received) ──────────────────────────────────────────
export const getInterests = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!myProfile) return res.json(new ApiResponse(200, []));

  const interests = await prisma.matrimonyInterest.findMany({
    where: {
      OR: [{ fromProfileId: myProfile.id }, { toProfileId: myProfile.id }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      fromProfile: {
        select: {
          id: true, displayName: true, dateOfBirth: true,
          city: true, occupation: true, photos: true,
          user: { select: { avatarUrl: true } },
        },
      },
      toProfile: {
        select: {
          id: true, displayName: true, dateOfBirth: true,
          city: true, occupation: true, photos: true,
          user: { select: { avatarUrl: true } },
        },
      },
    },
  });

  const result = interests.map(i => ({
    ...i,
    fromProfile: i.fromProfile
      ? { ...i.fromProfile, age: calcAge(new Date(i.fromProfile.dateOfBirth)), avatarUrl: i.fromProfile.user?.avatarUrl ?? null }
      : null,
    toProfile: i.toProfile
      ? { ...i.toProfile, age: calcAge(new Date(i.toProfile.dateOfBirth)), avatarUrl: i.toProfile.user?.avatarUrl ?? null }
      : null,
  }));

  res.json(new ApiResponse(200, result));
});

// ── Respond to Interest ───────────────────────────────────────────────────────
export const respondInterest = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const myProfile = await prisma.matrimonyProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true },
  });
  if (!myProfile) throw new ApiError(404, 'Profile not found');

  const { interestId } = req.params;
  const { status } = req.body;

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new ApiError(400, 'status must be ACCEPTED or REJECTED');
  }

  const interest = await prisma.matrimonyInterest.findUnique({
    where: { id: interestId },
    include: { fromProfile: { select: { userId: true, displayName: true } } },
  });
  if (!interest) throw new ApiError(404, 'Interest not found');
  if (interest.toProfileId !== myProfile.id) throw new ApiError(403, 'Forbidden');
  if (interest.status !== 'PENDING') throw new ApiError(400, 'Interest already responded to');

  const updated = await prisma.matrimonyInterest.update({
    where: { id: interestId },
    data: { status },
  });

  // Notify the sender only on acceptance
  if (status === 'ACCEPTED' && interest.fromProfile?.userId) {
    await notificationsService.create({
      recipientId: interest.fromProfile.userId,
      type: 'MATRIMONY_INTEREST_ACCEPTED',
      actorId: userId,
      entityId: interest.id,
      entityType: 'MatrimonyInterest',
      body: `${myProfile.displayName} accepted your matrimony interest 💍`,
    });
  }

  res.json(new ApiResponse(200, updated, `Interest ${status.toLowerCase()}`));
});

// ── Upload Profile Photo ──────────────────────────────────────────────────────
export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!req.file) throw new ApiError(400, 'No file provided');

  const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  if (!ALLOWED.has(req.file.mimetype.toLowerCase())) {
    throw new ApiError(400, 'Only JPEG, PNG or WebP images allowed');
  }
  if (req.file.size > 8 * 1024 * 1024) throw new ApiError(400, 'Photo must be under 8MB');

  // Check current photo count if profile exists
  const profile = await prisma.matrimonyProfile.findUnique({ where: { userId }, select: { photos: true } });
  if (profile && profile.photos.length >= MAX_PHOTOS) {
    throw new ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed. Remove a photo first.`);
  }

  const ext = path.extname(req.file.originalname) || '.jpg';
  const key = `matrimony/${crypto.randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: storageBucket,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
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

  // Delete from S3
  const key = _keyFromUrl(photoUrl);
  if (key) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: storageBucket, Key: key }));
    } catch {
      // Non-fatal — remove from DB regardless
    }
  }

  const updatedPhotos = profile.photos.filter(p => p !== photoUrl);
  await prisma.matrimonyProfile.update({
    where: { id: profile.id },
    data: { photos: updatedPhotos },
  });

  res.json(new ApiResponse(200, { photos: updatedPhotos }, 'Photo deleted'));
});

// ── Admin: Verify Profile ─────────────────────────────────────────────────────
export const verifyProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const profile = await prisma.matrimonyProfile.update({
    where: { id },
    data: { isVerified: true },
  });
  res.json(new ApiResponse(200, profile, 'Profile verified'));
});

// ── Admin: List All Profiles ──────────────────────────────────────────────────
export const listProfilesAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const profiles = await prisma.matrimonyProfile.findMany({
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
