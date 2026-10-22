import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

// Single shared instance; Prisma connects lazily on first query.
export const prisma = new PrismaClient();

export { PrismaClient, Prisma } from '@prisma/client';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Runs `fn` in a transaction scoped to one tenant for Postgres RLS (ADR 0006).
 * Outside this helper only global rows (tenant_id IS NULL) are visible.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = prisma,
): Promise<T> {
  if (!UUID.test(tenantId)) throw new Error('withTenant requires a tenant uuid');
  return client.$transaction(async (tx) => {
    // Documented raw-SQL exception: Prisma has no API for transaction-local settings.
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}
