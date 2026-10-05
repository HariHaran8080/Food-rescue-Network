import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, getMe);

export default router;
