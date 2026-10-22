import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Prisma } from '@examspring/db';

import { createCurriculum, prisma } from './helpers';

/**
 * Superusers bypass RLS, so these tests switch to a non-superuser role inside
 * each transaction — the same position the production app role is in (ADR 0006).
 */
const PROBE_ROLE = 'examspring_rls_probe';

type Tx = Prisma.TransactionClient;

async function asProbe<T>(tenantId: string | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE ${PROBE_ROLE}`);
    if (tenantId) await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

describe('Row-level security on tenant-scoped tables', () => {
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  let globalQuestion = '';
  let questionA = '';

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PROBE_ROLE}') THEN
           CREATE ROLE ${PROBE_ROLE} NOLOGIN NOSUPERUSER NOBYPASSRLS;
         END IF;
       END $$`,
    );
    await prisma.$executeRawUnsafe(
      `GRANT SELECT, INSERT ON questions, cohorts, assignments, tenant_memberships TO ${PROBE_ROLE}`,
    );
    const curriculum = await createCurriculum(1);
    const base = { subjectId: curriculum.subjectId, difficulty: 1 };
    globalQuestion = (await prisma.question.create({ data: base })).id;
    questionA = (await prisma.question.create({ data: { ...base, tenantId: tenantA } })).id;
    await prisma.question.create({ data: { ...base, tenantId: tenantB } });
  });

  afterAll(async () => {
    await prisma.question.updateMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
      data: { deletedAt: new Date() },
    });
  });

  it('shows only global rows when no tenant is set', async () => {
    const ids = await asProbe(null, (tx) =>
      tx.question.findMany({
        where: { id: { in: [globalQuestion, questionA] } },
        select: { id: true },
      }),
    );
    expect(ids.map((q) => q.id)).toEqual([globalQuestion]);
  });

  it("shows a tenant its own rows plus global rows, never another tenant's", async () => {
    const rows = await asProbe(tenantA, (tx) =>
      tx.question.findMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
        select: { tenantId: true },
      }),
    );
    expect(rows.map((r) => r.tenantId)).toEqual([tenantA]);
  });

  it('refuses to write a row for another tenant', async () => {
    const curriculum = await createCurriculum(1);
    await expect(
      asProbe(tenantA, (tx) =>
        tx.question.create({
          data: { subjectId: curriculum.subjectId, difficulty: 1, tenantId: tenantB },
        }),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});
