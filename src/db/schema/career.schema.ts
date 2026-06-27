import { pgTable, uuid, varchar, integer, timestamp, text, boolean, date, index } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

// ─── Work Experiences ─────────────────────────────────────────────────────────
// One row per company/role — supports full career history
export const workExperiences = pgTable('work_experiences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }),
  employmentType: varchar('employment_type', { length: 50 }), // 'full_time' | 'part_time' | 'internship' | 'freelance' | 'contract'

  startDate: date('start_date').notNull(),
  endDate: date('end_date'),                                   // NULL = currently working here
  isCurrentJob: boolean('is_current_job').default(false).notNull(),

  description: text('description'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index('work_experiences_user_id_idx').on(t.userId),
}));

// ─── Educations ───────────────────────────────────────────────────────────────
// One row per degree / course — supports full academic history
export const educations = pgTable('educations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  degree: varchar('degree', { length: 100 }).notNull(),       // 'B.Tech', 'MBA', 'Diploma'
  fieldOfStudy: varchar('field_of_study', { length: 100 }),
  institution: varchar('institution', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }),

  startYear: integer('start_year').notNull(),
  endYear: integer('end_year'),                                // NULL = currently enrolled
  isCurrentlyStudying: boolean('is_currently_studying').default(false).notNull(),

  grade: varchar('grade', { length: 50 }),                    // '8.5 CGPA', '85%', 'First Class'
  description: text('description'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index('educations_user_id_idx').on(t.userId),
}));

// ─── Certifications ───────────────────────────────────────────────────────────
// One row per certificate / license
export const certifications = pgTable('certifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  issuingOrganization: varchar('issuing_organization', { length: 255 }).notNull(),

  issueDate: date('issue_date'),
  expiryDate: date('expiry_date'),                            // NULL = no expiry
  doesNotExpire: boolean('does_not_expire').default(false).notNull(),

  credentialId: varchar('credential_id', { length: 255 }),
  credentialUrl: varchar('credential_url', { length: 1000 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index('certifications_user_id_idx').on(t.userId),
}));
