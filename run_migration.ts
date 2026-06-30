import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "job_seeker_profiles" 
      DROP COLUMN IF EXISTS "current_job_title",
      DROP COLUMN IF EXISTS "highest_degree",
      DROP COLUMN IF EXISTS "field_of_study",
      DROP COLUMN IF EXISTS "institution",
      DROP COLUMN IF EXISTS "graduation_year",
      ADD COLUMN IF NOT EXISTS "experience" jsonb DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "education" jsonb DEFAULT '[]';
    `);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
