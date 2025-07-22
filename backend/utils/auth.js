import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  trustedOrigins: ['http://localhost:3000', 'https://erp-mkt-frontend.vercel.app', 'https://leneoficial.com'],
});
