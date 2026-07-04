import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`
      ALTER TABLE jobs 
      ALTER COLUMN description TYPE TEXT;
    `;
    console.log('Successfully updated jobs table description column to TEXT');
  } catch (error) {
    console.error('Error updating jobs table:', error);
  }
}

main();
