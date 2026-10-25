import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password';

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (
    !email ||
    !password ||
    password.length < 12 ||
    password.startsWith('replace-with-')
  ) {
    throw new Error(
      'Set OWNER_EMAIL and a strong OWNER_PASSWORD (12+ characters) in apps/api/.env',
    );
  }
  const prisma = new PrismaClient();
  try {
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        create: { email, passwordHash },
        update: { passwordHash },
      });
      await tx.ownerSession.deleteMany({ where: { userId: user.id } });
    });
    process.stdout.write(`Owner ready: ${email}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
