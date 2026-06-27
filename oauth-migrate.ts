import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Adding OAuth columns to users table...');

  // 1. Make password_hash nullable
  await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
  console.log('✅ password_hash is now nullable');

  // 2. Add google_id column
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE`;
  console.log('✅ google_id column added');

  // 3. Add linkedin_id column
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255) UNIQUE`;
  console.log('✅ linkedin_id column added');

  // 4. Add avatar_url column
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000)`;
  console.log('✅ avatar_url column added');

  console.log('\n🎉 OAuth migration complete!');
}

migrate().catch(console.error);
