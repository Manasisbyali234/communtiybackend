"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchChat = exports.getMyLikeMatches = exports.likeProfile = exports.verifyProfile = exports.deleteProfile = exports.listProfilesAdmin = exports.rejectProfile = exports.approveProfile = exports.deletePhoto = exports.uploadPhoto = exports.respondInterest = exports.getInterests = exports.expressInterest = exports.getMatches = exports.getProfile = exports.listProfiles = exports.updateProfile = exports.getMyProfile = exports.createProfile = void 0;
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const storage_1 = require("../config/storage");
const config_1 = require("../config");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const notifications_service_1 = require("../services/notifications.service");
const MIN_PHOTOS = 4;
const MAX_PHOTOS = 5;
const AGE_BUFFER = 2; // ±2 years smart default
// ── Helpers ───────────────────────────────────────────────────────────────────
function calcAge(dob) {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate()))
        age--;
    return age;
}
function _withAge(profile) {
    const { user, ...rest } = profile;
    return {
        ...rest,
        age: calcAge(new Date(profile.dateOfBirth)),
        avatarUrl: user?.avatarUrl ?? null,
    };
}
function computeMatchScore(mine, other) {
    let score = 0;
    if (mine.partnerMinAge && mine.partnerMaxAge) {
        if (other.age >= mine.partnerMinAge && other.age <= mine.partnerMaxAge)
            score += 30;
        else if (other.age >= mine.partnerMinAge - 3 && other.age <= mine.partnerMaxAge + 3)
            score += 15;
    }
    else {
        score += 15;
    }
    if (!mine.partnerReligion || mine.partnerReligion.toLowerCase() === other.religion?.toLowerCase())
        score += 25;
    if (!mine.partnerCaste || mine.partnerCaste.toLowerCase() === other.caste?.toLowerCase())
        score += 20;
    if (!mine.partnerEducation || mine.partnerEducation === other.education)
        score += 15;
    if (!mine.partnerCity || mine.partnerCity.toLowerCase() === other.city?.toLowerCase())
        score += 10;
    return Math.min(score, 100);
}
function _keyFromUrl(url) {
    try {
        const match = url.match(/\/media\/proxy\/(.+)$/);
        return match ? decodeURIComponent(match[1]) : null;
    }
    catch {
        return null;
    }
}
// Build dateOfBirth range from age range
function _dobRange(minAge, maxAge) {
    const today = new Date();
    const range = {};
    if (maxAge !== undefined) {
        const minDob = new Date(today);
        minDob.setFullYear(today.getFullYear() - maxAge - 1);
        range.gte = minDob;
    }
    if (minAge !== undefined) {
        const maxDob = new Date(today);
        maxDob.setFullYear(today.getFullYear() - minAge);
        range.lte = maxDob;
    }
    return range;
}
// ── Create Profile ────────────────────────────────────────────────────────────
exports.createProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const existing = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId } });
    if (existing)
        throw new ApiError_1.ApiError(409, 'Profile already exists. Use update instead.');
    const { displayName, gender, dateOfBirth, height, maritalStatus, religion, caste, motherTongue, education, educationDetails, occupation, annualIncome, city, state, aboutMe, hobbies, diet, familyType, fatherOccupation, motherOccupation, siblings, photos, partnerMinAge, partnerMaxAge, partnerReligion, partnerCaste, partnerEducation, partnerCity, } = req.body;
    if (!displayName || !gender || !dateOfBirth || !city) {
        throw new ApiError_1.ApiError(400, 'displayName, gender, dateOfBirth and city are required');
    }
    const photoList = Array.isArray(photos) ? photos : [];
    if (photoList.length < MIN_PHOTOS)
        throw new ApiError_1.ApiError(400, `At least ${MIN_PHOTOS} photos are required`);
    if (photoList.length > MAX_PHOTOS)
        throw new ApiError_1.ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed`);
    const profile = await database_1.prisma.matrimonyProfile.create({
        data: {
            userId, displayName, gender,
            dateOfBirth: new Date(dateOfBirth),
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
            approvalStatus: client_1.MatrimonyApprovalStatus.PENDING,
            partnerMinAge: partnerMinAge != null ? Number(partnerMinAge) : null,
            partnerMaxAge: partnerMaxAge != null ? Number(partnerMaxAge) : null,
            partnerReligion, partnerCaste, partnerEducation, partnerCity,
        },
        include: { user: { select: { avatarUrl: true } } },
    });
    // Notify all admins about new profile pending approval
    const admins = await database_1.prisma.user.findMany({
        where: { role: client_1.Role.ADMIN, isActive: true, deletedAt: null },
        select: { id: true },
    });
    await Promise.all(admins.map(admin => notifications_service_1.notificationsService.create({
        recipientId: admin.id,
        type: 'MATRIMONY_INTEREST_RECEIVED', // reuse as admin alert — or add dedicated type
        actorId: userId,
        entityId: profile.id,
        entityType: 'MatrimonyProfile',
        body: `New matrimony profile submitted by ${displayName} — pending approval`,
    })));
    res.status(201).json(new ApiResponse_1.ApiResponse(201, _withAge(profile), 'Profile submitted for approval'));
});
// ── Get My Profile ────────────────────────────────────────────────────────────
exports.getMyProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const profile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { userId },
        include: { user: { select: { avatarUrl: true } } },
    });
    res.json(new ApiResponse_1.ApiResponse(200, profile ? _withAge(profile) : null));
});
// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { id } = req.params;
    const profile = await database_1.prisma.matrimonyProfile.findUnique({ where: { id } });
    if (!profile)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    if (profile.userId !== userId)
        throw new ApiError_1.ApiError(403, 'Forbidden');
    const { userId: _u, isVerified: _v, approvalStatus: _a, ...data } = req.body;
    if (data.photos !== undefined) {
        const photoList = Array.isArray(data.photos) ? data.photos : [];
        if (photoList.length < MIN_PHOTOS)
            throw new ApiError_1.ApiError(400, `At least ${MIN_PHOTOS} photos are required`);
        if (photoList.length > MAX_PHOTOS)
            throw new ApiError_1.ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed`);
    }
    const updated = await database_1.prisma.matrimonyProfile.update({
        where: { id },
        data: {
            ...data,
            // Re-submit for approval when profile is updated
            approvalStatus: client_1.MatrimonyApprovalStatus.PENDING,
            rejectionReason: null,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            siblings: data.siblings != null ? Number(data.siblings) : undefined,
            partnerMinAge: data.partnerMinAge != null ? Number(data.partnerMinAge) : undefined,
            partnerMaxAge: data.partnerMaxAge != null ? Number(data.partnerMaxAge) : undefined,
        },
        include: { user: { select: { avatarUrl: true } } },
    });
    res.json(new ApiResponse_1.ApiResponse(200, _withAge(updated), 'Profile updated and re-submitted for approval'));
});
// ── Browse Profiles ───────────────────────────────────────────────────────────
exports.listProfiles = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { gender, minAge, maxAge, religion, caste, maritalStatus, education, city, search, skip = '0', take = '20', } = req.query;
    // Only show APPROVED + active profiles
    const where = { isActive: true, approvalStatus: client_1.MatrimonyApprovalStatus.APPROVED };
    // Fetch requesting user's profile for exclusion + smart defaults
    let myProfile = null;
    if (userId) {
        myProfile = await database_1.prisma.matrimonyProfile.findUnique({
            where: { userId },
            select: { id: true, gender: true, dateOfBirth: true, partnerMinAge: true, partnerMaxAge: true, approvalStatus: true },
        });
        // Gate: must have an approved profile to browse
        if (!myProfile || myProfile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED) {
            throw new ApiError_1.ApiError(403, 'Your profile must be approved before you can browse others');
        }
        where.id = { not: myProfile.id };
    }
    // ── Gender: auto opposite gender if not specified ──────────────────────────
    if (gender) {
        where.gender = gender;
    }
    else if (myProfile) {
        where.gender = myProfile.gender === 'MALE' ? 'FEMALE'
            : myProfile.gender === 'FEMALE' ? 'MALE'
                : undefined;
    }
    // ── Age filter ─────────────────────────────────────────────────────────────
    // Priority: 1) explicit query params  2) user's partner preference  3) no filter
    if (minAge || maxAge) {
        where.dateOfBirth = _dobRange(Number(minAge), Number(maxAge));
    }
    else if (myProfile?.partnerMinAge || myProfile?.partnerMaxAge) {
        where.dateOfBirth = _dobRange(myProfile.partnerMinAge ?? undefined, myProfile.partnerMaxAge ?? undefined);
    }
    // else: no age filter — show all ages
    if (religion)
        where.religion = { contains: religion, mode: 'insensitive' };
    if (caste)
        where.caste = { contains: caste, mode: 'insensitive' };
    if (maritalStatus)
        where.maritalStatus = maritalStatus;
    if (education)
        where.education = education;
    if (city)
        where.city = { contains: city, mode: 'insensitive' };
    if (search) {
        where.OR = [
            { displayName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { occupation: { contains: search, mode: 'insensitive' } },
            { caste: { contains: search, mode: 'insensitive' } },
        ];
    }
    const profiles = await database_1.prisma.matrimonyProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
        include: { user: { select: { avatarUrl: true } } },
    });
    // Build outgoing action maps in one query each so status is always scoped to
    // the requesting profile, never to a like/interest received from somebody else.
    let interestMap = {};
    let likedProfileIds = new Set();
    if (myProfile) {
        const interests = await database_1.prisma.matrimonyInterest.findMany({
            where: { fromProfileId: myProfile.id },
            select: { toProfileId: true, status: true },
        });
        interestMap = Object.fromEntries(interests.map(i => [i.toProfileId, i.status]));
        const likes = await database_1.prisma.matrimonyLike.findMany({
            where: { fromProfileId: myProfile.id },
            select: { toProfileId: true },
        });
        likedProfileIds = new Set(likes.map((like) => like.toProfileId));
    }
    const result = profiles.map(p => ({
        ..._withAge(p),
        hasExpressedInterest: !!interestMap[p.id],
        interestStatus: interestMap[p.id] ?? null,
        hasLiked: likedProfileIds.has(p.id),
    }));
    res.json(new ApiResponse_1.ApiResponse(200, result));
});
// ── Get Single Profile ────────────────────────────────────────────────────────
exports.getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const profile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { avatarUrl: true } } },
    });
    if (!profile)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    if (profile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED && profile.userId !== userId) {
        throw new ApiError_1.ApiError(404, 'Profile not found');
    }
    // Gate: viewer must have an approved profile (unless viewing their own)
    if (userId && profile.userId !== userId) {
        const viewerProfile = await database_1.prisma.matrimonyProfile.findUnique({
            where: { userId },
            select: { approvalStatus: true },
        });
        if (!viewerProfile || viewerProfile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED) {
            throw new ApiError_1.ApiError(403, 'Your profile must be approved before you can view others');
        }
    }
    let hasExpressedInterest = false;
    let interestStatus = null;
    let hasLiked = false;
    if (userId) {
        const myProfile = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
        if (myProfile) {
            const interest = await database_1.prisma.matrimonyInterest.findUnique({
                where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId: profile.id } },
            });
            hasExpressedInterest = !!interest;
            interestStatus = interest?.status ?? null;
            hasLiked = !!await database_1.prisma.matrimonyLike.findUnique({
                where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId: profile.id } },
                select: { id: true },
            });
        }
    }
    res.json(new ApiResponse_1.ApiResponse(200, { ..._withAge(profile), hasExpressedInterest, interestStatus, hasLiked }));
});
// ── Best Matches ──────────────────────────────────────────────────────────────
exports.getMatches = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const myProfile = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId } });
    if (!myProfile || myProfile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED)
        return res.json(new ApiResponse_1.ApiResponse(200, []));
    const oppositeGender = myProfile.gender === 'MALE' ? 'FEMALE' : myProfile.gender === 'FEMALE' ? 'MALE' : undefined;
    // Broad query — no hard religion/caste/age filters so we always get candidates
    const where = { isActive: true, approvalStatus: client_1.MatrimonyApprovalStatus.APPROVED, id: { not: myProfile.id } };
    if (oppositeGender)
        where.gender = oppositeGender;
    const profiles = await database_1.prisma.matrimonyProfile.findMany({
        where,
        take: 100,
        include: { user: { select: { avatarUrl: true } } },
    });
    const scored = profiles
        .map(p => ({ ..._withAge(p), matchScore: computeMatchScore(myProfile, _withAge(p)) }))
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
        .slice(0, 20);
    res.json(new ApiResponse_1.ApiResponse(200, scored));
});
// ── Express Interest ──────────────────────────────────────────────────────────
exports.expressInterest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const myProfile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { userId },
        select: { id: true, displayName: true, approvalStatus: true },
    });
    if (!myProfile)
        throw new ApiError_1.ApiError(404, 'Create your profile first');
    if (myProfile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED) {
        throw new ApiError_1.ApiError(403, 'Your profile must be approved before sending interests');
    }
    const { toProfileId, message } = req.body;
    if (!toProfileId)
        throw new ApiError_1.ApiError(400, 'toProfileId is required');
    if (toProfileId === myProfile.id)
        throw new ApiError_1.ApiError(400, 'Cannot send interest to yourself');
    const toProfile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { id: toProfileId },
        select: { id: true, userId: true, displayName: true, approvalStatus: true },
    });
    if (!toProfile || toProfile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    const existing = await database_1.prisma.matrimonyInterest.findUnique({
        where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId } },
    });
    if (existing) {
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, existing, 'Interest already sent'));
    }
    const interest = await database_1.prisma.matrimonyInterest.create({
        data: { fromProfileId: myProfile.id, toProfileId, message: message?.trim() || null },
        include: {
            fromProfile: { select: { id: true, displayName: true } },
            toProfile: { select: { id: true, displayName: true } },
        },
    });
    await notifications_service_1.notificationsService.create({
        recipientId: toProfile.userId,
        type: 'MATRIMONY_INTEREST_RECEIVED',
        actorId: userId,
        entityId: interest.id,
        entityType: 'MatrimonyInterest',
        body: `${myProfile.displayName} has sent you a matrimony interest 💍`,
    });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, interest, 'Interest sent'));
});
// ── Get Interests ─────────────────────────────────────────────────────────────
exports.getInterests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const myProfile = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!myProfile)
        return res.json(new ApiResponse_1.ApiResponse(200, []));
    const interests = await database_1.prisma.matrimonyInterest.findMany({
        where: { OR: [{ fromProfileId: myProfile.id }, { toProfileId: myProfile.id }] },
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
        conversationId: i.conversationId ?? null,
    }));
    res.json(new ApiResponse_1.ApiResponse(200, result));
});
// ── Respond to Interest ───────────────────────────────────────────────────────
exports.respondInterest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const myProfile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { userId },
        select: { id: true, displayName: true },
    });
    if (!myProfile)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    const { interestId } = req.params;
    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status))
        throw new ApiError_1.ApiError(400, 'status must be ACCEPTED or REJECTED');
    const interest = await database_1.prisma.matrimonyInterest.findUnique({
        where: { id: interestId },
        include: { fromProfile: { select: { userId: true, displayName: true } } },
    });
    if (!interest)
        throw new ApiError_1.ApiError(404, 'Interest not found');
    if (interest.toProfileId !== myProfile.id)
        throw new ApiError_1.ApiError(403, 'Forbidden');
    if (interest.status !== 'PENDING')
        throw new ApiError_1.ApiError(400, 'Interest already responded to');
    const updated = await database_1.prisma.matrimonyInterest.update({ where: { id: interestId }, data: { status } });
    let conversationId = null;
    if (status === 'ACCEPTED' && interest.fromProfile?.userId) {
        // Check if a like-based match already exists between these two users — reuse its conversation
        const [pA, pB] = [myProfile.id, interest.fromProfileId].sort();
        const existingMatch = await database_1.prisma.matrimonyMatch.findUnique({
            where: { profileAId_profileBId: { profileAId: pA, profileBId: pB } },
            select: { conversationId: true },
        });
        if (existingMatch?.conversationId) {
            // Reuse the existing conversation from the like match
            conversationId = existingMatch.conversationId;
            await database_1.prisma.matrimonyInterest.update({ where: { id: interestId }, data: { conversationId } });
        }
        else {
            // Check if the other side also sent an interest that is ACCEPTED (mutual)
            const reverseInterest = await database_1.prisma.matrimonyInterest.findUnique({
                where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId: interest.fromProfileId } },
            });
            if (reverseInterest?.status === 'ACCEPTED') {
                // Both sides accepted each other — create private matrimony conversation
                const conversation = await database_1.prisma.conversation.create({
                    data: {
                        isMatrimonyChat: true,
                        participants: { create: [{ userId }, { userId: interest.fromProfile.userId }] },
                    },
                });
                conversationId = conversation.id;
                await database_1.prisma.matrimonyInterest.update({ where: { id: interestId }, data: { conversationId } });
                await database_1.prisma.matrimonyInterest.update({ where: { id: reverseInterest.id }, data: { conversationId } });
            }
        }
        await notifications_service_1.notificationsService.create({
            recipientId: interest.fromProfile.userId,
            type: 'MATRIMONY_INTEREST_ACCEPTED',
            actorId: userId,
            entityId: conversationId ?? interest.id,
            entityType: conversationId ? 'Conversation' : 'MatrimonyInterest',
            body: conversationId
                ? `${myProfile.displayName} accepted your interest - you can now chat!`
                : `${myProfile.displayName} accepted your matrimony interest`,
        });
    }
    res.json(new ApiResponse_1.ApiResponse(200, { ...updated, conversationId }, `Interest ${status.toLowerCase()}`));
});
// ── Upload Profile Photo ──────────────────────────────────────────────────────
exports.uploadPhoto = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    if (!req.file)
        throw new ApiError_1.ApiError(400, 'No file provided');
    const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!ALLOWED.has(req.file.mimetype.toLowerCase()))
        throw new ApiError_1.ApiError(400, 'Only JPEG, PNG or WebP images allowed');
    if (req.file.size > 8 * 1024 * 1024)
        throw new ApiError_1.ApiError(400, 'Photo must be under 8MB');
    const profile = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId }, select: { photos: true } });
    if (profile && profile.photos.length >= MAX_PHOTOS) {
        throw new ApiError_1.ApiError(400, `Maximum ${MAX_PHOTOS} photos allowed. Remove a photo first.`);
    }
    const ext = path_1.default.extname(req.file.originalname) || '.jpg';
    const key = `matrimony/${crypto_1.default.randomUUID()}${ext}`;
    await storage_1.r2.send(new client_s3_1.PutObjectCommand({
        Bucket: storage_1.storageBucket, Key: key,
        Body: req.file.buffer, ContentType: req.file.mimetype,
    }));
    const url = `${config_1.config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;
    res.json(new ApiResponse_1.ApiResponse(200, { url }, 'Photo uploaded'));
});
// ── Delete Profile Photo ──────────────────────────────────────────────────────
exports.deletePhoto = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { photoUrl } = req.body;
    if (!photoUrl)
        throw new ApiError_1.ApiError(400, 'photoUrl is required');
    const profile = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true, photos: true } });
    if (!profile)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    if (!profile.photos.includes(photoUrl))
        throw new ApiError_1.ApiError(404, 'Photo not found in profile');
    const key = _keyFromUrl(photoUrl);
    if (key) {
        try {
            await storage_1.r2.send(new client_s3_1.DeleteObjectCommand({ Bucket: storage_1.storageBucket, Key: key }));
        }
        catch { }
    }
    const updatedPhotos = profile.photos.filter(p => p !== photoUrl);
    await database_1.prisma.matrimonyProfile.update({ where: { id: profile.id }, data: { photos: updatedPhotos } });
    res.json(new ApiResponse_1.ApiResponse(200, { photos: updatedPhotos }, 'Photo deleted'));
});
// ── Admin: Approve Profile ────────────────────────────────────────────────────
exports.approveProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const profile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { id },
        select: { id: true, userId: true, displayName: true },
    });
    if (!profile)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    await database_1.prisma.matrimonyProfile.update({
        where: { id },
        data: { approvalStatus: client_1.MatrimonyApprovalStatus.APPROVED, isVerified: true, rejectionReason: null },
    });
    await notifications_service_1.notificationsService.create({
        recipientId: profile.userId,
        type: 'MATRIMONY_PROFILE_APPROVED',
        entityId: id,
        entityType: 'MatrimonyProfile',
        body: `Your matrimony profile has been approved! You are now visible to other members 💍`,
    });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Profile approved'));
});
// ── Admin: Reject Profile ─────────────────────────────────────────────────────
exports.rejectProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const profile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { id },
        select: { id: true, userId: true },
    });
    if (!profile)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    await database_1.prisma.matrimonyProfile.update({
        where: { id },
        data: { approvalStatus: client_1.MatrimonyApprovalStatus.REJECTED, rejectionReason: reason ?? null },
    });
    await notifications_service_1.notificationsService.create({
        recipientId: profile.userId,
        type: 'MATRIMONY_PROFILE_REJECTED',
        entityId: id,
        entityType: 'MatrimonyProfile',
        body: reason
            ? `Your matrimony profile was rejected: ${reason}`
            : `Your matrimony profile was rejected. Please update and resubmit.`,
    });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Profile rejected'));
});
// ── Admin: List All Profiles ──────────────────────────────────────────────────
exports.listProfilesAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status } = req.query;
    const where = {};
    if (status)
        where.approvalStatus = status;
    const profiles = await database_1.prisma.matrimonyProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, avatarUrl: true } } },
    });
    res.json(new ApiResponse_1.ApiResponse(200, profiles.map(_withAge)));
});
// ── Admin: Delete Profile ─────────────────────────────────────────────────────
exports.deleteProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.matrimonyProfile.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Profile deleted'));
});
// ── Legacy: kept for backward compat ─────────────────────────────────────────
exports.verifyProfile = exports.approveProfile;
// ── Like Profile (triggers match if mutual) ───────────────────────────────────
exports.likeProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const myProfile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { userId },
        select: { id: true, displayName: true, approvalStatus: true },
    });
    if (!myProfile)
        throw new ApiError_1.ApiError(404, 'Create your profile first');
    if (myProfile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED)
        throw new ApiError_1.ApiError(403, 'Your profile must be approved before liking others');
    const { toProfileId } = req.body;
    if (!toProfileId)
        throw new ApiError_1.ApiError(400, 'toProfileId is required');
    if (toProfileId === myProfile.id)
        throw new ApiError_1.ApiError(400, 'Cannot like yourself');
    const toProfile = await database_1.prisma.matrimonyProfile.findUnique({
        where: { id: toProfileId },
        select: { id: true, userId: true, displayName: true, approvalStatus: true },
    });
    if (!toProfile || toProfile.approvalStatus !== client_1.MatrimonyApprovalStatus.APPROVED)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    // Upsert like (idempotent)
    await database_1.prisma.matrimonyLike.upsert({
        where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId } },
        create: { fromProfileId: myProfile.id, toProfileId },
        update: {},
    });
    // Check mutual like
    const mutualLike = await database_1.prisma.matrimonyLike.findUnique({
        where: { fromProfileId_toProfileId: { fromProfileId: toProfileId, toProfileId: myProfile.id } },
    });
    if (!mutualLike) {
        return res.json(new ApiResponse_1.ApiResponse(200, { matched: false }, 'Like recorded'));
    }
    // Mutual like → create match + conversation if not already exists
    const [pA, pB] = [myProfile.id, toProfileId].sort();
    const existingMatch = await database_1.prisma.matrimonyMatch.findUnique({
        where: { profileAId_profileBId: { profileAId: pA, profileBId: pB } },
    });
    if (existingMatch) {
        return res.json(new ApiResponse_1.ApiResponse(200, { matched: true, conversationId: existingMatch.conversationId }, "It's a match!"));
    }
    // Check if an interest-based conversation already exists between these two users
    const existingInterestConv = await database_1.prisma.matrimonyInterest.findFirst({
        where: {
            OR: [
                { fromProfileId: myProfile.id, toProfileId, conversationId: { not: null } },
                { fromProfileId: toProfileId, toProfileId: myProfile.id, conversationId: { not: null } },
            ],
        },
        select: { conversationId: true },
    });
    let conversationId;
    if (existingInterestConv?.conversationId) {
        conversationId = existingInterestConv.conversationId;
    }
    else {
        const conversation = await database_1.prisma.conversation.create({
            data: {
                isMatrimonyChat: true,
                participants: { create: [{ userId }, { userId: toProfile.userId }] },
            },
        });
        conversationId = conversation.id;
    }
    await database_1.prisma.matrimonyMatch.create({
        data: { profileAId: pA, profileBId: pB, conversationId },
    });
    await Promise.all([
        notifications_service_1.notificationsService.create({
            recipientId: userId,
            type: 'MATRIMONY_MATCH',
            actorId: toProfile.userId,
            entityId: conversationId,
            entityType: 'Conversation',
            body: `You matched with ${toProfile.displayName}! Start chatting 💍`,
        }),
        notifications_service_1.notificationsService.create({
            recipientId: toProfile.userId,
            type: 'MATRIMONY_MATCH',
            actorId: userId,
            entityId: conversationId,
            entityType: 'Conversation',
            body: `You matched with ${myProfile.displayName}! Start chatting 💍`,
        }),
    ]);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, { matched: true, conversationId }, "It's a match!"));
});
// ── Get My Like-Based Matches ─────────────────────────────────────────────────
exports.getMyLikeMatches = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const myProfile = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!myProfile)
        return res.json(new ApiResponse_1.ApiResponse(200, []));
    const matches = await database_1.prisma.matrimonyMatch.findMany({
        where: { OR: [{ profileAId: myProfile.id }, { profileBId: myProfile.id }] },
        orderBy: { createdAt: 'desc' },
        include: {
            profileA: { select: { id: true, displayName: true, photos: true, city: true, occupation: true, dateOfBirth: true, user: { select: { avatarUrl: true } } } },
            profileB: { select: { id: true, displayName: true, photos: true, city: true, occupation: true, dateOfBirth: true, user: { select: { avatarUrl: true } } } },
        },
    });
    const result = matches.map((m) => {
        const other = m.profileAId === myProfile.id ? m.profileB : m.profileA;
        return {
            matchId: m.id,
            conversationId: m.conversationId,
            profile: { ...other, age: calcAge(new Date(other.dateOfBirth)), avatarUrl: other.user?.avatarUrl ?? null },
        };
    });
    res.json(new ApiResponse_1.ApiResponse(200, result));
});
// ── Get Matrimony Match Chat ───────────────────────────────────────────────────
exports.getMatchChat = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const myProfile = await database_1.prisma.matrimonyProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!myProfile)
        throw new ApiError_1.ApiError(404, 'Profile not found');
    const { matchId } = req.params;
    const match = await database_1.prisma.matrimonyMatch.findUnique({
        where: { id: matchId },
        select: { profileAId: true, profileBId: true, conversationId: true },
    });
    if (!match)
        throw new ApiError_1.ApiError(404, 'Match not found');
    if (match.profileAId !== myProfile.id && match.profileBId !== myProfile.id) {
        throw new ApiError_1.ApiError(403, 'Forbidden');
    }
    if (!match.conversationId)
        throw new ApiError_1.ApiError(404, 'No conversation for this match yet');
    res.json(new ApiResponse_1.ApiResponse(200, { conversationId: match.conversationId }));
});
//# sourceMappingURL=matrimony.controller.js.map