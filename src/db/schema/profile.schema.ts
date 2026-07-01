import { pgTable, uuid, varchar, integer, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

// ─── Job Seeker Profiles ──────────────────────────────────────────────────────
export const jobSeekerProfiles = pgTable('job_seeker_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),

  // Personal Info
  fullName: varchar('full_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  location: varchar('location', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 1000 }),

  // Professional
  totalExperienceYears: integer('total_experience_years'),
  expectedSalary: varchar('expected_salary', { length: 50 }),
  availability: varchar('availability', { length: 50 }),       // 'immediate' | '15_days' | '1_month' | '2_months'
  summary: text('summary'),

  // Dynamic Arrays
  experience: jsonb('experience').$type<Array<{ jobTitle: string; company: string; startDate: string; endDate?: string; isCurrent: boolean; description?: string }>>().default([]),
  education: jsonb('education').$type<Array<{ degree: string; fieldOfStudy: string; institution: string; graduationYear: number }>>().default([]),

  // Skills — comma-separated string
  skills: text('skills'),

  // Social / Portfolio Links
  resumeUrl: varchar('resume_url', { length: 1000 }),
  linkedinUrl: varchar('linkedin_url', { length: 1000 }),
  githubUrl: varchar('github_url', { length: 1000 }),
  portfolioUrl: varchar('portfolio_url', { length: 1000 }),

  // System
  profileCompletion: integer('profile_completion').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Employer Profiles ────────────────────────────────────────────────────────
export const employerProfiles = pgTable('employer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),

  // Company Info
  companyName: varchar('company_name', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 1000 }),
  industry: varchar('industry', { length: 100 }),
  companySize: varchar('company_size', { length: 50 }),        // '1-10' | '11-50' | '51-200' | '201-500' | '500+'
  foundedYear: integer('founded_year'),
  about: text('about'),
  headquarters: varchar('headquarters', { length: 255 }),

  // Contact / Social
  websiteUrl: varchar('website_url', { length: 1000 }),
  linkedinUrl: varchar('linkedin_url', { length: 1000 }),
  twitterUrl: varchar('twitter_url', { length: 1000 }),

  // HR Contact
  hrName: varchar('hr_name', { length: 255 }),
  hrEmail: varchar('hr_email', { length: 255 }),
  hrPhone: varchar('hr_phone', { length: 20 }),

  // System
  profileCompletion: integer('profile_completion').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Business Promoter Profiles ───────────────────────────────────────────────
export const businessPromoterProfiles = pgTable('business_promoter_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),

  // Business Info
  businessName: varchar('business_name', { length: 255 }),
  businessCategory: varchar('business_category', { length: 100 }),
  about: text('about'),
  logoUrl: varchar('logo_url', { length: 1000 }),

  // Contact
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  address: varchar('address', { length: 500 }),

  // Online Presence
  websiteUrl: varchar('website_url', { length: 1000 }),
  linkedinUrl: varchar('linkedin_url', { length: 1000 }),
  instagramUrl: varchar('instagram_url', { length: 1000 }),
  facebookUrl: varchar('facebook_url', { length: 1000 }),

  // Trust / Verification
  gstNumber: varchar('gst_number', { length: 20 }),

  // System
  profileCompletion: integer('profile_completion').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
