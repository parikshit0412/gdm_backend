import { Router } from 'express';
import { register, login, logout, me, googleOAuthCallback } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/schemas';

import passport from 'passport';

const router = Router();

// Standard Email/Password
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3000/login?error=oauth_failed' }), googleOAuthCallback);

export default router;
