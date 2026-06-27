import { db } from './src/db';
import { roles, globalConfigs } from './src/db/schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed Roles
  await db
    .insert(roles)
    .values([
      { id: 1, name: 'job_seeker' },
      { id: 2, name: 'job_poster' },
      { id: 3, name: 'business_promoter' },
      { id: 4, name: 'super_user' },
    ])
    .onConflictDoNothing();

  // Seed Global Config defaults
  await db
    .insert(globalConfigs)
    .values([
      { key: 'FREE_JOB_APPLY_LIMIT', value: '3' },
      { key: 'FREE_JOB_POST_LIMIT', value: '3' },
      { key: 'PROMOTION_DURATION_DAYS', value: '30' },
      { key: 'SUBSCRIPTION_DAILY_PRICE_USD', value: '1.99' },
      { key: 'SUBSCRIPTION_WEEKLY_PRICE_USD', value: '9.99' },
      { key: 'SUBSCRIPTION_MONTHLY_PRICE_USD', value: '29.99' },
    ])
    .onConflictDoNothing();

  console.log('✅ Database seeded successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
