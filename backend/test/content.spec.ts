import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  api,
  createApprovedQuestions,
  createCurriculum,
  createTestApp,
  createUser,
} from './helpers';
import type { Curriculum, TestUser } from './helpers';

describe('Curriculum and content packs', () => {
  let app: NestExpressApplication;
  let admin: TestUser;
  let learner: TestUser;
  let curriculum: Curriculum;
  const as = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });

  beforeAll(async () => {
    app = await createTestApp();
    admin = await createUser('ADMIN');
    learner = await createUser('LEARNER');
    curriculum = await createCurriculum(3);
    await createApprovedQuestions(curriculum, admin.id, 3);
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves exams, subjects and objectives publicly with filters', async () => {
    const exams = await api(app).get('/v1/exams');
    expect(exams.status).toBe(200);
    expect(exams.body.data.map((e: { id: string }) => e.id)).toContain(curriculum.examId);
    const subjects = await api(app).get(`/v1/subjects?examId=${curriculum.examId}`);
    expect(subjects.body.data).toEqual([expect.objectContaining({ id: curriculum.subjectId })]);
    const objectives = await api(app).get(`/v1/objectives?subjectId=${curriculum.subjectId}`);
    expect(objectives.body.data).toHaveLength(3);
    const bad = await api(app).get('/v1/objectives?subjectId=nope');
    expect(bad.status).toBe(400);
  });

  it('lets only admins create and publish packs', async () => {
    const denied = await api(app)
      .post('/v1/content-packs')
      .set(as(learner))
      .send({ subjectId: curriculum.subjectId, name: 'Maths v1', version: 1 });
    expect(denied.status).toBe(403);
  });

  it('hides draft packs and serves published manifests with approved questions', async () => {
    const created = await api(app)
      .post('/v1/content-packs')
      .set(as(admin))
      .send({ subjectId: curriculum.subjectId, name: 'Maths v1', version: 1 });
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;

    const draft = await api(app).get(`/v1/content-packs/${id}/manifest`).set(as(learner));
    expect(draft.status).toBe(404);

    const published = await api(app).post(`/v1/content-packs/${id}/publish`).set(as(admin));
    expect(published.body.data).toMatchObject({ status: 'PUBLISHED', questionCount: 3 });

    const list = await api(app)
      .get(`/v1/content-packs?subjectId=${curriculum.subjectId}`)
      .set(as(learner));
    expect(list.body.data).toEqual([expect.objectContaining({ id, version: 1 })]);

    const manifest = await api(app).get(`/v1/content-packs/${id}/manifest`).set(as(learner));
    expect(manifest.body.data.questions).toHaveLength(3);
    expect(manifest.body.data.objectives).toHaveLength(3);
  });

  it('returns 409 for a duplicate pack version', async () => {
    const body = { subjectId: curriculum.subjectId, name: 'Maths dup', version: 7 };
    await api(app).post('/v1/content-packs').set(as(admin)).send(body);
    const dup = await api(app).post('/v1/content-packs').set(as(admin)).send(body);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');
  });
});
