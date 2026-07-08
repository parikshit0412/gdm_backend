import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    await sql`
      ALTER TABLE job_seeker_profiles 
      ADD COLUMN title VARCHAR(50),
      ADD COLUMN first_name VARCHAR(100),
      ADD COLUMN middle_name VARCHAR(100),
      ADD COLUMN last_name VARCHAR(100);
    `;
    console.log('Successfully added title, first_name, middle_name, last_name columns');
  } catch (error) {
    console.error('Error adding columns:', error);
  }
}

main();
