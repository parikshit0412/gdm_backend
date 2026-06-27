import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscriptionSchema = z.object({
  subscriptionType: z.enum(['job_seeker', 'job_poster', 'business_promoter']),
  tier: z.enum(['daily', 'weekly', 'monthly']),
});

// ─── Job ──────────────────────────────────────────────────────────────────────
export const createJobSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
});

// ─── Business Promotion ───────────────────────────────────────────────────────
export const createPromotionSchema = z.object({
  subscriptionId: z.string().uuid(),
  businessName: z.string().min(2).max(255),
  bannerUrl: z.string().url(),
});

export const updatePromotionStatusSchema = z.object({
  status: z.enum(['active', 'rejected']),
});

// ─── Global Config ────────────────────────────────────────────────────────────
export const updateConfigSchema = z.object({
  value: z.string().min(1).max(100),
});

// ─── Role Assignment ──────────────────────────────────────────────────────────
export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.number().int().min(1).max(4),
});

// ─── Job Seeker Profile ───────────────────────────────────────────────────────
export const jobSeekerProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(255).optional(),
  avatarUrl: z.string().url().optional(),

  currentJobTitle: z.string().max(255).optional(),
  totalExperienceYears: z.number().int().min(0).max(60).optional(),
  expectedSalary: z.string().max(50).optional(),
  availability: z.enum(['immediate', '15_days', '1_month', '2_months']).optional(),
  summary: z.string().max(2000).optional(),

  highestDegree: z.string().max(100).optional(),
  fieldOfStudy: z.string().max(100).optional(),
  institution: z.string().max(255).optional(),
  graduationYear: z.number().int().min(1970).max(2100).optional(),

  skills: z.string().max(1000).optional(), // comma-separated

  resumeUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
});

// ─── Employer Profile ─────────────────────────────────────────────────────────
export const employerProfileSchema = z.object({
  companyName: z.string().min(2).max(255).optional(),
  logoUrl: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  about: z.string().max(3000).optional(),
  headquarters: z.string().max(255).optional(),

  websiteUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),

  hrName: z.string().max(255).optional(),
  hrEmail: z.string().email().optional(),
  hrPhone: z.string().max(20).optional(),
});

// ─── Business Promoter Profile ────────────────────────────────────────────────
export const businessPromoterProfileSchema = z.object({
  businessName: z.string().min(2).max(255).optional(),
  businessCategory: z.string().max(100).optional(),
  about: z.string().max(3000).optional(),
  logoUrl: z.string().url().optional(),

  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().max(500).optional(),

  websiteUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),

  gstNumber: z.string().max(20).optional(),
});

// ─── Work Experience ──────────────────────────────────────────────────────────
// Base object — used by both create (with refine) and update (with partial)
const workExperienceBase = z.object({
  jobTitle: z.string().min(2).max(255),
  companyName: z.string().min(2).max(255),
  location: z.string().max(255).optional(),
  employmentType: z
    .enum(['full_time', 'part_time', 'internship', 'freelance', 'contract'])
    .optional(),

  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD')
    .optional(),
  isCurrentJob: z.boolean().default(false),

  description: z.string().max(3000).optional(),
});

// Create — requires endDate unless isCurrentJob is true
export const workExperienceSchema = workExperienceBase.refine(
  (data) => data.isCurrentJob || !!data.endDate,
  { message: 'endDate is required when isCurrentJob is false', path: ['endDate'] }
);

// Update — all fields optional, no cross-field refine needed
export const workExperienceUpdateSchema = workExperienceBase.partial();

// ─── Education ────────────────────────────────────────────────────────────────
const educationBase = z.object({
  degree: z.string().min(2).max(100),
  fieldOfStudy: z.string().max(100).optional(),
  institution: z.string().min(2).max(255),
  location: z.string().max(255).optional(),

  startYear: z.number().int().min(1970).max(2100),
  endYear: z.number().int().min(1970).max(2100).optional(),
  isCurrentlyStudying: z.boolean().default(false),

  grade: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

// Create — requires endYear unless isCurrentlyStudying is true
export const educationSchema = educationBase.refine(
  (data) => data.isCurrentlyStudying || !!data.endYear,
  { message: 'endYear is required when isCurrentlyStudying is false', path: ['endYear'] }
);

// Update — all fields optional
export const educationUpdateSchema = educationBase.partial();

// ─── Certification ────────────────────────────────────────────────────────────
// No refine needed here — .partial() works directly on the base object
const certificationBase = z.object({
  name: z.string().min(2).max(255),
  issuingOrganization: z.string().min(2).max(255),

  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD')
    .optional(),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD')
    .optional(),
  doesNotExpire: z.boolean().default(false),

  credentialId: z.string().max(255).optional(),
  credentialUrl: z.string().url().optional(),
});

export const certificationSchema = certificationBase;
export const certificationUpdateSchema = certificationBase.partial();
