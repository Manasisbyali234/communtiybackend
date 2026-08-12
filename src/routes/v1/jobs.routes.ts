import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { adminAuth } from '../../middleware/adminAuth';
import { upload } from '../../middleware/upload';
import {
  createJob, listJobsAdmin, listJobs, getJob, updateJob, deleteJob,
  applyJob, getUserApplications, checkApplied, updateApplicationStatus,
  uploadJobLogo, getJobApplicants, uploadResume,
  createEmployer, listEmployers, getEmployer, updateEmployer, deleteEmployer, uploadEmployerLogo,
} from '../../controllers/jobs.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();

// ── Employer routes ──────────────────────────────────────────────────────────
router.get('/employers', adminAuth, listEmployers);
router.post('/employers', adminAuth, createEmployer);
router.post('/employers/upload-logo', adminAuth, upload.single('file'), uploadEmployerLogo);
router.get('/employers/:id', adminAuth, getEmployer);
router.put('/employers/:id', adminAuth, updateEmployer);
router.delete('/employers/:id', adminAuth, deleteEmployer);

// Static routes first (must come before /:id)
router.get('/admin/all', adminAuth, listJobsAdmin);
router.post('/upload-logo', adminAuth, upload.single('file'), uploadJobLogo);
router.post('/upload-resume', auth, upload.single('file'), uploadResume);
router.patch('/applications/:applicationId/status', adminAuth, updateApplicationStatus);
router.get('/my-applications', auth, getUserApplications);
router.get('/user/:userId/applications', auth, getUserApplications);

// Public list & create
router.get('/', optionalAuth, listJobs);
router.post('/', adminAuth, createJob);

// Dynamic :id routes
router.get('/:id', getJob);
router.put('/:id', adminAuth, updateJob);
router.delete('/:id', adminAuth, deleteJob);
router.post('/:id/apply', auth, applyJob);
router.get('/:id/applied', auth, checkApplied);
router.get('/:id/applicants', adminAuth, getJobApplicants);

export default router;
