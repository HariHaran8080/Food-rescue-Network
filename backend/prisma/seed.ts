import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const donor = await prisma.user.upsert({
    where: { email: 'donor@greentable.com' },
    update: {},
    create: {
      name: 'Green Table Restaurant',
      email: 'donor@greentable.com',
      passwordHash,
      role: Role.DONOR,
      orgName: 'Green Table Restaurant',
      address: '221 MG Road, Mumbai',
      latitude: 19.076,
      longitude: 72.8777,
      phone: '+91-9000000001',
    },
  });

  const receiver = await prisma.user.upsert({
    where: { email: 'receiver@hopeshelter.org' },
    update: {},
    create: {
      name: 'Hope Shelter',
      email: 'receiver@hopeshelter.org',
      passwordHash,
      role: Role.RECEIVER,
      orgName: 'Hope Shelter',
      address: '45 Dadar West, Mumbai',
      latitude: 19.0176,
      longitude: 72.8562,
      phone: '+91-9000000002',
    },
  });

  await prisma.donation.create({
    data: {
      donorId: donor.id,
      title: 'Surplus Vegetable Biryani',
      description: 'Freshly cooked, from tonight\'s catering event. Still hot, packed in trays.',
      foodType: 'Cooked meals',
      quantity: '25 servings',
      servesApprox: 25,
      expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 4),
      pickupWindowStart: new Date(Date.now() + 1000 * 60 * 30),
      pickupWindowEnd: new Date(Date.now() + 1000 * 60 * 60 * 3),
      latitude: 19.076,
      longitude: 72.8777,
      address: '221 MG Road, Mumbai',
    },
  });

  console.log('Seed complete:', { donor: donor.email, receiver: receiver.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
