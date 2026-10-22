import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { api, createCurriculum, createTestApp, createUser, prisma } from './helpers';
import type { Curriculum, TestUser } from './helpers';

function questionBody(curriculum: Curriculum, overrides: Record<string, unknown> = {}) {
  return {
    subjectId: curriculum.subjectId,
    difficulty: 3,
    body: 'What is 2 + 2?',
    options: [
      { key: 'A', text: '3' },
      { key: 'B', text: '4' },
      { key: 'C', text: '5' },
      { key: 'D', text: '6' },
    ],
    answerKey: 'B',
    explanation: 'Two plus two is four.',
    objectiveIds: [curriculum.objectiveIds[0]],
    provenance: { source: 'founder-written', license: 'internal' },
    ...overrides,
  };
}

describe('Question bank (admin)', () => {
  let app: NestExpressApplication;
  let admin: TestUser;
  let learner: TestUser;
  let curriculum: Curriculum;
  const asAdmin = () => ({ Authorization: `Bearer ${admin.token}` });

  beforeAll(async () => {
    app = await createTestApp();
    admin = await createUser('ADMIN');
    learner = await createUser('LEARNER');
    curriculum = await createCurriculum(2);
  });

  afterAll(async () => {
    await app.close();
  });

  it('is admin only', async () => {
    const res = await api(app)
      .post('/v1/questions')
      .set('Authorization', `Bearer ${learner.token}`)
      .send(questionBody(curriculum));
    expect(res.status).toBe(403);
    const list = await api(app)
      .get('/v1/questions')
      .set('Authorization', `Bearer ${learner.token}`);
    expect(list.status).toBe(403);
  });

  it('creates a DRAFT question with version 1 and provenance', async () => {
    const res = await api(app).post('/v1/questions').set(asAdmin()).send(questionBody(curriculum));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'DRAFT' });
    expect(res.body.data.versions[0]).toMatchObject({
      version: 1,
      provenance: { source: 'founder-written' },
    });
  });

  it('rejects objectives from another subject', async () => {
    const other = await createCurriculum(1);
    const res = await api(app)
      .post('/v1/questions')
      .set(asAdmin())
      .send(questionBody(curriculum, { objectiveIds: other.objectiveIds }));
    expect(res.status).toBe(400);
  });

  it('requires four options and a valid answer key', async () => {
    const res = await api(app)
      .post('/v1/questions')
      .set(asAdmin())
      .send(questionBody(curriculum, { options: [{ key: 'A', text: '1' }], answerKey: 'E' }));
    expect(res.status).toBe(400);
  });

  it('approves, versions back to DRAFT, and rejects', async () => {
    const created = await api(app)
      .post('/v1/questions')
      .set(asAdmin())
      .send(questionBody(curriculum));
    const id = created.body.data.id as string;
    const approved = await api(app).post(`/v1/questions/${id}/approve`).set(asAdmin());
    expect(approved.body.data.status).toBe('APPROVED');
    const v1 = await prisma.questionVersion.findFirstOrThrow({
      where: { questionId: id, version: 1 },
    });
    expect(v1.approvedBy).toBe(admin.id);

    const v2 = await api(app)
      .post(`/v1/questions/${id}/versions`)
      .set(asAdmin())
      .send(questionBody(curriculum, { body: 'What is 3 + 1?' }));
    expect(v2.body.data.version).toBe(2);
    const afterEdit = await prisma.question.findUniqueOrThrow({ where: { id } });
    expect(afterEdit.status).toBe('DRAFT');
    expect(afterEdit.currentVersionId).toBe(v2.body.data.id);

    const rejected = await api(app).post(`/v1/questions/${id}/reject`).set(asAdmin());
    expect(rejected.body.data.status).toBe('REJECTED');
  });

  it('returns 404 for unknown questions and 400 for malformed ids', async () => {
    const missing = await api(app).post(`/v1/questions/${randomUUID()}/approve`).set(asAdmin());
    expect(missing.status).toBe(404);
    const malformed = await api(app).post('/v1/questions/not-a-uuid/approve').set(asAdmin());
    expect(malformed.status).toBe(400);
  });

  it('bulk imports and reports per-row failures', async () => {
    const other = await createCurriculum(1);
    const res = await api(app)
      .post('/v1/questions/bulk')
      .set(asAdmin())
      .send({
        questions: [
          questionBody(curriculum),
          questionBody(curriculum, { objectiveIds: other.objectiveIds }),
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.createdCount).toBe(1);
    expect(res.body.data.failed).toEqual([expect.objectContaining({ index: 1 })]);
  });

  it('lists questions filtered by status and subject', async () => {
    const res = await api(app)
      .get(`/v1/questions?status=REJECTED&subjectId=${curriculum.subjectId}`)
      .set(asAdmin());
    expect(res.status).toBe(200);
    for (const q of res.body.data as { status: string; subjectId: string }[]) {
      expect(q).toMatchObject({ status: 'REJECTED', subjectId: curriculum.subjectId });
    }
  });
});
