import { PrismaClient } from '@prisma/client';

// Single shared instance; Prisma connects lazily on first query.
export const prisma = new PrismaClient();

export { PrismaClient, Prisma } from '@prisma/client';
