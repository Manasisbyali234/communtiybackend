import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { adminAuth } from '../../middleware/adminAuth';
import {
  createJob, listJobsAdmin, listJobs, getJob, updateJob, deleteJob,
  applyJob, getUserApplications, checkApplied, updateApplicationStatus,
} from '../../controllers/jobs.controller';

const router = Router();

// Static routes first (must come before /:id)
router.get('/admin/all', adminAuth, listJobsAdmin);
router.patch('/applications/:applicationId/status', adminAuth, updateApplicationStatus);
router.get('/user/:userId/applications', auth, getUserApplications);

// Public list & create
router.get('/', listJobs);
router.post('/', adminAuth, createJob);

// Dynamic :id routes
router.get('/:id', getJob);
router.put('/:id', adminAuth, updateJob);
router.delete('/:id', adminAuth, deleteJob);
router.post('/:id/apply', auth, applyJob);
router.get('/:id/applied', auth, checkApplied);

export default router;
