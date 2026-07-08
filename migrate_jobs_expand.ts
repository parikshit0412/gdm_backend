import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS salary_range VARCHAR(100),
      ADD COLUMN IF NOT EXISTS job_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50),
      ADD COLUMN IF NOT EXISTS experience VARCHAR(100),
      ADD COLUMN IF NOT EXISTS skills VARCHAR(1000),
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS education VARCHAR(255),
      ADD COLUMN IF NOT EXISTS benefits VARCHAR(1000),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL,
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
    `;
    console.log('Successfully expanded jobs table with new columns');
  } catch (error) {
    console.error('Error expanding jobs table:', error);
  }
}

main();
