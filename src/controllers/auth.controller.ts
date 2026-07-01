import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, userRoles, jobSeekerProfiles, employerProfiles, businessPromoterProfiles } from '../db/schema';
import { JwtPayload } from '../middleware/auth.middleware';

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd, // Must be true if sameSite is none
  sameSite: isProd ? ('none' as const) : ('lax' as const), 
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);
}

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, profile } = req.body as {
      email: string;
      password: string;
      role?: 'job_seeker' | 'job_poster' | 'business_promoter';
      profile?: Record<string, unknown>;
    };

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Map role name to roleId
    const ROLE_MAP: Record<string, number> = {
      job_seeker: 1,
      job_poster: 2,
      business_promoter: 3,
    };
    const selectedRole = role || 'job_seeker';
    const roleId = ROLE_MAP[selectedRole];

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash }).returning();

    // Assign the selected role
    await db.insert(userRoles).values({ userId: user.id, roleId });

    // Create role-specific profile if profile data is provided
    let profileData = null;
    if (profile && Object.keys(profile).length > 0) {
      try {
        if (selectedRole === 'job_seeker') {
          const { fullName, phone, location, totalExperienceYears, skills } = profile as any;
          const [created] = await db.insert(jobSeekerProfiles).values({
            userId: user.id,
            fullName: fullName || undefined,
            phone: phone || undefined,
            location: location || undefined,
            totalExperienceYears: totalExperienceYears ? Number(totalExperienceYears) : undefined,
            skills: skills || undefined,
          }).returning();
          profileData = created;
        } else if (selectedRole === 'job_poster') {
          const { companyName, industry, companySize, headquarters, hrName, hrEmail, hrPhone } = profile as any;
          const [created] = await db.insert(employerProfiles).values({
            userId: user.id,
            companyName, industry, companySize, headquarters, hrName, hrEmail, hrPhone,
          }).returning();
          profileData = created;
        } else if (selectedRole === 'business_promoter') {
          const { businessName, businessCategory, contactPhone, contactEmail, address, gstNumber } = profile as any;
          const [created] = await db.insert(businessPromoterProfiles).values({
            userId: user.id,
            businessName, businessCategory, contactPhone, contactEmail, address, gstNumber,
          }).returning();
          profileData = created;
        }
      } catch (profileErr: any) {
        console.error('⚠️ Profile creation failed (user created):', profileErr.message);
        // User was created successfully — profile can be filled later
      }
    }

    const token = signToken({ userId: user.id, email: user.email, roles: [roleId] });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Account created',
      data: { id: user.id, email: user.email, roles: [selectedRole], profile: profileData },
      token,
    });
  } catch (error: any) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ success: false, message: 'Please sign in using your Google or LinkedIn account.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Fetch all roles for the user
    const roleRows = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));

    const roleIds = roleRows.map((r) => r.roleId);

    const token = signToken({ userId: user.id, email: user.email, roles: roleIds });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Login successful',
      data: { id: user.id, email: user.email, roleIds },
      token,
    });
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// POST /api/auth/logout
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.json({ success: true, authenticated: false, data: null });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);
    if (!user) {
      res.json({ success: true, authenticated: false, data: null });
      return;
    }

    // Determine primary role to fetch profile
    let profileCompletion = 0;
    
    // We assume the first role in req.user.roles is the primary role for now.
    // 1: job_seeker, 2: job_poster, 3: business_promoter
    if (req.user.roles && req.user.roles.length > 0) {
      const primaryRoleId = req.user.roles[0];
      
      if (primaryRoleId === 1) {
        const [profile] = await db.select().from(jobSeekerProfiles).where(eq(jobSeekerProfiles.userId, user.id)).limit(1);
        if (profile) profileCompletion = profile.profileCompletion ?? 0;
      } else if (primaryRoleId === 2) {
        const [profile] = await db.select().from(employerProfiles).where(eq(employerProfiles.userId, user.id)).limit(1);
        if (profile) profileCompletion = profile.profileCompletion ?? 0;
      } else if (primaryRoleId === 3) {
        const [profile] = await db.select().from(businessPromoterProfiles).where(eq(businessPromoterProfiles.userId, user.id)).limit(1);
        if (profile) profileCompletion = profile.profileCompletion ?? 0;
      }
    }

    res.json({
      success: true,
      authenticated: true,
      data: {
        id: user.id,
        email: user.email,
        googleId: user.googleId,
        avatarUrl: user.avatarUrl,
        jobApplyCount: user.jobApplyCount,
        jobPostCount: user.jobPostCount,
        roles: req.user.roles,
        profileCompletion,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Me error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

// GET /api/auth/google/callback
export const googleOAuthCallback = async (req: Request, res: Response): Promise<void> => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  try {
    // req.user is set by Passport's Google Strategy
    const user = req.user as any; 
    if (!user) {
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      return;
    }

    // Fetch roles
    const roleRows = await db.select({ roleId: userRoles.roleId }).from(userRoles).where(eq(userRoles.userId, user.id));
    const roleIds = roleRows.map((r) => r.roleId);

    const token = signToken({ userId: user.id, email: user.email, roles: roleIds });
    res.cookie('token', token, COOKIE_OPTIONS);

    // Redirect to frontend dashboard/home with token in query params
    res.redirect(`${FRONTEND_URL}/?token=${token}`);
  } catch (error: any) {
    console.error('❌ Google OAuth callback error:', error.message);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};
