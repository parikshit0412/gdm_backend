import { Request, Response } from 'express';
import { eq, and, gt, desc } from 'drizzle-orm';
import { db } from '../db';
import { jobs, subscriptions, users, globalConfigs, employerProfiles, jobApplications, jobSeekerProfiles } from '../db/schema';

const configCache = new Map<string, { value: number; expires: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function getFreeLimit(key: string): Promise<number> {
  const now = Date.now();
  if (configCache.has(key) && configCache.get(key)!.expires > now) {
    return configCache.get(key)!.value;
  }

  const [config] = await db
    .select()
    .from(globalConfigs)
    .where(eq(globalConfigs.key, key))
    .limit(1);
    
  const value = config ? parseInt(config.value, 10) : 3;
  configCache.set(key, { value, expires: now + CACHE_TTL });
  
  return value;
}

// POST /api/jobs
export const createJob = async (req: Request, res: Response): Promise<void> => {
  const { 
    title, description, companyName, location, salaryRange, 
    jobType, workMode, experience, skills, category, education, benefits 
  } = req.body as any;
  const userId = req.user!.userId;

  // Check for active job_poster subscription
  const activeSub = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.subscriptionType, 'job_poster'),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (activeSub.length === 0) {
    // Fall back to free tier limit
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const freeLimit = await getFreeLimit('FREE_JOB_POST_LIMIT');

    if (user.jobPostCount >= freeLimit) {
      res.status(403).json({
        success: false,
        message: `Free job post limit (${freeLimit}) reached. Subscribe to post more jobs.`,
      });
      return;
    }

    // Increment count
    await db
      .update(users)
      .set({ jobPostCount: user.jobPostCount + 1 })
      .where(eq(users.id, userId));
  }

  // Fetch companyName if not provided
  let finalCompanyName = companyName;
  if (!finalCompanyName) {
    const [empProfile] = await db.select().from(employerProfiles).where(eq(employerProfiles.userId, userId)).limit(1);
    if (empProfile && empProfile.companyName) {
      finalCompanyName = empProfile.companyName;
    }
  }

  const [job] = await db
    .insert(jobs)
    .values({ 
      employerId: userId, 
      title, 
      description,
      companyName: finalCompanyName,
      location,
      salaryRange,
      jobType,
      workMode,
      experience,
      skills,
      category,
      education,
      benefits
    })
    .returning();

  res.status(201).json({ success: true, message: 'Job posted', data: job });
};

// PUT /api/jobs/:id
export const updateJob = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;
  
  const { 
    title, description, companyName, location, salaryRange, 
    jobType, workMode, experience, skills, category, education, benefits 
  } = req.body as any;

  // Verify ownership
  const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!existingJob) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }
  
  if (existingJob.employerId !== userId && !req.user!.roles.includes(4)) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  const [job] = await db
    .update(jobs)
    .set({ 
      title, 
      description,
      companyName,
      location,
      salaryRange,
      jobType,
      workMode,
      experience,
      skills,
      category,
      education,
      benefits
    })
    .where(eq(jobs.id, id))
    .returning();

  res.json({ success: true, message: 'Job updated', data: job });
};

// GET /api/jobs
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const allJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      companyName: jobs.companyName,
      location: jobs.location,
      salaryRange: jobs.salaryRange,
      jobType: jobs.jobType,
      workMode: jobs.workMode,
      experience: jobs.experience,
      skills: jobs.skills,
      category: jobs.category,
      education: jobs.education,
      benefits: jobs.benefits,
      isActive: jobs.isActive,
      createdAt: jobs.createdAt,
      employerId: jobs.employerId,
      employerEmail: users.email,
    })
    .from(jobs)
    .innerJoin(users, eq(jobs.employerId, users.id))
    .where(and(eq(jobs.isDeleted, false), eq(jobs.isActive, true)))
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ success: true, data: allJobs, meta: { page, limit } });
};

// GET /api/jobs/:id
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const [job] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      companyName: jobs.companyName,
      location: jobs.location,
      salaryRange: jobs.salaryRange,
      jobType: jobs.jobType,
      workMode: jobs.workMode,
      experience: jobs.experience,
      skills: jobs.skills,
      category: jobs.category,
      education: jobs.education,
      benefits: jobs.benefits,
      isActive: jobs.isActive,
      createdAt: jobs.createdAt,
      employerId: jobs.employerId,
      employerEmail: users.email,
    })
    .from(jobs)
    .innerJoin(users, eq(jobs.employerId, users.id))
    .where(and(eq(jobs.id, id), eq(jobs.isDeleted, false)))
    .limit(1);

  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  res.json({ success: true, data: job });
};

// DELETE /api/jobs/:id
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;
  const userRoles = req.user!.roles;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  // Only owner or super_user can delete
  const isSuperUser = userRoles.includes(4);
  if (job.employerId !== userId && !isSuperUser) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  await db.update(jobs).set({ isDeleted: true }).where(eq(jobs.id, id));
  res.json({ success: true, message: 'Job deleted' });
};

// POST /api/jobs/:id/apply (job seeker applies)
export const applyToJob = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  // Check active subscription or free limit
  const activeSub = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.subscriptionType, 'job_seeker'),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (activeSub.length === 0) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const freeLimit = await getFreeLimit('FREE_JOB_APPLY_LIMIT');

    if (user.jobApplyCount >= freeLimit) {
      res.status(403).json({
        success: false,
        message: `Free job apply limit (${freeLimit}) reached. Subscribe to apply to more jobs.`,
      });
      return;
    }

    await db
      .update(users)
      .set({ jobApplyCount: user.jobApplyCount + 1 })
      .where(eq(users.id, userId));
  }

  const jobId = req.params['id'] as string;

  // Insert application record
  await db.insert(jobApplications).values({
    jobId,
    applicantId: userId,
    status: 'pending',
  });

  res.json({ success: true, message: 'Application submitted successfully' });
};

// GET /api/jobs/employer/me
export const getEmployerJobs = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const employerJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      companyName: jobs.companyName,
      location: jobs.location,
      salaryRange: jobs.salaryRange,
      jobType: jobs.jobType,
      workMode: jobs.workMode,
      experience: jobs.experience,
      skills: jobs.skills,
      category: jobs.category,
      education: jobs.education,
      benefits: jobs.benefits,
      isActive: jobs.isActive,
      createdAt: jobs.createdAt,
      employerId: jobs.employerId,
      employerEmail: users.email,
    })
    .from(jobs)
    .innerJoin(users, eq(jobs.employerId, users.id))
    .where(and(eq(jobs.employerId, userId), eq(jobs.isDeleted, false)))
    .orderBy(desc(jobs.createdAt));

  res.json({ success: true, data: employerJobs });
};

// GET /api/jobs/:id/applicants
export const getJobApplicants = async (req: Request, res: Response): Promise<void> => {
  const jobId = req.params['id'] as string;
  const userId = req.user!.userId;

  // Verify ownership of the job
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }
  if (job.employerId !== userId && !req.user!.roles.includes(4)) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  // Fetch applicants
  const applicants = await db
    .select({
      id: jobApplications.id,
      applicantId: jobApplications.applicantId,
      status: jobApplications.status,
      appliedAt: jobApplications.createdAt,
      firstName: jobSeekerProfiles.firstName,
      lastName: jobSeekerProfiles.lastName,
      email: users.email,
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.applicantId, users.id))
    .leftJoin(jobSeekerProfiles, eq(jobApplications.applicantId, jobSeekerProfiles.userId))
    .where(eq(jobApplications.jobId, jobId))
    .orderBy(desc(jobApplications.createdAt));

  res.json({ success: true, data: applicants });
};

// PATCH /api/jobs/:id/status
export const toggleJobStatus = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    return;
  }

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  if (job.employerId !== userId) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  await db.update(jobs).set({ isActive }).where(eq(jobs.id, id));
  res.json({ success: true, message: 'Job status updated' });
};
