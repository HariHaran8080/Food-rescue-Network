import { Router } from 'express';
import {
  createDonation,
  listDonations,
  getMyDonations,
  getDonation,
  cancelDonation,
} from '../controllers/donation.controller';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';
import { donationCreationLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', listDonations); // public - anyone can browse available donations
router.get('/mine', requireAuth, requireRole('DONOR'), getMyDonations);
router.get('/:id', optionalAuth, getDonation);
router.post('/', requireAuth, requireRole('DONOR'), donationCreationLimiter, createDonation);
router.patch('/:id/cancel', requireAuth, requireRole('DONOR'), cancelDonation);

export default router;
