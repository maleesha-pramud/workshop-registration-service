import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { email } from '../../lib/validators.js';
import * as authService from './auth.service.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many sign-in attempts. Try again in a few minutes.' },
  },
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', loginLimiter, validate({ body: loginSchema }), async (req, res) => {
  res.json({ data: await authService.login(req.body) });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ data: authService.toSessionUser(req.user) });
});

export default router;
