import { Response } from 'express';
import { z } from 'zod';
import { Donation, DonationStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../sockets';

const createDonationSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120, 'Title too long'),
    description: z.string().trim().max(2000, 'Description too long').optional(),
    foodType: z.string().trim().min(1, 'Food type is required').max(50),
    quantity: z.string().trim().min(1, 'Quantity is required').max(100),
    servesApprox: z.number().int().positive().max(50000).optional(),
    expiryTime: z.string().datetime({ message: 'Invalid expiry time format' }),
    pickupWindowStart: z.string().datetime({ message: 'Invalid pickup window start format' }),
    pickupWindowEnd: z.string().datetime({ message: 'Invalid pickup window end format' }),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
    address: z.string().trim().min(3, 'Address must be at least 3 characters').max(300, 'Address too long'),
    imageUrl: z
      .string()
      .url('Invalid image URL format')
      .max(1000)
      .refine((url) => /^https?:\/\//i.test(url), { message: 'Image URL must use http or https protocol' })
      .optional(),
  })
  .refine(
    (data) => new Date(data.expiryTime).getTime() > Date.now(),
    { message: 'Expiry time must be in the future', path: ['expiryTime'] }
  )
  .refine(
    (data) => new Date(data.pickupWindowStart).getTime() < new Date(data.pickupWindowEnd).getTime(),
    { message: 'Pickup window start time must be before end time', path: ['pickupWindowEnd'] }
  )
  .refine(
    (data) => new Date(data.pickupWindowEnd).getTime() <= new Date(data.expiryTime).getTime(),
    { message: 'Pickup window end time cannot be later than expiry time', path: ['pickupWindowEnd'] }
  );

const listQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).default(15).optional(),
  status: z.nativeEnum(DonationStatus).default(DonationStatus.AVAILABLE).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});

// Haversine distance in km between two lat/lng points
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function createDonation(req: AuthRequest, res: Response) {
  const data = createDonationSchema.parse(req.body);

  const donation = await prisma.donation.create({
    data: {
      ...data,
      expiryTime: new Date(data.expiryTime),
      pickupWindowStart: new Date(data.pickupWindowStart),
      pickupWindowEnd: new Date(data.pickupWindowEnd),
      donorId: req.user!.userId,
    },
    include: { donor: { select: { id: true, name: true, orgName: true, phone: true } } },
  });

  // Notify all connected receivers in real time that a new donation is available
  getIO()?.emit('donation:new', donation);

  res.status(201).json(donation);
}

export async function listDonations(req: AuthRequest, res: Response) {
  const query = listQuerySchema.parse(req.query);

  const donations = await prisma.donation.findMany({
    where: {
      status: query.status || DonationStatus.AVAILABLE,
    },
    // Omit donor phone from public browse endpoint to prevent automated scraping
    include: { donor: { select: { id: true, name: true, orgName: true } } },
    orderBy: { expiryTime: 'asc' },
    take: query.limit || 50,
  });

  if (query.lat !== undefined && query.lng !== undefined) {
    const userLat = query.lat;
    const userLng = query.lng;
    const radius = query.radiusKm || 15;

    const withDistance = donations
      .map((d: Donation) => ({ ...d, distanceKm: distanceKm(userLat, userLng, d.latitude, d.longitude) }))
      .filter((d: Donation & { distanceKm: number }) => d.distanceKm <= radius)
      .sort((a: { distanceKm: number }, b: { distanceKm: number }) => a.distanceKm - b.distanceKm);

    return res.json(withDistance);
  }

  res.json(donations);
}

export async function getMyDonations(req: AuthRequest, res: Response) {
  const donations = await prisma.donation.findMany({
    where: { donorId: req.user!.userId },
    include: { claim: { include: { receiver: { select: { id: true, name: true, orgName: true, phone: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(donations);
}

export async function getDonation(req: AuthRequest, res: Response) {
  const donation = await prisma.donation.findUnique({
    where: { id: req.params.id },
    include: {
      donor: { select: { id: true, name: true, orgName: true, phone: true, address: true } },
      claim: { include: { receiver: { select: { id: true, name: true, orgName: true, phone: true } } } },
    },
  });
  if (!donation) return res.status(404).json({ error: 'Donation not found' });

  // PII Protection: If unauthenticated, do not expose donor's direct phone number
  if (!req.user) {
    donation.donor.phone = null;
  }

  res.json(donation);
}

export async function cancelDonation(req: AuthRequest, res: Response) {
  const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
  if (!donation) return res.status(404).json({ error: 'Donation not found' });

  if (donation.donorId !== req.user!.userId) {
    return res.status(403).json({ error: 'You can only cancel your own donations' });
  }

  // Business logic enforcement: Only AVAILABLE donations can be cancelled
  if (donation.status !== DonationStatus.AVAILABLE) {
    return res.status(400).json({
      error: `Cannot cancel a donation that is already ${donation.status.toLowerCase()}`,
    });
  }

  const updated = await prisma.donation.update({
    where: { id: req.params.id },
    data: { status: DonationStatus.CANCELLED },
  });

  getIO()?.emit('donation:cancelled', { id: updated.id });
  res.json(updated);
}
