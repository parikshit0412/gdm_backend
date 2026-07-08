import 'dotenv/config';
import { db } from './src/db';
import { users, userRoles } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const user = await db.select().from(users).where(eq(users.email, 'testjob2@email.com'));
    
    if (user.length === 0) {
      console.log('User not found');
      return;
    }

    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, user[0].id));
    console.log(`User ${user[0].email} has ${roles.length} roles:`);
    console.log(roles);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
