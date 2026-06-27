import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  subscriptionType: varchar('subscription_type', { length: 50 }).notNull(), // 'job_seeker' | 'job_poster' | 'business_promoter'
  tier: varchar('tier', { length: 20 }).notNull(),                          // 'daily' | 'weekly' | 'monthly'
  status: varchar('status', { length: 20 }).default('active').notNull(),    // 'active' | 'expired'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index('subscriptions_user_id_idx').on(t.userId),
  typeStatusIdx: index('subscriptions_type_status_idx').on(t.subscriptionType, t.status),
}));
