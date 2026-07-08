import { Request, Response } from 'express';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { businessPromotions, subscriptions, users } from '../db/schema';

// POST /api/promotions
export const createPromotion = async (req: Request, res: Response): Promise<void> => {
  const {
    subscriptionId,
    businessName,
    businessOwnerName,
    category,
    businessDescription,
    businessContactDetails,
    foundationDate,
    purpose,
    bannerUrl
  } = req.body as {
    subscriptionId?: string;
    businessName: string;
    businessOwnerName?: string;
    category?: string;
    businessDescription?: string;
    businessContactDetails?: string;
    foundationDate?: string;
    purpose?: string;
    bannerUrl?: string;
  };
  const userId = req.user!.userId;

  let finalStatus = 'draft';

  if (subscriptionId) {
    // Verify the subscription belongs to this user, is business_promoter type, and is active
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.userId, userId),
          eq(subscriptions.subscriptionType, 'business_promoter'),
          eq(subscriptions.status, 'active'),
          gt(subscriptions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!sub) {
      res.status(403).json({
        success: false,
        message: 'Valid active business_promoter subscription required',
      });
      return;
    }
    finalStatus = 'pending_approval';
  }

  const [promotion] = await db
    .insert(businessPromotions)
    .values({
      userId,
      subscriptionId: subscriptionId || null,
      businessName,
      businessOwnerName,
      category,
      businessDescription,
      businessContactDetails,
      foundationDate: foundationDate ? new Date(foundationDate) : null,
      purpose,
      bannerUrl: bannerUrl || null,
      status: finalStatus
    })
    .returning();

  res.status(201).json({
    success: true,
    message: finalStatus === 'draft' ? 'Draft promotion created' : 'Promotion submitted for approval',
    data: promotion,
  });
};

// GET /api/promotions/my
export const getMyPromotions = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const promos = await db
    .select()
    .from(businessPromotions)
    .where(eq(businessPromotions.userId, userId));

  res.json({ success: true, data: promos });
};

// GET /api/promotions/active (public — visible to all)
export const getActivePromotions = async (_req: Request, res: Response): Promise<void> => {
  const promos = await db
    .select({
      id: businessPromotions.id,
      businessName: businessPromotions.businessName,
      bannerUrl: businessPromotions.bannerUrl,
      createdAt: businessPromotions.createdAt,
    })
    .from(businessPromotions)
    .where(eq(businessPromotions.status, 'active'));

  res.json({ success: true, data: promos });
};

// GET /api/admin/promotions (admin — all including pending)
export const getAllPromotions = async (_req: Request, res: Response): Promise<void> => {
  const promos = await db
    .select({
      id: businessPromotions.id,
      businessName: businessPromotions.businessName,
      bannerUrl: businessPromotions.bannerUrl,
      status: businessPromotions.status,
      createdAt: businessPromotions.createdAt,
      userId: businessPromotions.userId,
      userEmail: users.email,
    })
    .from(businessPromotions)
    .innerJoin(users, eq(businessPromotions.userId, users.id));

  res.json({ success: true, data: promos });
};

// PATCH /api/admin/promotions/:id/status
export const updatePromotionStatus = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const { status } = req.body as { status: 'active' | 'rejected' };

  const [updated] = await db
    .update(businessPromotions)
    .set({ status })
    .where(eq(businessPromotions.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ success: false, message: 'Promotion not found' });
    return;
  }

  res.json({
    success: true,
    message: `Promotion ${status}`,
    data: updated,
  });
};
