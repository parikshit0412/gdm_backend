import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    await sql`
      ALTER TABLE job_seeker_profiles 
      ADD COLUMN alternate_phone VARCHAR(20),
      ADD COLUMN alternate_email VARCHAR(255);
    `;
    console.log('Successfully added alternate_phone and alternate_email columns');
  } catch (error) {
    console.error('Error adding columns:', error);
  }
}

main();
