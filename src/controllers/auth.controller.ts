import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { users, userRoles, jobSeekerProfiles, employerProfiles, businessPromoterProfiles } from '../db/schema';
import { JwtPayload } from '../middleware/auth.middleware';

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
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
          const { title, firstName, middleName, lastName, phone, address, totalExperienceYears, skills } = profile as any;
          const [created] = await db.insert(jobSeekerProfiles).values({
            userId: user.id,
            title: title || undefined,
            firstName: firstName || undefined,
            middleName: middleName || undefined,
            lastName: lastName || undefined,
            phone: phone || undefined,
            address: address || undefined,
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

    // Always re-fetch roles from DB so newly-added roles are reflected
    // without requiring the user to re-login.
    const freshRoleRows = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));
    const userRoleIds = freshRoleRows.map((r) => r.roleId);


    // Fetch profile completion for every role the user holds — in parallel
    const profileCompletions: Record<string, number> = {};

    await Promise.all(
      userRoleIds.map(async (roleId) => {
        try {
          if (roleId === 1) {
            const [p] = await db.select({ c: jobSeekerProfiles.profileCompletion })
              .from(jobSeekerProfiles).where(eq(jobSeekerProfiles.userId, user.id)).limit(1);
            profileCompletions['1'] = p?.c ?? 0;
          } else if (roleId === 2) {
            const [p] = await db.select({ c: employerProfiles.profileCompletion })
              .from(employerProfiles).where(eq(employerProfiles.userId, user.id)).limit(1);
            profileCompletions['2'] = p?.c ?? 0;
          } else if (roleId === 3) {
            const [p] = await db.select({ c: businessPromoterProfiles.profileCompletion })
              .from(businessPromoterProfiles).where(eq(businessPromoterProfiles.userId, user.id)).limit(1);
            profileCompletions['3'] = p?.c ?? 0;
          }
        } catch {
          profileCompletions[String(roleId)] = 0;
        }
      })
    );

    // Primary completion = maximum across all roles the user holds
    // (This prevents the overall progress bar from dropping to e.g. 40% when a user with an 80% complete profile adds a new 0% complete role)
    const completionValues = Object.values(profileCompletions);
    const profileCompletion = completionValues.length
      ? Math.max(...completionValues)
      : 0;

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
        roles: userRoleIds,
        profileCompletion,       // averaged — for backward compat (navbar)
        profileCompletions,      // per-role map — for profile tabs
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Me error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

// POST /api/auth/add-role
export const addRole = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { roleId } = req.body;
    const targetRoleId = parseInt(roleId, 10);
    
    if (![1, 2, 3].includes(targetRoleId)) {
      res.status(400).json({ success: false, message: 'Invalid role ID' });
      return;
    }

    const userId = req.user.userId;

    // Check if user already has the role
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, targetRoleId)))
      .limit(1);

    if (existingRole.length > 0) {
      res.json({ success: true, message: 'Role already exists' });
      return;
    }

    // Insert new role
    await db.insert(userRoles).values({
      userId,
      roleId: targetRoleId,
    });

    // Fetch updated roles
    const roleRows = await db.select({ roleId: userRoles.roleId }).from(userRoles).where(eq(userRoles.userId, userId));
    const roleIds = roleRows.map((r) => r.roleId);

    // Issue new token
    const token = signToken({ userId, email: req.user.email, roles: roleIds });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({ success: true, message: 'Role added successfully' });
  } catch (error: any) {
    console.error('❌ Add Role error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add role.' });
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
