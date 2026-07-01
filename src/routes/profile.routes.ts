import { Router } from 'express';
import {
  getJobSeekerProfile,
  upsertJobSeekerProfile,
  getJobSeekerProfileById,
  getEmployerProfile,
  upsertEmployerProfile,
  getEmployerProfileById,
  getBusinessPromoterProfile,
  upsertBusinessPromoterProfile,
} from '../controllers/profile.controller';
import { authenticate, requireRole, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  jobSeekerProfileSchema,
  employerProfileSchema,
  businessPromoterProfileSchema,
} from '../validators/schemas';

const router = Router();

// ── Job Seeker Profile ────────────────────────────────────────────────────────
router.get(
  '/job-seeker',
  authenticate,
  requireRole(ROLES.JOB_SEEKER, ROLES.SUPER_USER),
  getJobSeekerProfile
);
router.put(
  '/job-seeker',
  authenticate,
  requireRole(ROLES.JOB_SEEKER, ROLES.SUPER_USER),
  upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]),
  validate(jobSeekerProfileSchema),
  upsertJobSeekerProfile
);
// Public — recruiter viewing a candidate profile
router.get('/job-seeker/:userId', getJobSeekerProfileById);

// ── Employer Profile ──────────────────────────────────────────────────────────
router.get(
  '/employer',
  authenticate,
  requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER),
  getEmployerProfile
);
router.put(
  '/employer',
  authenticate,
  requireRole(ROLES.JOB_POSTER, ROLES.SUPER_USER),
  upload.fields([{ name: 'logo', maxCount: 1 }]),
  validate(employerProfileSchema),
  upsertEmployerProfile
);
// Public — job seeker viewing company profile
router.get('/employer/:userId', getEmployerProfileById);

// ── Business Promoter Profile ─────────────────────────────────────────────────
router.get(
  '/business-promoter',
  authenticate,
  requireRole(ROLES.BUSINESS_PROMOTER, ROLES.SUPER_USER),
  getBusinessPromoterProfile
);
router.put(
  '/business-promoter',
  authenticate,
  requireRole(ROLES.BUSINESS_PROMOTER, ROLES.SUPER_USER),
  upload.fields([{ name: 'logo', maxCount: 1 }]),
  validate(businessPromoterProfileSchema),
  upsertBusinessPromoterProfile
);

export default router;
