import { Router } from 'express';
import { getMyImpact, getGlobalImpact } from '../controllers/impact.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/mine', requireAuth, getMyImpact);
router.get('/global', getGlobalImpact);

export default router;
