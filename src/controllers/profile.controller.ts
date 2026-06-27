import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import {
  jobSeekerProfiles,
  employerProfiles,
  businessPromoterProfiles,
} from '../db/schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type UpsertResult<T> = { isNew: boolean; data: T };

async function upsertProfile<T extends { userId: string }>(
  table: typeof jobSeekerProfiles | typeof employerProfiles | typeof businessPromoterProfiles,
  userId: string,
  payload: Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<UpsertResult<unknown>> {
  // Check if profile exists
  const existing = await db
    .select()
    .from(table as typeof jobSeekerProfiles)
    .where(eq((table as typeof jobSeekerProfiles).userId, userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(table as typeof jobSeekerProfiles)
      .set({ ...payload, updatedAt: new Date() } as never)
      .where(eq((table as typeof jobSeekerProfiles).userId, userId))
      .returning();
    return { isNew: false, data: updated };
  }

  const [created] = await db
    .insert(table as typeof jobSeekerProfiles)
    .values({ userId, ...payload } as never)
    .returning();
  return { isNew: true, data: created };
}

// ─── Job Seeker Profile ────────────────────────────────────────────────────────

// GET /api/profiles/job-seeker
export const getJobSeekerProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [profile] = await db
    .select()
    .from(jobSeekerProfiles)
    .where(eq(jobSeekerProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ success: false, message: 'Profile not found. Please create one.' });
    return;
  }
  res.json({ success: true, data: profile });
};

// PUT /api/profiles/job-seeker  (upsert — create or update)
export const upsertJobSeekerProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { isNew, data } = await upsertProfile(jobSeekerProfiles, userId, req.body);

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Profile created' : 'Profile updated',
    data,
  });
};

// GET /api/profiles/job-seeker/:userId  (public view — for recruiters)
export const getJobSeekerProfileById = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['userId'] as string;
  const [profile] = await db
    .select()
    .from(jobSeekerProfiles)
    .where(eq(jobSeekerProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ success: false, message: 'Profile not found' });
    return;
  }
  res.json({ success: true, data: profile });
};

// ─── Employer Profile ─────────────────────────────────────────────────────────

// GET /api/profiles/employer
export const getEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [profile] = await db
    .select()
    .from(employerProfiles)
    .where(eq(employerProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ success: false, message: 'Profile not found. Please create one.' });
    return;
  }
  res.json({ success: true, data: profile });
};

// PUT /api/profiles/employer
export const upsertEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { isNew, data } = await upsertProfile(employerProfiles, userId, req.body);

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Profile created' : 'Profile updated',
    data,
  });
};

// GET /api/profiles/employer/:userId  (public view — for job seekers)
export const getEmployerProfileById = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['userId'] as string;
  const [profile] = await db
    .select()
    .from(employerProfiles)
    .where(eq(employerProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ success: false, message: 'Profile not found' });
    return;
  }
  res.json({ success: true, data: profile });
};

// ─── Business Promoter Profile ────────────────────────────────────────────────

// GET /api/profiles/business-promoter
export const getBusinessPromoterProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [profile] = await db
    .select()
    .from(businessPromoterProfiles)
    .where(eq(businessPromoterProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ success: false, message: 'Profile not found. Please create one.' });
    return;
  }
  res.json({ success: true, data: profile });
};

// PUT /api/profiles/business-promoter
export const upsertBusinessPromoterProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { isNew, data } = await upsertProfile(businessPromoterProfiles, userId, req.body);

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Profile created' : 'Profile updated',
    data,
  });
};
