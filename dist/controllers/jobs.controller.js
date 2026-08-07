"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getJobApplicants = exports.checkApplied = exports.getUserApplications = exports.applyJob = exports.deleteJob = exports.updateJob = exports.getJob = exports.listJobs = exports.listJobsAdmin = exports.createJob = exports.uploadJobLogo = void 0;
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
const database_1 = require("../config/database");
const storage_1 = require("../config/storage");
const config_1 = require("../config");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
// ── Admin: Upload Job Company Logo ───────────────────────────────────────────
exports.uploadJobLogo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new ApiError_1.ApiError(400, 'No file provided');
    const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!ALLOWED.has(req.file.mimetype.toLowerCase()))
        throw new ApiError_1.ApiError(400, 'Only JPEG, PNG or WebP images allowed');
    if (req.file.size > 5 * 1024 * 1024)
        throw new ApiError_1.ApiError(400, 'Logo must be under 5MB');
    const ext = path_1.default.extname(req.file.originalname) || '.jpg';
    const key = `jobs/${crypto_1.default.randomUUID()}${ext}`;
    await storage_1.s3.send(new client_s3_1.PutObjectCommand({
        Bucket: storage_1.storageBucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    }));
    const url = `${config_1.config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;
    res.json(new ApiResponse_1.ApiResponse(200, { url }, 'Logo uploaded'));
});
// ── Admin: Create Job ─────────────────────────────────────────────────────────
exports.createJob = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { companyLogo, companyName, jobTitle, description, employmentType, workMode, salaryLPA, address, location, experience, education, requiredSkills, vacancyCount, lastDate, hrContact, hrEmail, status, } = req.body;
    if (!companyName || !jobTitle || !description || !employmentType || !workMode || !salaryLPA || !location || !experience) {
        throw new ApiError_1.ApiError(400, 'Missing required fields');
    }
    const job = await database_1.prisma.job.create({
        data: {
            companyLogo, companyName, jobTitle, description,
            employmentType, workMode, salaryLPA, address, location,
            experience, education, requiredSkills: requiredSkills ?? [],
            vacancyCount: vacancyCount ? Number(vacancyCount) : 1,
            lastDate: lastDate ? new Date(lastDate) : null,
            hrContact, hrEmail,
            status: status ?? 'ACTIVE',
            applyCount: 0,
        },
    });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, job, 'Job created'));
});
// ── Admin: List Jobs ──────────────────────────────────────────────────────────
exports.listJobsAdmin = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const jobs = await database_1.prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
    });
    const result = jobs.map(({ _count, ...job }) => ({
        ...job,
        applyCount: _count.applications,
    }));
    res.json(new ApiResponse_1.ApiResponse(200, result));
});
// ── Public: List Active Jobs ──────────────────────────────────────────────────
exports.listJobs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { search, location, employmentType, workMode, skip = '0', take = '20' } = req.query;
    const where = { status: 'ACTIVE' };
    if (search) {
        where.OR = [
            { jobTitle: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (location)
        where.location = { contains: location, mode: 'insensitive' };
    if (employmentType)
        where.employmentType = employmentType;
    if (workMode)
        where.workMode = workMode;
    const jobs = await database_1.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
    });
    // Attach hasApplied flag for logged-in users
    if (userId && jobs.length > 0) {
        const jobIds = jobs.map(j => j.id);
        const applications = await database_1.prisma.jobApplication.findMany({
            where: { userId, jobId: { in: jobIds } },
            select: { jobId: true, status: true },
        });
        const appliedMap = Object.fromEntries(applications.map(a => [a.jobId, a.status]));
        const result = jobs.map(j => ({
            ...j,
            hasApplied: !!appliedMap[j.id],
            applicationStatus: appliedMap[j.id] ?? null,
        }));
        return res.json(new ApiResponse_1.ApiResponse(200, result));
    }
    res.json(new ApiResponse_1.ApiResponse(200, jobs.map(j => ({ ...j, hasApplied: false, applicationStatus: null }))));
});
// ── Get Single Job ────────────────────────────────────────────────────────────
exports.getJob = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const job = await database_1.prisma.job.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { applications: true } } },
    });
    if (!job)
        throw new ApiError_1.ApiError(404, 'Job not found');
    let hasApplied = false;
    if (userId) {
        const app = await database_1.prisma.jobApplication.findUnique({
            where: { userId_jobId: { userId, jobId: req.params.id } },
        });
        hasApplied = !!app;
    }
    const { _count, ...jobData } = job;
    res.json(new ApiResponse_1.ApiResponse(200, { ...jobData, applyCount: _count.applications, hasApplied }));
});
// ── Admin: Update Job ─────────────────────────────────────────────────────────
exports.updateJob = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { applyCount, ...data } = req.body; // prevent manual applyCount edit
    const job = await database_1.prisma.job.update({
        where: { id },
        data: {
            ...data,
            vacancyCount: data.vacancyCount ? Number(data.vacancyCount) : undefined,
            lastDate: data.lastDate ? new Date(data.lastDate) : undefined,
        },
    });
    res.json(new ApiResponse_1.ApiResponse(200, job, 'Job updated'));
});
// ── Admin: Delete Job ─────────────────────────────────────────────────────────
exports.deleteJob = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.job.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse_1.ApiResponse(200, null, 'Job deleted'));
});
// ── Apply for Job ─────────────────────────────────────────────────────────────
exports.applyJob = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { id: jobId } = req.params;
    const job = await database_1.prisma.job.findUnique({ where: { id: jobId } });
    if (!job)
        throw new ApiError_1.ApiError(404, 'Job not found');
    if (job.status !== 'ACTIVE')
        throw new ApiError_1.ApiError(400, 'Job is not accepting applications');
    const existing = await database_1.prisma.jobApplication.findUnique({
        where: { userId_jobId: { userId, jobId } },
    });
    if (existing)
        throw new ApiError_1.ApiError(409, 'Already applied');
    const [application] = await database_1.prisma.$transaction([
        database_1.prisma.jobApplication.create({ data: { jobId, userId } }),
        database_1.prisma.job.update({ where: { id: jobId }, data: { applyCount: { increment: 1 } } }),
    ]);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, application, 'Applied successfully'));
});
// ── Get User's Job Applications ───────────────────────────────────────────────
exports.getUserApplications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.userId ?? req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const applications = await database_1.prisma.jobApplication.findMany({
        where: { userId },
        orderBy: { appliedAt: 'desc' },
        include: {
            job: {
                select: {
                    id: true, companyLogo: true, companyName: true, jobTitle: true,
                    salaryLPA: true, location: true, status: true,
                },
            },
        },
    });
    res.json(new ApiResponse_1.ApiResponse(200, applications));
});
// ── Check if user applied ─────────────────────────────────────────────────────
exports.checkApplied = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const application = await database_1.prisma.jobApplication.findUnique({
        where: { userId_jobId: { userId, jobId: req.params.id } },
    });
    res.json(new ApiResponse_1.ApiResponse(200, { applied: !!application, application }));
});
// ── Admin: Get Applicants for a Job ──────────────────────────────────────────
exports.getJobApplicants = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const applications = await database_1.prisma.jobApplication.findMany({
        where: { jobId: req.params.id },
        orderBy: { appliedAt: 'desc' },
        include: {
            user: { select: { id: true, displayName: true, username: true, avatarUrl: true, email: true } },
        },
    });
    res.json(new ApiResponse_1.ApiResponse(200, applications));
});
// ── Admin: Update Application Status ─────────────────────────────────────────
exports.updateApplicationStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;
    const app = await database_1.prisma.jobApplication.update({
        where: { id: applicationId },
        data: { status },
    });
    res.json(new ApiResponse_1.ApiResponse(200, app, 'Status updated'));
});
//# sourceMappingURL=jobs.controller.js.map