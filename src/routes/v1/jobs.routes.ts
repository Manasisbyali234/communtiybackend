import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { adminAuth } from '../../middleware/adminAuth';
import { upload } from '../../middleware/upload';
import {
  createJob, listJobsAdmin, listJobs, getJob, updateJob, deleteJob,
  applyJob, getUserApplications, checkApplied, updateApplicationStatus,
  uploadJobLogo, getJobApplicants,
} from '../../controllers/jobs.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();

// Static routes first (must come before /:id)
router.get('/admin/all', adminAuth, listJobsAdmin);
router.post('/upload-logo', adminAuth, upload.single('file'), uploadJobLogo);
router.patch('/applications/:applicationId/status', adminAuth, updateApplicationStatus);
router.get('/my-applications', auth, getUserApplications);
router.get('/user/:userId/applications', auth, getUserApplications);

// Public list & create
router.get('/', optionalAuth, listJobs);
router.post('/', adminAuth, createJob);

// Dynamic :id routes
router.get('/:id', optionalAuth, getJob);
router.put('/:id', adminAuth, updateJob);
router.delete('/:id', adminAuth, deleteJob);
router.post('/:id/apply', auth, applyJob);
router.get('/:id/applied', auth, checkApplied);
router.get('/:id/applicants', adminAuth, getJobApplicants);

export default router;
