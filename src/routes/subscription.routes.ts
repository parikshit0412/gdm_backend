import { Router } from 'express';
import {
  createSubscription,
  getMySubscriptions,
  getAllSubscriptions,
  expireSubscription,
} from '../controllers/subscription.controller';
import { authenticate, requireRole, ROLES } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { subscriptionSchema } from '../validators/schemas';

const router = Router();

router.post('/', authenticate, validate(subscriptionSchema), createSubscription);
router.get('/my', authenticate, getMySubscriptions);

// Admin only
router.get('/', authenticate, requireRole(ROLES.SUPER_USER), getAllSubscriptions);
router.patch('/:id/expire', authenticate, requireRole(ROLES.SUPER_USER), expireSubscription);

export default router;
