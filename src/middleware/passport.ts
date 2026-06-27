import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db';
import { users, userRoles } from '../db/schema';
import { eq } from 'drizzle-orm';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found from Google profile'), false);
        }

        // Check if user exists by googleId
        let [user] = await db.select().from(users).where(eq(users.googleId, profile.id)).limit(1);

        if (!user) {
          // Check if user exists by email (to link accounts)
          [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

          if (user) {
            // Update user to link Google ID and avatar
            [user] = await db.update(users)
              .set({ googleId: profile.id, avatarUrl: profile.photos?.[0]?.value })
              .where(eq(users.id, user.id))
              .returning();
          } else {
            // Create brand new user
            [user] = await db.insert(users).values({
              email: email,
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
            }).returning();

            // Default role: job_seeker (roleId = 1)
            await db.insert(userRoles).values({ userId: user.id, roleId: 1 });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// We don't need serialize/deserialize if we are using JWTs, but passport requires it for some strategies if session: true is accidentally used.
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
