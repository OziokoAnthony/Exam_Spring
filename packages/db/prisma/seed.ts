import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME;

  if (email === undefined || password === undefined || fullName === undefined) {
    throw new Error('SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, and SEED_ADMIN_NAME are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing !== null) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: 'ADMIN',
      isMinor: false,
    },
  });
}

main()
  .catch((error: unknown) => {
    process.exitCode = 1;
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
