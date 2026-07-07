import { pgTable, uuid, varchar, timestamp, index, text, date } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { subscriptions } from './subscription.schema';

// ─── Business Promotions ──────────────────────────────────────────────────────
export const businessPromotions = pgTable('business_promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  subscriptionId: uuid('subscription_id')
    .references(() => subscriptions.id), // Nullable now, to support 'draft' state before subscription
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessOwnerName: varchar('business_owner_name', { length: 255 }),
  category: varchar('category', { length: 255 }),
  businessDescription: text('business_description'),
  businessContactDetails: varchar('business_contact_details', { length: 255 }),
  foundationDate: timestamp('foundation_date'),
  purpose: text('purpose'),
  bannerUrl: varchar('banner_url', { length: 1000 }), // Nullable for drafts that don't have banners yet
  status: varchar('status', { length: 20 }).default('draft').notNull(), // 'draft' | 'pending_approval' | 'active' | 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index('promotions_user_id_idx').on(t.userId),
  statusIdx: index('promotions_status_idx').on(t.status),
}));
