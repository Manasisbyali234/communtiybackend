import { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/database';
import { s3, storageBucket } from '../config/storage';
import { config } from '../config';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// ── Admin: Upload Job Company Logo ───────────────────────────────────────────
export const uploadJobLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, 'No file provided');

  const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  if (!ALLOWED.has(req.file.mimetype.toLowerCase())) throw new ApiError(400, 'Only JPEG, PNG or WebP images allowed');
  if (req.file.size > 5 * 1024 * 1024) throw new ApiError(400, 'Logo must be under 5MB');

  const ext = path.extname(req.file.originalname) || '.jpg';
  const key = `jobs/${crypto.randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: storageBucket,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }));

  const url = `${config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;

  res.json(new ApiResponse(200, { url }, 'Logo uploaded'));
});

// ── Admin: Create Job ─────────────────────────────────────────────────────────
export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const {
    companyLogo, companyName, jobTitle, description, employmentType, workMode,
    salaryLPA, address, location, experience, education, requiredSkills,
    vacancyCount, lastDate, hrContact, hrEmail, status,
  } = req.body;

  if (!companyName || !jobTitle || !description || !employmentType || !workMode || !salaryLPA || !location || !experience) {
    throw new ApiError(400, 'Missing required fields');
  }

  const job = await prisma.job.create({
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

  res.status(201).json(new ApiResponse(201, job, 'Job created'));
});

// ── Admin: List Jobs ──────────────────────────────────────────────────────────
export const listJobsAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });
  res.json(new ApiResponse(200, jobs));
});

// ── Public: List Active Jobs ──────────────────────────────────────────────────
export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const { search, location, employmentType, workMode, skip = '0', take = '20' } = req.query as Record<string, string>;

  const where: any = { status: 'ACTIVE' };
  if (search) {
    where.OR = [
      { jobTitle: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (employmentType) where.employmentType = employmentType;
  if (workMode) where.workMode = workMode;

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: Number(skip),
    take: Number(take),
  });
  res.json(new ApiResponse(200, jobs));
});

// ── Get Single Job ────────────────────────────────────────────────────────────
export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) throw new ApiError(404, 'Job not found');
  res.json(new ApiResponse(200, job));
});

// ── Admin: Update Job ─────────────────────────────────────────────────────────
export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { applyCount, ...data } = req.body; // prevent manual applyCount edit

  const job = await prisma.job.update({
    where: { id },
    data: {
      ...data,
      vacancyCount: data.vacancyCount ? Number(data.vacancyCount) : undefined,
      lastDate: data.lastDate ? new Date(data.lastDate) : undefined,
    },
  });
  res.json(new ApiResponse(200, job, 'Job updated'));
});

// ── Admin: Delete Job ─────────────────────────────────────────────────────────
export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  await prisma.job.delete({ where: { id: req.params.id } });
  res.json(new ApiResponse(200, null, 'Job deleted'));
});

// ── Apply for Job ─────────────────────────────────────────────────────────────
export const applyJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { id: jobId } = req.params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.status !== 'ACTIVE') throw new ApiError(400, 'Job is not accepting applications');

  const existing = await prisma.jobApplication.findUnique({
    where: { userId_jobId: { userId, jobId } },
  });
  if (existing) throw new ApiError(409, 'Already applied');

  const [application] = await prisma.$transaction([
    prisma.jobApplication.create({ data: { jobId, userId } }),
    prisma.job.update({ where: { id: jobId }, data: { applyCount: { increment: 1 } } }),
  ]);

  res.status(201).json(new ApiResponse(201, application, 'Applied successfully'));
});

// ── Get User's Job Applications ───────────────────────────────────────────────
export const getUserApplications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId ?? (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const applications = await prisma.jobApplication.findMany({
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

  res.json(new ApiResponse(200, applications));
});

// ── Check if user applied ─────────────────────────────────────────────────────
export const checkApplied = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const application = await prisma.jobApplication.findUnique({
    where: { userId_jobId: { userId, jobId: req.params.id } },
  });

  res.json(new ApiResponse(200, { applied: !!application, application }));
});

// ── Admin: Update Application Status ─────────────────────────────────────────
export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const app = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });
  res.json(new ApiResponse(200, app, 'Status updated'));
});
