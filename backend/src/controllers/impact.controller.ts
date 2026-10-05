import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

function estimateMeals(servesApprox?: number | null, quantity?: string | null): number {
  if (servesApprox && servesApprox > 0) return servesApprox;
  if (!quantity) return 10;

  // Try parsing numbers from quantity like "25 servings" or "10 kg" or "15 portions"
  const match = quantity.match(/(\d+(\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    const lower = quantity.toLowerCase();
    if (lower.includes('kg') || lower.includes('kilo')) {
      return Math.round(val * 2.2); // ~0.45kg per meal
    }
    if (lower.includes('lb') || lower.includes('pound')) {
      return Math.round(val);
    }
    return Math.max(1, Math.round(val));
  }
  return 10;
}

export async function getMyImpact(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, orgName: true, role: true, createdAt: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Get completed donations for this user
  let completedDonations: Array<{
    id: string;
    title: string;
    foodType: string;
    quantity: string;
    servesApprox: number | null;
    status: string;
    updatedAt: Date;
    createdAt: Date;
  }> = [];

  if (user.role === 'DONOR') {
    completedDonations = await prisma.donation.findMany({
      where: {
        donorId: userId,
        status: 'PICKED_UP',
      },
      select: {
        id: true,
        title: true,
        foodType: true,
        quantity: true,
        servesApprox: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  } else {
    const claims = await prisma.claim.findMany({
      where: {
        receiverId: userId,
        pickedUpAt: { not: null },
      },
      include: {
        donation: {
          select: {
            id: true,
            title: true,
            foodType: true,
            quantity: true,
            servesApprox: true,
            status: true,
            updatedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { pickedUpAt: 'desc' },
    });
    completedDonations = claims.map((c) => c.donation);
  }

  // Calculate stats
  let totalMeals = 0;
  const categoryCounts: Record<string, number> = {};

  for (const d of completedDonations) {
    const meals = estimateMeals(d.servesApprox, d.quantity);
    totalMeals += meals;

    const type = d.foodType || 'Other';
    categoryCounts[type] = (categoryCounts[type] || 0) + meals;
  }

  const rescuedWeightKg = Math.round(totalMeals * 0.45 * 10) / 10;
  const co2KgSaved = Math.round(totalMeals * 1.5 * 10) / 10;
  const waterLitersSaved = Math.round(totalMeals * 360);
  const moneySavedUsd = Math.round(totalMeals * 3.8);
  const treesEquivalent = Math.round((co2KgSaved / 21) * 10) / 10;
  const carKmAvoided = Math.round(co2KgSaved * 4.2);

  // Milestones
  const milestones = [
    { id: 'first_step', name: 'First Rescue', targetMeals: 1, unlocked: totalMeals >= 1, icon: '🌱' },
    { id: 'community_sustainer', name: 'Community Sustainer', targetMeals: 25, unlocked: totalMeals >= 25, icon: '🤝' },
    { id: 'century_rescuer', name: 'Century Rescuer', targetMeals: 100, unlocked: totalMeals >= 100, icon: '⭐' },
    { id: 'planet_guardian', name: 'Planet Guardian', targetMeals: 250, unlocked: totalMeals >= 250, icon: '🌍' },
    { id: 'climate_champion', name: 'Climate Champion', targetMeals: 500, unlocked: totalMeals >= 500, icon: '🏆' },
    { id: 'zero_waste_legend', name: 'Zero Waste Legend', targetMeals: 1000, unlocked: totalMeals >= 1000, icon: '👑' },
  ];

  res.json({
    user: {
      name: user.orgName || user.name,
      role: user.role,
      memberSince: user.createdAt,
    },
    rescuesCount: completedDonations.length,
    totalMeals,
    rescuedWeightKg,
    co2KgSaved,
    waterLitersSaved,
    moneySavedUsd,
    treesEquivalent,
    carKmAvoided,
    categoryBreakdown: categoryCounts,
    milestones,
    recentRescues: completedDonations.slice(0, 5),
  });
}

export async function getGlobalImpact(req: AuthRequest, res: Response) {
  const [completedDonations, totalDonors, totalReceivers] = await Promise.all([
    prisma.donation.findMany({
      where: { status: 'PICKED_UP' },
      select: { servesApprox: true, quantity: true, foodType: true },
    }),
    prisma.user.count({ where: { role: 'DONOR' } }),
    prisma.user.count({ where: { role: 'RECEIVER' } }),
  ]);

  let totalMeals = 0;
  for (const d of completedDonations) {
    totalMeals += estimateMeals(d.servesApprox, d.quantity);
  }

  const rescuedWeightKg = Math.round(totalMeals * 0.45);
  const co2KgSaved = Math.round(totalMeals * 1.5);
  const waterLitersSaved = Math.round(totalMeals * 360);

  res.json({
    totalRescues: completedDonations.length,
    totalMeals,
    rescuedWeightKg,
    co2KgSaved,
    waterLitersSaved,
    totalDonors,
    totalReceivers,
  });
}
