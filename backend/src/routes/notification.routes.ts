import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All notification routes require the user to be logged in
router.get('/', requireAuth, getNotifications);
router.patch('/read-all', requireAuth, markAllRead);
router.patch('/:id/read', requireAuth, markRead);

export default router;
