import cron from 'node-cron';
import { prisma } from '../config/db';
import { getIO } from '../sockets';

// Runs every 5 minutes: flips any AVAILABLE donation past its expiry time to EXPIRED.
// Keeps listings honest and prevents receivers from claiming food that's no longer safe.
export function startExpiryJob() {
  cron.schedule('*/5 * * * *', async () => {
    const now = new Date();
    const expired = await prisma.donation.updateMany({
      where: { status: 'AVAILABLE', expiryTime: { lt: now } },
      data: { status: 'EXPIRED' },
    });

    if (expired.count > 0) {
      console.log(`[expiry-job] Marked ${expired.count} donation(s) as EXPIRED`);
      getIO()?.emit('donations:expired', { count: expired.count });
    }
  });
}
