import 'dotenv/config';
import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS alternate_phone varchar(20);`);
    await db.execute(sql`ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS alternate_email varchar(255);`);
    await db.execute(sql`ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;`);
    console.log("Database updated successfully");
  } catch (e) {
    console.error("Error updating db", e);
  }
  process.exit(0);
}
run();
