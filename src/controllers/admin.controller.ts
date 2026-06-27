import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { globalConfigs, users, userRoles, roles } from '../db/schema';

// ─── Global Config ─────────────────────────────────────────────────────────────

// GET /api/admin/config
export const getAllConfigs = async (_req: Request, res: Response): Promise<void> => {
  const configs = await db.select().from(globalConfigs);
  res.json({ success: true, data: configs });
};

// PATCH /api/admin/config/:key
export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  const key = req.params['key'] as string;
  const { value } = req.body as { value: string };

  const [updated] = await db
    .update(globalConfigs)
    .set({ value })
    .where(eq(globalConfigs.key, key))
    .returning();

  if (!updated) {
    res.status(404).json({ success: false, message: `Config key '${key}' not found` });
    return;
  }

  res.json({ success: true, message: 'Config updated', data: updated });
};

// ─── User Management ───────────────────────────────────────────────────────────

// GET /api/admin/users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const offset = (page - 1) * limit;

  // Single query with LEFT JOINs to solve the N+1 problem
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      jobApplyCount: users.jobApplyCount,
      jobPostCount: users.jobPostCount,
      createdAt: users.createdAt,
      roleId: userRoles.roleId,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .limit(limit)
    .offset(offset);

  // Group rows by user in memory
  const userMap = new Map<string, any>();
  for (const row of rows) {
    if (!userMap.has(row.id)) {
      userMap.set(row.id, {
        id: row.id,
        email: row.email,
        jobApplyCount: row.jobApplyCount,
        jobPostCount: row.jobPostCount,
        createdAt: row.createdAt,
        roles: [],
      });
    }
    if (row.roleId && row.roleName) {
      userMap.get(row.id).roles.push({
        roleId: row.roleId,
        roleName: row.roleName,
      });
    }
  }

  res.json({ 
    success: true, 
    data: Array.from(userMap.values()),
    meta: { page, limit }
  });
};

// POST /api/admin/users/assign-role
export const assignRole = async (req: Request, res: Response): Promise<void> => {
  const { userId, roleId } = req.body as { userId: string; roleId: number };

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!role) {
    res.status(404).json({ success: false, message: 'Role not found' });
    return;
  }

  await db.insert(userRoles).values({ userId, roleId }).onConflictDoNothing();

  res.json({ success: true, message: `Role '${role.name}' assigned to user` });
};

// DELETE /api/admin/users/:userId/roles/:roleId
export const removeRole = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['userId'] as string;
  const roleId = parseInt(req.params['roleId'] as string, 10);

  await db
    .delete(userRoles)
    .where(
      eq(userRoles.userId, userId)
    );

  res.json({ success: true, message: 'Role removed from user' });
};
