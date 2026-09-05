import { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/database';
import { r2, storageBucket } from '../config/storage';
import { config } from '../config';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { MAX_LOGO_UPLOAD_SIZE, UploadedFile, prepareImageForUpload } from '../services/media.service';

const EMPLOYER_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const cleanString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const employerDataFromBody = (body: unknown, partial = false): Prisma.EmployerCreateInput | Prisma.EmployerUpdateInput => {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const name = cleanString(source.name);
  if (!partial && !name) throw new ApiError(400, 'Company name is required');
  if (partial && 'name' in source && !name) throw new ApiError(400, 'Company name is required');

  const data: Record<string, string | null> = {};
  if (!partial || 'name' in source) data.name = name;
  for (const key of ['logoUrl', 'website', 'industry', 'description', 'email', 'phone', 'address', 'city', 'state']) {
    if (!partial || key in source) data[key] = cleanString(source[key]);
  }
  return data;
};

// ── Admin: Employer CRUD ─────────────────────────────────────────────────────
export const createEmployer = asyncHandler(async (req: Request, res: Response) => {
  const data = employerDataFromBody(req.body);
  const employer = await prisma.employer.create({
    data: data as Prisma.EmployerCreateInput,
  });
  res.status(201).json(new ApiResponse(201, employer, 'Employer created'));
});

export const listEmployers = asyncHandler(async (_req: Request, res: Response) => {
  const employers = await prisma.employer.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const jobCounts = employers.length
    ? await prisma.job.groupBy({
        by: ['employerId'],
        where: { employerId: { in: employers.map((employer) => employer.id) } },
        _count: { _all: true },
      })
    : [];
  const countsByEmployer = new Map(jobCounts.map((count) => [count.employerId, count._count._all]));

  res.json(new ApiResponse(200, employers.map((employer) => ({
    ...employer,
    jobCount: countsByEmployer.get(employer.id) ?? 0,
  }))));
});

// ── Public: List Employers with active job count ──────────────────────────────
export const listEmployersPublic = asyncHandler(async (_req: Request, res: Response) => {
  const employers = await prisma.employer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  const activeJobCounts = employers.length
    ? await prisma.job.groupBy({
        by: ['employerId'],
        where: {
          employerId: { in: employers.map((employer) => employer.id) },
          status: 'ACTIVE',
        },
        _count: { _all: true },
      })
    : [];
  const countsByEmployer = new Map(activeJobCounts.map((count) => [count.employerId, count._count._all]));

  res.json(new ApiResponse(200, employers.map((employer) => ({
    ...employer,
    jobCount: countsByEmployer.get(employer.id) ?? 0,
  }))));
});

export const getEmployer = asyncHandler(async (req: Request, res: Response) => {
  const employer = await prisma.employer.findUnique({ where: { id: req.params.id } });
  if (!employer) throw new ApiError(404, 'Employer not found');
  res.json(new ApiResponse(200, employer));
});

export const updateEmployer = asyncHandler(async (req: Request, res: Response) => {
  const employer = await prisma.employer.update({
    where: { id: req.params.id },
    data: employerDataFromBody(req.body, true),
  });
  res.json(new ApiResponse(200, employer, 'Employer updated'));
});

export const deleteEmployer = asyncHandler(async (req: Request, res: Response) => {
  await prisma.employer.delete({ where: { id: req.params.id } });
  res.json(new ApiResponse(200, null, 'Employer deleted'));
});

export const uploadEmployerLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, 'No file provided');
  if (!EMPLOYER_IMAGE_TYPES.has(req.file.mimetype.toLowerCase())) throw new ApiError(400, 'Only JPEG, PNG or WebP allowed');
  if (req.file.size > MAX_LOGO_UPLOAD_SIZE) throw new ApiError(400, 'Logo must be under 10MB');
  const file = await prepareImageForUpload(req.file as UploadedFile);
  const ext = path.extname(file.originalname) || '.jpg';
  const key = `employers/${crypto.randomUUID()}${ext}`;
  await r2.send(new PutObjectCommand({ Bucket: storageBucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
  const { storagePublicUrl } = await import('../config/storage');
  const url = storagePublicUrl
    ? `${storagePublicUrl}/${key}`
    : `${config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;
  res.json(new ApiResponse(200, { url }, 'Logo uploaded'));
});

// ── Admin: Upload Job Company Logo ───────────────────────────────────────────
export const uploadJobLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, 'No file provided');

  if (!EMPLOYER_IMAGE_TYPES.has(req.file.mimetype.toLowerCase())) throw new ApiError(400, 'Only JPEG, PNG or WebP images allowed');
  if (req.file.size > MAX_LOGO_UPLOAD_SIZE) throw new ApiError(400, 'Logo must be under 10MB');

  const file = await prepareImageForUpload(req.file as UploadedFile);
  const ext = path.extname(file.originalname) || '.jpg';
  const key = `jobs/${crypto.randomUUID()}${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: storageBucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  const { storagePublicUrl } = await import('../config/storage');
  const url = storagePublicUrl
    ? `${storagePublicUrl}/${key}`
    : `${config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;

  res.json(new ApiResponse(200, { url }, 'Logo uploaded'));
});

// ── Admin: Create Job ─────────────────────────────────────────────────────────
export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const {
    employerId, companyLogo, companyName, jobTitle, description, employmentType, workMode,
    salaryLPA, address, location, experience, education, requiredSkills,
    vacancyCount, lastDate, hrContact, hrEmail, status,
  } = req.body;

  if (!jobTitle || !description || !employmentType || !workMode || !salaryLPA || !location || !experience) {
    throw new ApiError(400, 'Missing required fields');
  }

  // Resolve company name/logo from employer if employerId provided
  let resolvedName = companyName;
  let resolvedLogo = companyLogo;
  if (employerId) {
    const employer = await prisma.employer.findUnique({ where: { id: employerId } });
    if (!employer) throw new ApiError(404, 'Employer not found');
    resolvedName = employer.name;
    resolvedLogo = employer.logoUrl ?? companyLogo;
  }
  if (!resolvedName) throw new ApiError(400, 'Company name is required');

  const job = await prisma.job.create({
    data: {
      employerId: employerId ?? null,
      companyLogo: resolvedLogo, companyName: resolvedName, jobTitle, description,
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
  const result = jobs.map(({ _count, ...job }) => ({
    ...job,
    applyCount: _count.applications,
  }));
  res.json(new ApiResponse(200, result));
});

// ── Public: List Active Jobs ──────────────────────────────────────────────────
export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
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

  // Attach hasApplied flag for logged-in users
  if (userId && jobs.length > 0) {
    const jobIds = jobs.map(j => j.id);
    const applications = await prisma.jobApplication.findMany({
      where: { userId, jobId: { in: jobIds } },
      select: { jobId: true, status: true },
    });
    const appliedMap = Object.fromEntries(applications.map(a => [a.jobId, a.status]));
    const result = jobs.map(j => ({
      ...j,
      hasApplied: !!appliedMap[j.id],
      applicationStatus: appliedMap[j.id] ?? null,
    }));
    return res.json(new ApiResponse(200, result));
  }

  res.json(new ApiResponse(200, jobs.map(j => ({ ...j, hasApplied: false, applicationStatus: null }))));
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

// ── Upload Resume ─────────────────────────────────────────────────────────────
export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!req.file) throw new ApiError(400, 'No file provided');

  const ALLOWED = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
  if (!ALLOWED.has(req.file.mimetype.toLowerCase())) throw new ApiError(400, 'Only PDF or Word documents allowed');
  if (req.file.size > 5 * 1024 * 1024) throw new ApiError(400, 'Resume must be under 5MB');

  const ext = path.extname(req.file.originalname) || '.pdf';
  const key = `resumes/${userId}/${crypto.randomUUID()}${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: storageBucket,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }));

  const url = `${config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;
  res.json(new ApiResponse(200, { url }, 'Resume uploaded'));
});

// ── Apply for Job ─────────────────────────────────────────────────────────────
export const applyJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { id: jobId } = req.params;
  const { resumeUrl } = req.body;

  if (!resumeUrl) throw new ApiError(400, 'Resume is required to apply');

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.status !== 'ACTIVE') throw new ApiError(400, 'Job is not accepting applications');
  if (job.lastDate) {
    const deadline = new Date(job.lastDate);
    deadline.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) throw new ApiError(400, 'Application deadline has passed');
  }

  const existing = await prisma.jobApplication.findUnique({
    where: { userId_jobId: { userId, jobId } },
  });
  if (existing) throw new ApiError(409, 'Already applied');

  const [application] = await prisma.$transaction([
    prisma.jobApplication.create({ data: { jobId, userId, resumeUrl } }),
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

// ── Admin: Get Job Applicants ─────────────────────────────────────────────────
export const getJobApplicants = asyncHandler(async (req: Request, res: Response) => {
  const { id: jobId } = req.params;

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, jobTitle: true, companyName: true } });
  if (!job) throw new ApiError(404, 'Job not found');

  const applications = await prisma.jobApplication.findMany({
    where: { jobId },
    orderBy: { appliedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true, displayName: true, email: true, avatarUrl: true,
          phone: true, occupation: true, village: true,
        },
      },
    },
  });

  res.json(new ApiResponse(200, { job, applications }));
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
