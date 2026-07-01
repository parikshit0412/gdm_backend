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
  const updateData = { ...req.body };

  // Handle file uploads
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  if (files && files['resume'] && files['resume'].length > 0) {
    updateData.resumeUrl = `/uploads/resumes/${files['resume'][0].filename}`;
  }
  
  if (files && files['avatar'] && files['avatar'].length > 0) {
    updateData.avatarUrl = `/uploads/avatars/${files['avatar'][0].filename}`;
  }

  // Parse JSON arrays if they are strings (from form-data)
  if (typeof updateData.experience === 'string') {
    try { updateData.experience = JSON.parse(updateData.experience); } catch (e) {}
  }
  if (typeof updateData.education === 'string') {
    try { updateData.education = JSON.parse(updateData.education); } catch (e) {}
  }

  // Convert numeric fields if they exist in body as strings
  if (updateData.totalExperienceYears) updateData.totalExperienceYears = parseInt(updateData.totalExperienceYears, 10);

  // Fetch current profile to calculate completion properly
  const [currentProfile] = await db.select().from(jobSeekerProfiles).where(eq(jobSeekerProfiles.userId, userId)).limit(1);
  const mergedProfile = { ...(currentProfile || {}), ...updateData };

  // Calculate profile completion percentage
  const completionFields = [
    'fullName', 'phone', 'location', 'avatarUrl', 'totalExperienceYears', 
    'expectedSalary', 'availability', 'summary', 'skills', 
    'resumeUrl', 'linkedinUrl', 'githubUrl', 'portfolioUrl'
  ];
  
  let filledFields = 0;
  completionFields.forEach(field => {
    if (mergedProfile[field as keyof typeof mergedProfile] !== null && 
        mergedProfile[field as keyof typeof mergedProfile] !== undefined && 
        mergedProfile[field as keyof typeof mergedProfile] !== '') {
      filledFields++;
    }
  });

  // Add weight for dynamic arrays
  if (mergedProfile.experience && Array.isArray(mergedProfile.experience) && mergedProfile.experience.length > 0) filledFields++;
  if (mergedProfile.education && Array.isArray(mergedProfile.education) && mergedProfile.education.length > 0) filledFields++;

  // 13 standard fields + 2 arrays = 15 total weight
  updateData.profileCompletion = Math.round((filledFields / 15) * 100);

  const { isNew, data } = await upsertProfile(jobSeekerProfiles, userId, updateData);

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
  const updateData = { ...req.body };

  // Handle file uploads
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (files && files['logo'] && files['logo'].length > 0) {
    updateData.logoUrl = `/uploads/avatars/${files['logo'][0].filename}`;
  }

  if (updateData.foundedYear) updateData.foundedYear = parseInt(updateData.foundedYear, 10);

  // Fetch current profile to calculate completion properly
  const [currentProfile] = await db.select().from(employerProfiles).where(eq(employerProfiles.userId, userId)).limit(1);
  const mergedProfile = { ...(currentProfile || {}), ...updateData };

  // Calculate profile completion percentage
  const completionFields = [
    'companyName', 'logoUrl', 'industry', 'companySize', 'foundedYear', 
    'about', 'headquarters', 'websiteUrl', 'linkedinUrl', 'twitterUrl', 
    'hrName', 'hrEmail', 'hrPhone'
  ];
  
  let filledFields = 0;
  completionFields.forEach(field => {
    if (mergedProfile[field as keyof typeof mergedProfile] !== null && 
        mergedProfile[field as keyof typeof mergedProfile] !== undefined && 
        mergedProfile[field as keyof typeof mergedProfile] !== '') {
      filledFields++;
    }
  });

  updateData.profileCompletion = Math.round((filledFields / completionFields.length) * 100);

  const { isNew, data } = await upsertProfile(employerProfiles, userId, updateData);

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
  const updateData = { ...req.body };

  // Handle file uploads
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (files && files['logo'] && files['logo'].length > 0) {
    updateData.logoUrl = `/uploads/avatars/${files['logo'][0].filename}`;
  }

  // Fetch current profile to calculate completion properly
  const [currentProfile] = await db.select().from(businessPromoterProfiles).where(eq(businessPromoterProfiles.userId, userId)).limit(1);
  const mergedProfile = { ...(currentProfile || {}), ...updateData };

  // Calculate profile completion percentage
  const completionFields = [
    'businessName', 'businessCategory', 'about', 'logoUrl', 'contactPhone', 
    'contactEmail', 'address', 'websiteUrl', 'linkedinUrl', 'instagramUrl', 
    'facebookUrl', 'gstNumber'
  ];
  
  let filledFields = 0;
  completionFields.forEach(field => {
    if (mergedProfile[field as keyof typeof mergedProfile] !== null && 
        mergedProfile[field as keyof typeof mergedProfile] !== undefined && 
        mergedProfile[field as keyof typeof mergedProfile] !== '') {
      filledFields++;
    }
  });

  updateData.profileCompletion = Math.round((filledFields / completionFields.length) * 100);

  const { isNew, data } = await upsertProfile(businessPromoterProfiles, userId, updateData);

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Profile created' : 'Profile updated',
    data,
  });
};
