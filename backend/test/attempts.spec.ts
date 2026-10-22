import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  api,
  createApprovedQuestions,
  createCurriculum,
  createTestApp,
  createUser,
  prisma,
} from './helpers';
import type { Curriculum, SeededQuestion, TestUser } from './helpers';

type Served = { id: string; versionId: string; body: string; options: unknown };

describe('Attempts, scoring and mastery', () => {
  let app: NestExpressApplication;
  let curriculum: Curriculum;
  let questions: SeededQuestion[];
  let learner: TestUser;
  let admin: TestUser;

  const auth = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });

  beforeAll(async () => {
    app = await createTestApp();
    admin = await createUser('ADMIN');
    learner = await createUser('LEARNER');
    curriculum = await createCurriculum(2);
    questions = await createApprovedQuestions(curriculum, admin.id, 4);
  });

  afterAll(async () => {
    await app.close();
  });

  async function startDiagnostic(user: TestUser) {
    const res = await api(app)
      .post('/v1/attempts/diagnostic')
      .set(auth(user))
      .send({ subjectId: curriculum.subjectId });
    return res.body.data as { attemptId: string; questions: Served[] };
  }

  it('serves a diagnostic without answer keys', async () => {
    const res = await api(app)
      .post('/v1/attempts/diagnostic')
      .set(auth(learner))
      .send({ subjectId: curriculum.subjectId });
    expect(res.status).toBe(201);
    expect(res.body.data.questions).toHaveLength(4);
    expect(JSON.stringify(res.body.data)).not.toMatch(/answerKey|explanation/);
  });

  it('returns 404 for an unknown subject and 422 when no questions exist', async () => {
    const missing = await api(app)
      .post('/v1/attempts/diagnostic')
      .set(auth(learner))
      .send({ subjectId: randomUUID() });
    expect(missing.status).toBe(404);
    const empty = await createCurriculum(1);
    const none = await api(app)
      .post('/v1/attempts/diagnostic')
      .set(auth(learner))
      .send({ subjectId: empty.subjectId });
    expect(none.status).toBe(422);
  });

  it('scores server-side and ignores duplicate or foreign answers', async () => {
    const started = await startDiagnostic(learner);
    const first = questions[0];
    if (!first) throw new Error('fixture');
    const other = await createCurriculum(1);
    const [foreign] = await createApprovedQuestions(other, admin.id, 1);
    const answers = [
      { questionVersionId: first.versionId, response: 'A' },
      { questionVersionId: first.versionId, response: 'A' },
      { questionVersionId: first.versionId, response: 'A' },
      { questionVersionId: foreign?.versionId, response: 'A' },
    ];
    const res = await api(app)
      .post(`/v1/attempts/${started.attemptId}/submit`)
      .set(auth(learner))
      .send({ answers });
    expect(res.status).toBe(201);
    expect(res.body.data.correctCount).toBe(1);
    expect(Number(res.body.data.scorePct)).toBe(25);
    const items = await prisma.attemptItem.count({ where: { attemptId: started.attemptId } });
    expect(items).toBe(1);
  });

  it('does not score unapproved questions', async () => {
    const started = await startDiagnostic(learner);
    const target = questions[1];
    if (!target) throw new Error('fixture');
    await prisma.question.update({
      where: { id: target.questionId },
      data: { status: 'REJECTED' },
    });
    const res = await api(app)
      .post(`/v1/attempts/${started.attemptId}/submit`)
      .set(auth(learner))
      .send({ answers: [{ questionVersionId: target.versionId, response: 'A' }] });
    expect(res.body.data.correctCount).toBe(0);
    await prisma.question.update({
      where: { id: target.questionId },
      data: { status: 'APPROVED' },
    });
  });

  it('is idempotent on double submit and writes mastery once', async () => {
    const fresh = await createUser('LEARNER');
    const started = await startDiagnostic(fresh);
    const answers = started.questions.map((q) => ({
      questionVersionId: q.versionId,
      response: 'A',
    }));
    const first = await api(app)
      .post(`/v1/attempts/${started.attemptId}/submit`)
      .set(auth(fresh))
      .send({ answers });
    const second = await api(app)
      .post(`/v1/attempts/${started.attemptId}/submit`)
      .set(auth(fresh))
      .send({ answers: [] });
    expect(Number(first.body.data.scorePct)).toBe(100);
    expect(second.body.data.correctCount).toBe(4);
    const events = await prisma.masteryEvent.count({ where: { learnerId: fresh.id } });
    expect(events).toBe(4);
    const mastery = await api(app).get('/v1/attempts/mastery').set(auth(fresh));
    expect(mastery.body.data).toHaveLength(2);
    for (const row of mastery.body.data as { score: string }[]) {
      expect(Number(row.score)).toBeGreaterThan(0.5);
    }
  });

  it("hides another learner's attempt", async () => {
    const started = await startDiagnostic(learner);
    const intruder = await createUser('LEARNER');
    const submit = await api(app)
      .post(`/v1/attempts/${started.attemptId}/submit`)
      .set(auth(intruder))
      .send({ answers: [] });
    expect(submit.status).toBe(404);
    const review = await api(app)
      .get(`/v1/attempts/${started.attemptId}/review`)
      .set(auth(intruder));
    expect(review.status).toBe(404);
  });

  it('reviews a submitted attempt with answer keys and explanations', async () => {
    const started = await startDiagnostic(learner);
    const early = await api(app).get(`/v1/attempts/${started.attemptId}/review`).set(auth(learner));
    expect(early.status).toBe(422);
    const q = started.questions[0];
    await api(app)
      .post(`/v1/attempts/${started.attemptId}/submit`)
      .set(auth(learner))
      .send({ answers: [{ questionVersionId: q?.versionId, response: 'B' }] });
    const res = await api(app).get(`/v1/attempts/${started.attemptId}/review`).set(auth(learner));
    expect(res.status).toBe(200);
    expect(res.body.data.items[0]).toMatchObject({
      response: 'B',
      isCorrect: false,
      answerKey: 'A',
    });
  });

  it('starts a timed CBT and a recommended practice set', async () => {
    const cbt = await api(app)
      .post('/v1/attempts/cbt')
      .set(auth(learner))
      .send({ subjectId: curriculum.subjectId });
    expect(cbt.status).toBe(201);
    expect(cbt.body.data.durationMs).toBe(25 * 60 * 1000);
    const fresh = await createUser('LEARNER');
    const practice = await api(app)
      .post('/v1/attempts/practice')
      .set(auth(fresh))
      .send({ subjectId: curriculum.subjectId });
    expect(practice.status).toBe(201);
    expect(curriculum.objectiveIds).toContain(practice.body.data.objectiveId);
    expect(practice.body.data.questions.length).toBeGreaterThan(0);
  });

  it('syncs offline attempts once per idempotency key and re-scores them', async () => {
    const fresh = await createUser('LEARNER');
    const key = `device-${randomUUID()}`;
    const payload = {
      attempts: [
        {
          idempotencyKey: key,
          subjectId: curriculum.subjectId,
          mode: 'PRACTICE',
          answers: questions.map((q) => ({ questionVersionId: q.versionId, response: 'A' })),
        },
      ],
    };
    const first = await api(app).post('/v1/attempts/sync').set(auth(fresh)).send(payload);
    expect(first.body.data[0]).toMatchObject({ status: 'SYNCED' });
    expect(Number(first.body.data[0].scorePct)).toBe(100);
    const again = await api(app).post('/v1/attempts/sync').set(auth(fresh)).send(payload);
    expect(again.body.data[0].status).toBe('ALREADY_SYNCED');
    const otherLearner = await createUser('LEARNER');
    const sameKey = await api(app).post('/v1/attempts/sync').set(auth(otherLearner)).send(payload);
    expect(sameKey.body.data[0].status).toBe('SYNCED');
  });

  it('validates the sync payload', async () => {
    const res = await api(app)
      .post('/v1/attempts/sync')
      .set(auth(learner))
      .send({ attempts: [{ idempotencyKey: 'x', subjectId: 'nope', mode: 'HACK', answers: [] }] });
    expect(res.status).toBe(400);
  });
});
