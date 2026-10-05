import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

/** GET /api/notifications — returns the 30 most recent notifications for the logged-in user */
export async function getNotifications(req: AuthRequest, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(notifications);
}

/** PATCH /api/notifications/:id/read — marks a single notification as read (scoped to caller) */
export async function markRead(req: AuthRequest, res: Response) {
  const { id } = req.params;

  // Verify ownership before updating
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (notification.userId !== req.user!.userId) {
    return res.status(403).json({ error: 'Not your notification' });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  res.json(updated);
}

/** PATCH /api/notifications/read-all — marks ALL of the caller's notifications as read */
export async function markAllRead(req: AuthRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });
  res.json({ success: true });
}
