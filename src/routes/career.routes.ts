import { Router } from 'express';
import {
  listWorkExperiences,
  listWorkExperiencesByUser,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  listEducations,
  listEducationsByUser,
  createEducation,
  updateEducation,
  deleteEducation,
  listCertifications,
  listCertificationsByUser,
  createCertification,
  updateCertification,
  deleteCertification,
} from '../controllers/career.controller';
import { authenticate, requireRole, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  workExperienceSchema,
  workExperienceUpdateSchema,
  educationSchema,
  educationUpdateSchema,
  certificationSchema,
  certificationUpdateSchema,
} from '../validators/schemas';

const router = Router();

const jobSeekerOnly = [authenticate, requireRole(ROLES.JOB_SEEKER, ROLES.SUPER_USER)];

// ── Work Experiences ──────────────────────────────────────────────────────────
router.get('/experiences', ...jobSeekerOnly, listWorkExperiences);
router.get('/experiences/user/:userId', listWorkExperiencesByUser);             // public
router.post('/experiences', ...jobSeekerOnly, validate(workExperienceSchema), createWorkExperience);
router.patch('/experiences/:id', ...jobSeekerOnly, validate(workExperienceUpdateSchema), updateWorkExperience);
router.delete('/experiences/:id', ...jobSeekerOnly, deleteWorkExperience);

// ── Educations ────────────────────────────────────────────────────────────────
router.get('/educations', ...jobSeekerOnly, listEducations);
router.get('/educations/user/:userId', listEducationsByUser);                   // public
router.post('/educations', ...jobSeekerOnly, validate(educationSchema), createEducation);
router.patch('/educations/:id', ...jobSeekerOnly, validate(educationUpdateSchema), updateEducation);
router.delete('/educations/:id', ...jobSeekerOnly, deleteEducation);

// ── Certifications ────────────────────────────────────────────────────────────
router.get('/certifications', ...jobSeekerOnly, listCertifications);
router.get('/certifications/user/:userId', listCertificationsByUser);          // public
router.post('/certifications', ...jobSeekerOnly, validate(certificationSchema), createCertification);
router.patch('/certifications/:id', ...jobSeekerOnly, validate(certificationUpdateSchema), updateCertification);
router.delete('/certifications/:id', ...jobSeekerOnly, deleteCertification);

export default router;
