import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../sockets';

export async function claimDonation(req: AuthRequest, res: Response) {
  const donationId = req.params.donationId;
  if (!donationId) {
    return res.status(400).json({ error: 'Donation ID is required' });
  }

  // Use a transaction so two receivers can't claim the same donation at once
  // Configured with generous timeout to avoid P2028 on remote serverless databases (e.g. Neon)
  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const donation = await tx.donation.findUnique({ where: { id: donationId } });
      if (!donation) throw { status: 404, message: 'Donation not found' };

      // Business logic: Cannot claim your own donation
      if (donation.donorId === req.user!.userId) {
        throw { status: 400, message: 'You cannot claim your own donation' };
      }

      // Business logic: Status check
      if (donation.status !== 'AVAILABLE') {
        throw { status: 409, message: 'Donation is no longer available' };
      }

      // Food safety check: Prevent claiming expired food even if cron job hasn't run yet
      if (new Date(donation.expiryTime).getTime() <= Date.now()) {
        await tx.donation.update({
          where: { id: donationId },
          data: { status: 'EXPIRED' },
        });
        throw { status: 410, message: 'This donation has expired and can no longer be claimed' };
      }

      const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

      const claim = await tx.claim.create({
        data: { donationId, receiverId: req.user!.userId, pickupCode },
      });

      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: { status: 'CLAIMED' },
        include: { donor: { select: { id: true, name: true, orgName: true, phone: true } } },
      });

      return { claim, donation: updatedDonation };
    },
    {
      maxWait: 10000, // wait up to 10s for DB connection
      timeout: 25000, // allow up to 25s for multi-step transaction across remote cloud latency
    }
  );

  // Create notification asynchronously outside the interactive transaction lock
  prisma.notification.create({
    data: {
      userId: result.donation.donorId,
      title: 'Donation Claimed',
      message: `Your donation "${result.donation.title}" has been claimed and is awaiting pickup.`,
    },
  }).catch((err) => console.error('Failed to create claim notification:', err));

  getIO()?.emit('donation:claimed', { id: result.donation.id, status: result.donation.status });
  getIO()?.to(`user:${result.donation.donorId}`).emit('notification:new', {
    title: 'Donation Claimed',
    message: `Your donation "${result.donation.title}" has been claimed.`,
  });

  res.status(201).json(result);
}

export async function markPickedUp(req: AuthRequest, res: Response) {
  const donationId = req.params.donationId;
  if (!donationId) {
    return res.status(400).json({ error: 'Donation ID is required' });
  }

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const claim = await tx.claim.findUnique({
        where: { donationId },
        include: { donation: true },
      });

      if (!claim) throw { status: 404, message: 'Claim not found' };
      if (claim.receiverId !== req.user!.userId) {
        throw { status: 403, message: 'Only the receiver who claimed this can mark it picked up' };
      }

      // Business logic: Can only mark as picked up if currently CLAIMED
      if (claim.donation.status !== 'CLAIMED') {
        throw { status: 400, message: `Cannot mark donation as picked up when status is ${claim.donation.status.toLowerCase()}` };
      }

      const updatedClaim = await tx.claim.update({
        where: { id: claim.id },
        data: { pickedUpAt: new Date() },
      });

      await tx.donation.update({
        where: { id: claim.donationId },
        data: { status: 'PICKED_UP' },
      });

      return { updatedClaim, donationId: claim.donationId };
    },
    {
      maxWait: 10000,
      timeout: 25000,
    }
  );

  getIO()?.emit('donation:pickedUp', { id: result.donationId });
  res.json(result.updatedClaim);
}

export async function verifyPickup(req: AuthRequest, res: Response) {
  const { code, donationId } = req.body;
  if (!code && !donationId) {
    return res.status(400).json({ error: 'Pickup code or Donation ID is required' });
  }

  const cleanCode = code ? String(code).trim().replace(/\s|-/g, '') : null;

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const whereClause: Prisma.ClaimWhereInput = {
        donation: {
          donorId: req.user!.userId,
          status: 'CLAIMED',
        },
      };

      if (donationId) {
        whereClause.donationId = donationId;
      }
      if (cleanCode) {
        whereClause.pickupCode = cleanCode;
      }

      const claim = await tx.claim.findFirst({
        where: whereClause,
        include: {
          donation: true,
          receiver: { select: { id: true, name: true, orgName: true, phone: true } },
        },
      });

      if (!claim) {
        throw { status: 404, message: 'Invalid pickup code or donation not found. Please check with receiver.' };
      }

      if (claim.donation.status !== 'CLAIMED') {
        throw { status: 400, message: `Donation is already marked as ${claim.donation.status.toLowerCase()}` };
      }

      const updatedClaim = await tx.claim.update({
        where: { id: claim.id },
        data: { pickedUpAt: new Date() },
      });

      const updatedDonation = await tx.donation.update({
        where: { id: claim.donationId },
        data: { status: 'PICKED_UP' },
        include: { donor: { select: { id: true, name: true, orgName: true } } },
      });

      return { claim: updatedClaim, donation: updatedDonation, receiver: claim.receiver };
    },
    {
      maxWait: 10000,
      timeout: 25000,
    }
  );

  // Dispatch persistent notifications asynchronously outside the critical transaction
  Promise.allSettled([
    prisma.notification.create({
      data: {
        userId: result.claim.receiverId,
        title: 'Food Handoff Confirmed! 🎉',
        message: `Your pickup for "${result.donation.title}" was verified and completed. Thank you for rescuing food!`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: req.user!.userId,
        title: 'Pickup Verified ✅',
        message: `Successfully verified and handed over "${result.donation.title}" to ${result.receiver.orgName || result.receiver.name}.`,
      },
    }),
  ]).catch((err) => console.error('Failed to create pickup notifications:', err));

  getIO()?.emit('donation:pickedUp', { id: result.donation.id });
  getIO()?.to(`user:${result.claim.receiverId}`).emit('notification:new', {
    title: 'Food Handoff Confirmed! 🎉',
    message: `Your pickup for "${result.donation.title}" was verified and completed.`,
  });

  res.json({
    message: 'Pickup successfully verified!',
    claim: result.claim,
    donation: result.donation,
    receiver: result.receiver,
  });
}

export async function getMyClaims(req: AuthRequest, res: Response) {
  const claims = await prisma.claim.findMany({
    where: { receiverId: req.user!.userId },
    include: {
      donation: { include: { donor: { select: { id: true, name: true, orgName: true, phone: true, address: true } } } },
    },
    orderBy: { claimedAt: 'desc' },
    take: 50,
  });

  // Assign pickup code if null for backwards compatibility
  for (const claim of claims) {
    if (!claim.pickupCode && !claim.pickedUpAt) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.claim.update({ where: { id: claim.id }, data: { pickupCode: code } });
      claim.pickupCode = code;
    }
  }

  res.json(claims);
}
