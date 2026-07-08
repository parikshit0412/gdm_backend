import { z } from 'zod';

const jobSeekerExperienceSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  companyLocation: z.string().optional(),
  jobType: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  description: z.string().optional(),
});

const jobSeekerEducationSchema = z.object({
  degree: z.string(),
  fieldOfStudy: z.string(),
  institution: z.string(),
  graduationYear: z.coerce.number().int(),
});

const jobSeekerCertificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuing organization is required'),
  status: z.enum(['completed', 'pursuing'], { message: 'Invalid status' }),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url('Invalid credential URL').or(z.literal('')).optional(),
  fileUrl: z.string().optional(),
});

const jsonParsePreprocessor = (val: unknown) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roles: z.array(z.number()).nonempty('At least one role must be selected'),
  profile: z.object({
    // Job Seeker fields
    title: z.string().min(2, 'Title must be at least 2 characters').max(50, 'Title is too long').optional(),
    firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long').optional(),
    middleName: z.string().max(100, 'Middle name is too long').optional(),
    lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long').optional(),
    phone: z.string().max(20, 'Phone number is too long').optional(),
    currentJobTitle: z.string().max(255, 'Job title is too long').optional(),
    totalExperienceYears: z.number().int().min(0, 'Experience cannot be negative').max(60, 'Experience is too high').optional(),
    skills: z.string().max(1000, 'Skills list is too long').optional(),
    
    // Employer fields
    companyName: z.string().min(2, 'Company name must be at least 2 characters').max(255, 'Company name is too long').optional(),
    industry: z.string().max(100, 'Industry name is too long').optional(),
    companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+'], { message: 'Invalid company size' }).optional(),
    headquarters: z.string().max(255, 'Headquarters location is too long').optional(),
    hrName: z.string().max(255, 'HR name is too long').optional(),
    hrEmail: z.string().email('Invalid HR email').optional().or(z.literal('')),
    hrPhone: z.string().max(20, 'HR phone is too long').optional(),
    
    // Business Promoter fields
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255, 'Business name is too long').optional(),
    businessCategory: z.string().max(100, 'Category is too long').optional(),
    contactPhone: z.string().max(20, 'Contact phone is too long').optional(),
    contactEmail: z.string().email('Invalid contact email').optional().or(z.literal('')),
    gstNumber: z.string().max(20, 'GST number is too long').optional(),

    // Shared field: Business promoter uses string, Job seeker uses object
    address: z.union([
      z.string().max(500, 'Address is too long'),
      z.object({
        country: z.string().min(1, 'Country is required'),
        state: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        zipCode: z.string().optional(),
        addressLine1: z.string().optional(),
      })
    ]).optional(),
  }).optional(),
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
  companyName: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  salaryRange: z.string().max(100).optional(),
  jobType: z.string().max(50).optional(),
  workMode: z.string().max(50).optional(),
  experience: z.string().max(100).optional(),
  skills: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  education: z.string().max(255).optional(),
  benefits: z.string().max(1000).optional(),
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
  title: z.string().min(2, 'Title must be at least 2 characters').max(50, 'Title is too long').optional(),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long').optional(),
  middleName: z.string().max(100, 'Middle name is too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  alternatePhone: z.string().max(20, 'Alternate phone is too long').optional(),
  alternateEmail: z.string().email('Invalid alternate email').optional().or(z.literal('')),
  address: z.preprocess(jsonParsePreprocessor, z.object({
    country: z.string().min(1, 'Country is required'),
    state: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    zipCode: z.string().optional(),
    addressLine1: z.string().optional(),
  })).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')).optional(),

  totalExperienceYears: z.coerce.number({ message: 'Experience must be a number' }).int().min(0, 'Experience cannot be negative').max(60, 'Experience is too high').optional(),
  expectedSalary: z.string().max(50, 'Expected salary is too long').optional(),
  availability: z.enum(['immediate', '15_days', '1_month', '2_months'], { message: 'Invalid availability selected' }).optional(),
  summary: z.string().max(2000, 'Summary is too long').optional(),

  experience: z.preprocess(jsonParsePreprocessor, z.array(jobSeekerExperienceSchema)).optional(),
  education: z.preprocess(jsonParsePreprocessor, z.array(jobSeekerEducationSchema)).optional(),
  certifications: z.preprocess(jsonParsePreprocessor, z.array(jobSeekerCertificationSchema)).optional(),

  skills: z.string().max(1000).optional(), // comma-separated

  resumeUrl: z.string().url().or(z.literal('')).optional(),
  linkedinUrl: z.string().url().or(z.literal('')).optional(),
  githubUrl: z.string().url().or(z.literal('')).optional(),
  portfolioUrl: z.string().url().or(z.literal('')).optional(),
});

// ─── Employer Profile ─────────────────────────────────────────────────────────
export const employerProfileSchema = z.object({
  companyName: z.string().min(2).max(255).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  industry: z.string().max(100).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  foundedYear: z.coerce.number().int().min(1800).max(2100).optional(),
  about: z.string().max(3000).optional(),
  headquarters: z.string().max(255).optional(),

  websiteUrl: z.string().url().or(z.literal('')).optional(),
  linkedinUrl: z.string().url().or(z.literal('')).optional(),
  twitterUrl: z.string().url().or(z.literal('')).optional(),

  hrName: z.string().max(255).optional(),
  hrEmail: z.string().email().optional(),
  hrPhone: z.string().max(20).optional(),
});

// ─── Business Promoter Profile ────────────────────────────────────────────────
export const businessPromoterProfileSchema = z.object({
  businessName: z.string().min(2).max(255).optional(),
  businessCategory: z.string().max(100).optional(),
  about: z.string().max(3000).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),

  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().max(500).optional(),

  websiteUrl: z.string().url().or(z.literal('')).optional(),
  linkedinUrl: z.string().url().or(z.literal('')).optional(),
  instagramUrl: z.string().url().or(z.literal('')).optional(),
  facebookUrl: z.string().url().or(z.literal('')).optional(),

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
