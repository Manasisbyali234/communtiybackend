"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const adminAuth_1 = require("../../middleware/adminAuth");
const upload_1 = require("../../middleware/upload");
const jobs_controller_1 = require("../../controllers/jobs.controller");
const auth_2 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Static routes first (must come before /:id)
router.get('/admin/all', adminAuth_1.adminAuth, jobs_controller_1.listJobsAdmin);
router.post('/upload-logo', adminAuth_1.adminAuth, upload_1.upload.single('file'), jobs_controller_1.uploadJobLogo);
router.patch('/applications/:applicationId/status', adminAuth_1.adminAuth, jobs_controller_1.updateApplicationStatus);
router.get('/my-applications', auth_1.auth, jobs_controller_1.getUserApplications);
router.get('/user/:userId/applications', auth_1.auth, jobs_controller_1.getUserApplications);
// Public list & create
router.get('/', auth_2.optionalAuth, jobs_controller_1.listJobs);
router.post('/', adminAuth_1.adminAuth, jobs_controller_1.createJob);
// Dynamic :id routes
router.get('/:id', auth_2.optionalAuth, jobs_controller_1.getJob);
router.put('/:id', adminAuth_1.adminAuth, jobs_controller_1.updateJob);
router.delete('/:id', adminAuth_1.adminAuth, jobs_controller_1.deleteJob);
router.post('/:id/apply', auth_1.auth, jobs_controller_1.applyJob);
router.get('/:id/applied', auth_1.auth, jobs_controller_1.checkApplied);
router.get('/:id/applicants', adminAuth_1.adminAuth, jobs_controller_1.getJobApplicants);
exports.default = router;
//# sourceMappingURL=jobs.routes.js.map