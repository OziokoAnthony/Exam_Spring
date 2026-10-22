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

describe('Teacher cohorts, parent view and reports', () => {
  let app: NestExpressApplication;
  let teacher: TestUser;
  let learner: TestUser;
  let parent: TestUser;
  let curriculum: Curriculum;
  let questions: SeededQuestion[];
  let cohortId = '';
  let joinCode = '';
  const as = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });

  beforeAll(async () => {
    app = await createTestApp();
    teacher = await createUser('TEACHER');
    learner = await createUser('LEARNER');
    parent = await createUser('PARENT');
    const admin = await createUser('ADMIN');
    curriculum = await createCurriculum(2);
    questions = await createApprovedQuestions(curriculum, admin.id, 2);
    await prisma.guardianLink.create({
      data: {
        guardianId: parent.id,
        learnerId: learner.id,
        relationship: 'MOTHER',
        status: 'ACTIVE',
      },
    });
    const started = await api(app)
      .post('/v1/attempts/diagnostic')
      .set(as(learner))
      .send({ subjectId: curriculum.subjectId });
    await api(app)
      .post(`/v1/attempts/${started.body.data.attemptId}/submit`)
      .set(as(learner))
      .send({ answers: questions.map((q) => ({ questionVersionId: q.versionId, response: 'A' })) });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets teachers, not learners, create cohorts', async () => {
    const denied = await api(app)
      .post('/v1/teacher/cohorts')
      .set(as(learner))
      .send({ name: 'SS3 A', examId: curriculum.examId });
    expect(denied.status).toBe(403);
    const res = await api(app)
      .post('/v1/teacher/cohorts')
      .set(as(teacher))
      .send({ name: 'SS3 A', examId: curriculum.examId });
    expect(res.status).toBe(201);
    cohortId = res.body.data.id;
    joinCode = res.body.data.joinCode;
    const list = await api(app).get('/v1/teacher/cohorts').set(as(teacher));
    expect(list.body.data.map((c: { id: string }) => c.id)).toContain(cohortId);
  });

  it('lets only learners join, idempotently', async () => {
    const asParent = await api(app)
      .post('/v1/teacher/cohorts/join')
      .set(as(parent))
      .send({ joinCode });
    expect(asParent.status).toBe(403);
    for (let i = 0; i < 2; i += 1) {
      const res = await api(app)
        .post('/v1/teacher/cohorts/join')
        .set(as(learner))
        .send({ joinCode: joinCode.toLowerCase() });
      expect(res.status).toBe(201);
    }
    expect(await prisma.cohortMember.count({ where: { cohortId } })).toBe(1);
  });

  it('summarises only the owning teacher’s cohort', async () => {
    const own = await api(app).get(`/v1/teacher/cohorts/${cohortId}/summary`).set(as(teacher));
    expect(own.status).toBe(200);
    expect(own.body.data.members[0]).toMatchObject({
      learnerId: learner.id,
      fullName: 'Test LEARNER',
    });
    expect(own.body.data.members[0].averageMastery).toBeGreaterThan(0.5);
    expect(own.body.data.cells).toHaveLength(2);
    expect(own.body.data.objectives).toHaveLength(2);
    const otherTeacher = await createUser('TEACHER');
    const foreign = await api(app)
      .get(`/v1/teacher/cohorts/${cohortId}/summary`)
      .set(as(otherTeacher));
    expect(foreign.status).toBe(404);
  });

  it('creates assignments only for real objectives', async () => {
    const ok = await api(app)
      .post(`/v1/teacher/cohorts/${cohortId}/assignments`)
      .set(as(teacher))
      .send({ title: 'Week 1', objectiveIds: curriculum.objectiveIds });
    expect(ok.status).toBe(201);
    const summary = await api(app).get(`/v1/teacher/cohorts/${cohortId}/summary`).set(as(teacher));
    expect(summary.body.data.assignments[0]).toMatchObject({
      title: 'Week 1',
      completedCount: 0,
      memberCount: 1,
    });
    const bad = await api(app)
      .post(`/v1/teacher/cohorts/${cohortId}/assignments`)
      .set(as(teacher))
      .send({ title: 'Bogus', objectiveIds: [randomUUID()] });
    expect(bad.status).toBe(404);
  });

  it('reports cohort progress to the teacher only', async () => {
    const res = await api(app).get(`/v1/reports/teacher/cohorts/${cohortId}`).set(as(teacher));
    expect(res.body.data.members[0]).toMatchObject({
      learnerId: learner.id,
      attemptsCount: 1,
      avgScorePct: 100,
    });
    const denied = await api(app).get(`/v1/reports/teacher/cohorts/${cohortId}`).set(as(learner));
    expect(denied.status).toBe(403);
  });

  it('shows a parent only their linked children', async () => {
    const children = await api(app).get('/v1/parent/children').set(as(parent));
    expect(children.body.data).toEqual([expect.objectContaining({ id: learner.id })]);
    const summary = await api(app).get(`/v1/parent/children/${learner.id}/summary`).set(as(parent));
    expect(summary.body.data.last7DaysAnswers).toBe(2);
    expect(summary.body.data.streakDays).toBe(1);
    expect(summary.body.data.mastery).toEqual([
      expect.objectContaining({ subjectId: curriculum.subjectId, objectives: 2 }),
    ]);
    expect(JSON.stringify(summary.body.data)).not.toMatch(/response|answerKey/);
    const report = await api(app).get(`/v1/reports/parent/children/${learner.id}`).set(as(parent));
    expect(report.status).toBe(200);
    const stranger = await createUser('PARENT');
    const denied = await api(app)
      .get(`/v1/parent/children/${learner.id}/summary`)
      .set(as(stranger));
    expect(denied.status).toBe(403);
    const deniedReport = await api(app)
      .get(`/v1/reports/parent/children/${learner.id}`)
      .set(as(stranger));
    expect(deniedReport.status).toBe(403);
  });

  it('gives a learner their own report', async () => {
    const res = await api(app).get('/v1/reports/learner').set(as(learner));
    expect(res.body.data).toMatchObject({
      attemptsCount: 1,
      avgScorePct: 100,
      last7DaysAnswers: 2,
    });
  });
});
