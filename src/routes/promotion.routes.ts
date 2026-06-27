import { Router } from 'express';
import {
  createPromotion,
  getMyPromotions,
  getActivePromotions,
} from '../controllers/promotion.controller';
import { authenticate, requireRole, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPromotionSchema } from '../validators/schemas';

const router = Router();

// Public — active promotions feed
router.get('/active', getActivePromotions);

// Authenticated — business_promoter submits
router.post(
  '/',
  authenticate,
  requireRole(ROLES.BUSINESS_PROMOTER, ROLES.SUPER_USER),
  validate(createPromotionSchema),
  createPromotion
);

router.get('/my', authenticate, requireRole(ROLES.BUSINESS_PROMOTER, ROLES.SUPER_USER), getMyPromotions);

export default router;
