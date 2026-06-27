import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { subscriptions } from './subscription.schema';

// ─── Business Promotions ──────────────────────────────────────────────────────
export const businessPromotions = pgTable('business_promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  subscriptionId: uuid('subscription_id')
    .references(() => subscriptions.id)
    .notNull(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  bannerUrl: varchar('banner_url', { length: 1000 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending_approval').notNull(), // 'pending_approval' | 'active' | 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index('promotions_user_id_idx').on(t.userId),
  statusIdx: index('promotions_status_idx').on(t.status),
}));
