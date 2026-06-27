import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, userRoles } from '../db/schema';
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
    const { email, password } = req.body as { email: string; password: string };

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash }).returning();

    // Default role: job_seeker (roleId = 1)
    await db.insert(userRoles).values({ userId: user.id, roleId: 1 });

    const token = signToken({ userId: user.id, email: user.email, roles: [1] });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Account created',
      data: { id: user.id, email: user.email, roles: ['job_seeker'] },
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
