import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import request from 'supertest';

import { prisma } from '@examspring/db';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { loadEnv } from '../src/config/env';

export { prisma };

export type Role = 'LEARNER' | 'PARENT' | 'TEACHER' | 'ADMIN';
export type Status = 'ACTIVE' | 'PENDING_GUARDIAN_CONSENT' | 'SUSPENDED';
export type TestUser = { id: string; email: string; token: string };

const jwt = new JwtService();

export async function resetRateLimits(): Promise<void> {
  const redis = new Redis(loadEnv().REDIS_URL);
  const keys = await redis.keys('rl:*');
  if (keys.length > 0) await redis.del(...keys);
  redis.disconnect();
}

export async function createTestApp(): Promise<NestExpressApplication> {
  await resetRateLimits();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
  configureApp(app);
  await app.init();
  return app;
}

export function api(app: NestExpressApplication) {
  return request(app.getHttpServer());
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

export function signAccessToken(id: string, role: Role, status: Status = 'ACTIVE'): string {
  return jwt.sign(
    { role, status },
    { secret: loadEnv().JWT_ACCESS_SECRET, expiresIn: '15m', subject: id },
  );
}

/** Inserts a user directly, bypassing signup rate limits, and mints an access token. */
export async function createUser(role: Role, status: Status = 'ACTIVE'): Promise<TestUser> {
  const email = uniqueEmail(role.toLowerCase());
  const user = await prisma.user.create({
    data: {
      email,
      role,
      status,
      fullName: `Test ${role}`,
      passwordHash: 'not-a-real-hash',
      isMinor: status === 'PENDING_GUARDIAN_CONSENT',
    },
  });
  return { id: user.id, email, token: signAccessToken(user.id, role, status) };
}

export type Curriculum = { examId: string; subjectId: string; objectiveIds: string[] };

export async function createCurriculum(objectiveCount = 2): Promise<Curriculum> {
  const suffix = randomUUID().slice(0, 8);
  const exam = await prisma.exam.create({ data: { code: `T_${suffix}`, name: `Test ${suffix}` } });
  const subject = await prisma.subject.create({
    data: { code: 'MATH', name: 'Test Maths', examId: exam.id },
  });
  const objectiveIds: string[] = [];
  for (let i = 0; i < objectiveCount; i += 1) {
    const objective = await prisma.objective.create({
      data: { subjectId: subject.id, code: `O${i}`, description: `Objective ${i}`, orderIndex: i },
    });
    objectiveIds.push(objective.id);
  }
  return { examId: exam.id, subjectId: subject.id, objectiveIds };
}

export type SeededQuestion = { questionId: string; versionId: string; answerKey: string };

export async function createApprovedQuestions(
  curriculum: Curriculum,
  authorId: string,
  count: number,
): Promise<SeededQuestion[]> {
  const seeded: SeededQuestion[] = [];
  for (let i = 0; i < count; i += 1) {
    const objectiveId = curriculum.objectiveIds[i % curriculum.objectiveIds.length] ?? '';
    const question = await prisma.question.create({
      data: {
        subjectId: curriculum.subjectId,
        difficulty: 2,
        status: 'APPROVED',
        versions: {
          create: {
            version: 1,
            body: `What is ${i} + 1?`,
            options: [
              { key: 'A', text: String(i + 1) },
              { key: 'B', text: String(i + 2) },
              { key: 'C', text: String(i + 3) },
              { key: 'D', text: String(i + 4) },
            ],
            answerKey: 'A',
            explanation: 'Add one.',
            authoredBy: authorId,
            approvedBy: authorId,
            approvedAt: new Date(),
            provenance: { source: 'test', license: 'internal' },
          },
        },
        objectives: { create: [{ objectiveId, primary: true }] },
      },
      include: { versions: true },
    });
    const version = question.versions[0];
    if (!version) throw new Error('version missing');
    await prisma.question.update({
      where: { id: question.id },
      data: { currentVersionId: version.id },
    });
    seeded.push({ questionId: question.id, versionId: version.id, answerKey: 'A' });
  }
  return seeded;
}

export async function latestOutboxToken(aggregateId: string, eventType: string): Promise<string> {
  const event = await prisma.outboxEvent.findFirst({
    where: { aggregateId, eventType },
    orderBy: { createdAt: 'desc' },
  });
  const payload = event?.payload as { data?: { token?: string } } | undefined;
  const token = payload?.data?.token;
  if (!token) throw new Error(`No ${eventType} token for ${aggregateId}`);
  return token;
}
