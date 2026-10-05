export type Role = 'DONOR' | 'RECEIVER' | 'ADMIN';

export type DonationStatus = 'AVAILABLE' | 'CLAIMED' | 'PICKED_UP' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgName?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface Donation {
  id: string;
  title: string;
  description?: string | null;
  foodType: string;
  quantity: string;
  servesApprox?: number | null;
  expiryTime: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl?: string | null;
  status: DonationStatus;
  createdAt: string;
  donor: { id: string; name: string; orgName?: string | null; phone?: string | null };
  distanceKm?: number;
}

export interface Claim {
  id: string;
  donationId: string;
  claimedAt: string;
  pickedUpAt?: string | null;
  pickupCode?: string | null;
  donation: Donation;
}

export interface Milestone {
  id: string;
  name: string;
  targetMeals: number;
  unlocked: boolean;
  icon: string;
}

export interface ImpactStats {
  user: {
    name: string;
    role: Role;
    memberSince: string;
  };
  rescuesCount: number;
  totalMeals: number;
  rescuedWeightKg: number;
  co2KgSaved: number;
  waterLitersSaved: number;
  moneySavedUsd: number;
  treesEquivalent: number;
  carKmAvoided: number;
  categoryBreakdown: Record<string, number>;
  milestones: Milestone[];
  recentRescues: Array<{
    id: string;
    title: string;
    foodType: string;
    quantity: string;
    servesApprox?: number | null;
    updatedAt: string;
  }>;
}

export interface GlobalImpactStats {
  totalRescues: number;
  totalMeals: number;
  rescuedWeightKg: number;
  co2KgSaved: number;
  waterLitersSaved: number;
  totalDonors: number;
  totalReceivers: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
