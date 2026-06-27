import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { workExperiences, educations, certifications } from '../db/schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Verify a record belongs to the requesting user before update/delete */
async function ownedOrNotFound<T extends { userId: string; id: string }>(
  table: typeof workExperiences | typeof educations | typeof certifications,
  id: string,
  userId: string,
  res: Response
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(table as typeof workExperiences)
    .where(
      and(
        eq((table as typeof workExperiences).id, id),
        eq((table as typeof workExperiences).userId, userId)
      )
    )
    .limit(1);

  if (!row) {
    res.status(404).json({ success: false, message: 'Record not found or not yours' });
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORK EXPERIENCES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/experiences  — list all for current user
export const listWorkExperiences = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await db
    .select()
    .from(workExperiences)
    .where(eq(workExperiences.userId, userId));

  res.json({ success: true, data: rows });
};

// GET /api/experiences/user/:userId  — public view (recruiter sees candidate history)
export const listWorkExperiencesByUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['userId'] as string;
  const rows = await db
    .select()
    .from(workExperiences)
    .where(eq(workExperiences.userId, userId));

  res.json({ success: true, data: rows });
};

// POST /api/experiences  — add one entry
export const createWorkExperience = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [created] = await db
    .insert(workExperiences)
    .values({ userId, ...req.body })
    .returning();

  res.status(201).json({ success: true, message: 'Work experience added', data: created });
};

// PATCH /api/experiences/:id  — update one entry
export const updateWorkExperience = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;

  const found = await ownedOrNotFound(workExperiences, id, userId, res);
  if (!found) return;

  const [updated] = await db
    .update(workExperiences)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(workExperiences.id, id))
    .returning();

  res.json({ success: true, message: 'Work experience updated', data: updated });
};

// DELETE /api/experiences/:id
export const deleteWorkExperience = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;

  const found = await ownedOrNotFound(workExperiences, id, userId, res);
  if (!found) return;

  await db.delete(workExperiences).where(eq(workExperiences.id, id));
  res.json({ success: true, message: 'Work experience deleted' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// EDUCATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/educations
export const listEducations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await db
    .select()
    .from(educations)
    .where(eq(educations.userId, userId));

  res.json({ success: true, data: rows });
};

// GET /api/educations/user/:userId  — public view
export const listEducationsByUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['userId'] as string;
  const rows = await db
    .select()
    .from(educations)
    .where(eq(educations.userId, userId));

  res.json({ success: true, data: rows });
};

// POST /api/educations
export const createEducation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [created] = await db
    .insert(educations)
    .values({ userId, ...req.body })
    .returning();

  res.status(201).json({ success: true, message: 'Education added', data: created });
};

// PATCH /api/educations/:id
export const updateEducation = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;

  const found = await ownedOrNotFound(educations, id, userId, res);
  if (!found) return;

  const [updated] = await db
    .update(educations)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(educations.id, id))
    .returning();

  res.json({ success: true, message: 'Education updated', data: updated });
};

// DELETE /api/educations/:id
export const deleteEducation = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;

  const found = await ownedOrNotFound(educations, id, userId, res);
  if (!found) return;

  await db.delete(educations).where(eq(educations.id, id));
  res.json({ success: true, message: 'Education deleted' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/certifications
export const listCertifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await db
    .select()
    .from(certifications)
    .where(eq(certifications.userId, userId));

  res.json({ success: true, data: rows });
};

// GET /api/certifications/user/:userId  — public view
export const listCertificationsByUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['userId'] as string;
  const rows = await db
    .select()
    .from(certifications)
    .where(eq(certifications.userId, userId));

  res.json({ success: true, data: rows });
};

// POST /api/certifications
export const createCertification = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [created] = await db
    .insert(certifications)
    .values({ userId, ...req.body })
    .returning();

  res.status(201).json({ success: true, message: 'Certification added', data: created });
};

// PATCH /api/certifications/:id
export const updateCertification = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;

  const found = await ownedOrNotFound(certifications, id, userId, res);
  if (!found) return;

  const [updated] = await db
    .update(certifications)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(certifications.id, id))
    .returning();

  res.json({ success: true, message: 'Certification updated', data: updated });
};

// DELETE /api/certifications/:id
export const deleteCertification = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const userId = req.user!.userId;

  const found = await ownedOrNotFound(certifications, id, userId, res);
  if (!found) return;

  await db.delete(certifications).where(eq(certifications.id, id));
  res.json({ success: true, message: 'Certification deleted' });
};
