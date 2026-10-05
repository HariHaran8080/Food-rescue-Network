import { Router } from 'express';
import { claimDonation, markPickedUp, getMyClaims, verifyPickup } from '../controllers/claim.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/mine', requireAuth, requireRole('RECEIVER'), getMyClaims);
router.post('/verify-pickup', requireAuth, requireRole('DONOR'), verifyPickup);
router.post('/:donationId', requireAuth, requireRole('RECEIVER'), claimDonation);
router.patch('/:donationId/picked-up', requireAuth, requireRole('RECEIVER'), markPickedUp);

export default router;
