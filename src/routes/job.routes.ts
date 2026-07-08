import { Router } from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  deleteJob,
  applyToJob,
  getEmployerJobs,
  toggleJobStatus,
  updateJob,
  getJobApplicants,
} from '../controllers/job.controller';
import { authenticate, requireRole, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createJobSchema } from '../validators/schemas';

const router = Router();

// Public
router.get('/', getAllJobs);

// Authenticated — employer specific routes
router.get('/employer/me', authenticate, requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER), getEmployerJobs);
router.patch('/:id/status', authenticate, requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER), toggleJobStatus);

router.get('/:id', getJobById);
router.get('/:id/applicants', authenticate, requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER), getJobApplicants);

// Authenticated — job_poster or super_user can post and edit
router.post(
  '/',
  authenticate,
  requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER),
  validate(createJobSchema),
  createJob
);

router.put(
  '/:id',
  authenticate,
  requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER),
  validate(createJobSchema), // Reusing create job schema for validation
  updateJob
);

// Authenticated — job_seeker applies
router.post(
  '/:id/apply',
  authenticate,
  requireRole(ROLES.JOB_SEEKER, ROLES.SUPER_USER),
  applyToJob
);

// Delete — owner or super_user (checked in controller)
router.delete('/:id', authenticate, deleteJob);

export default router;
