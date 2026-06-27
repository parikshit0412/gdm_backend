import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  employerId: uuid('employer_id')
    .references(() => users.id)
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 5000 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  employerIdIdx: index('jobs_employer_id_idx').on(t.employerId),
  createdAtIndex: index('jobs_created_at_idx').on(t.createdAt),
}));
