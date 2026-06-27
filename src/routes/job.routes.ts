import { Router } from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  deleteJob,
  applyToJob,
} from '../controllers/job.controller';
import { authenticate, requireRole, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createJobSchema } from '../validators/schemas';

const router = Router();

// Public
router.get('/', getAllJobs);
router.get('/:id', getJobById);

// Authenticated — job_poster or super_user can post
router.post(
  '/',
  authenticate,
  requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER),
  validate(createJobSchema),
  createJob
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
