import { pgTable, varchar } from 'drizzle-orm/pg-core';

// ─── Global Config ────────────────────────────────────────────────────────────
export const globalConfigs = pgTable('global_configs', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: varchar('value', { length: 100 }).notNull(),
});
