import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/db';
import { signToken } from '../utils/jwt';

// Password policy: 8-72 characters, at least 1 uppercase, 1 lowercase, 1 number
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password cannot exceed 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(70, 'Name cannot exceed 70 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(254, 'Email too long'),
  password: passwordSchema,
  role: z.enum(['DONOR', 'RECEIVER']),
  orgName: z.string().trim().max(100).nullish().transform((v) => v || undefined),
  address: z.string().trim().max(255).nullish().transform((v) => v || undefined),
  latitude: z.number().min(-90).max(90).nullish().transform((v) => v ?? undefined),
  longitude: z.number().min(-180).max(180).nullish().transform((v) => v ?? undefined),
  phone: z.string().trim().max(30).nullish().transform((v) => v || undefined),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email format').max(254),
  password: z.string().min(1, 'Password is required').max(72),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const normalizedEmail = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // Cost factor 12 provides high protection against offline GPU cracking
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: normalizedEmail,
      passwordHash,
      role: data.role,
      orgName: data.orgName,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone,
    },
  });

  const token = signToken({ userId: user.id, role: user.role });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    // Constant time or generic response
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ userId: user.id, role: user.role });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function getMe(req: Request & { user?: { userId: string } }, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
}
