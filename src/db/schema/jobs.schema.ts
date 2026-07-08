import { pgTable, uuid, varchar, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  employerId: uuid('employer_id')
    .references(() => users.id)
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  // New Fields
  companyName: varchar('company_name', { length: 255 }),
  location: varchar('location', { length: 255 }),
  salaryRange: varchar('salary_range', { length: 100 }),
  jobType: varchar('job_type', { length: 50 }),
  workMode: varchar('work_mode', { length: 50 }),
  experience: varchar('experience', { length: 100 }),
  skills: varchar('skills', { length: 1000 }),
  category: varchar('category', { length: 100 }),
  education: varchar('education', { length: 255 }),
  benefits: varchar('benefits', { length: 1000 }),
  
  // Soft Delete and Status
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  employerIdIdx: index('jobs_employer_id_idx').on(t.employerId),
  createdAtIndex: index('jobs_created_at_idx').on(t.createdAt),
}));

// ─── Job Applications ──────────────────────────────────────────────────────────
export const jobApplications = pgTable('job_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id')
    .references(() => jobs.id)
    .notNull(),
  applicantId: uuid('applicant_id')
    .references(() => users.id)
    .notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  jobIdIdx: index('job_applications_job_id_idx').on(t.jobId),
  applicantIdIdx: index('job_applications_applicant_id_idx').on(t.applicantId),
}));
