import { Request, Response } from 'express';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { subscriptions, users } from '../db/schema';

/** Calculate expiry date based on tier */
function getExpiresAt(tier: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();
  if (tier === 'daily') now.setDate(now.getDate() + 1);
  else if (tier === 'weekly') now.setDate(now.getDate() + 7);
  else now.setMonth(now.getMonth() + 1);
  return now;
}

// POST /api/subscriptions
export const createSubscription = async (req: Request, res: Response): Promise<void> => {
  const { subscriptionType, tier } = req.body as {
    subscriptionType: string;
    tier: 'daily' | 'weekly' | 'monthly';
  };
  const userId = req.user!.userId;

  // Check for existing active subscription of same type
  const existing = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.subscriptionType, subscriptionType),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({
      success: false,
      message: `An active ${subscriptionType} subscription already exists`,
      data: existing[0],
    });
    return;
  }

  const expiresAt = getExpiresAt(tier);
  const [sub] = await db
    .insert(subscriptions)
    .values({ userId, subscriptionType, tier, status: 'active', expiresAt })
    .returning();

  res.status(201).json({ success: true, message: 'Subscription created', data: sub });
};

// GET /api/subscriptions/my
export const getMySubscriptions = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  res.json({ success: true, data: subs });
};

// GET /api/subscriptions (admin)
export const getAllSubscriptions = async (_req: Request, res: Response): Promise<void> => {
  const subs = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      userEmail: users.email,
      subscriptionType: subscriptions.subscriptionType,
      tier: subscriptions.tier,
      status: subscriptions.status,
      expiresAt: subscriptions.expiresAt,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id));

  res.json({ success: true, data: subs });
};

// PATCH /api/subscriptions/:id/expire (admin — force expire)
export const expireSubscription = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const [updated] = await db
    .update(subscriptions)
    .set({ status: 'expired' })
    .where(eq(subscriptions.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ success: false, message: 'Subscription not found' });
    return;
  }

  res.json({ success: true, message: 'Subscription expired', data: updated });
};
