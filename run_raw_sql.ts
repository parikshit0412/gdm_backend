import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    console.log('Adding certifications column...');
    await sql`ALTER TABLE "job_seeker_profiles" ADD COLUMN IF NOT EXISTS "certifications" jsonb DEFAULT '[]'::jsonb;`;
    console.log('Certifications column added.');
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
