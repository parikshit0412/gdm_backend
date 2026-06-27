import { Router } from 'express';
import {
  getAllUsers,
  assignRole,
  removeRole,
  getAllConfigs,
  updateConfig,
} from '../controllers/admin.controller';
import {
  getAllPromotions,
  updatePromotionStatus,
} from '../controllers/promotion.controller';
import { authenticate, requireRole, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  assignRoleSchema,
  updateConfigSchema,
  updatePromotionStatusSchema,
} from '../validators/schemas';

const router = Router();

// All admin routes require SUPER_USER
router.use(authenticate, requireRole(ROLES.SUPER_USER));

// Users
router.get('/users', getAllUsers);
router.post('/users/assign-role', validate(assignRoleSchema), assignRole);
router.delete('/users/:userId/roles/:roleId', removeRole);

// Promotions
router.get('/promotions', getAllPromotions);
router.patch('/promotions/:id/status', validate(updatePromotionStatusSchema), updatePromotionStatus);

// Global Config
router.get('/config', getAllConfigs);
router.patch('/config/:key', validate(updateConfigSchema), updateConfig);

export default router;
