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
import { authenticate, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  jobSeekerProfileSchema,
  employerProfileSchema,
  businessPromoterProfileSchema,
} from '../validators/schemas';

const router = Router();

// ── IMPORTANT: All profile routes are open to any authenticated user.
// Each controller scopes results strictly by `userId` from the JWT,
// so a multi-role user (e.g. roles [1,2]) can access both their
// job-seeker AND employer profiles without needing separate tokens.
// The profile controller itself is the security boundary — not the route guard.

// ── Job Seeker Profile ────────────────────────────────────────────────────────
router.get('/job-seeker', authenticate, getJobSeekerProfile);
router.put(
  '/job-seeker',
  authenticate,
  upload.any(), // Changed to any() to support dynamic cert_file_X uploads
  validate(jobSeekerProfileSchema),
  upsertJobSeekerProfile
);
// Public — recruiter viewing a candidate profile
router.get('/job-seeker/:userId', getJobSeekerProfileById);

// ── Employer Profile ──────────────────────────────────────────────────────────
router.get('/employer', authenticate, getEmployerProfile);
router.put(
  '/employer',
  authenticate,
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]),
  validate(employerProfileSchema),
  upsertEmployerProfile
);
// Public — job seeker viewing company profile
router.get('/employer/:userId', getEmployerProfileById);

// ── Business Promoter Profile ─────────────────────────────────────────────────
router.get('/business-promoter', authenticate, getBusinessPromoterProfile);
router.put(
  '/business-promoter',
  authenticate,
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]),
  validate(businessPromoterProfileSchema),
  upsertBusinessPromoterProfile
);

export default router;
