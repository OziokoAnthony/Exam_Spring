import type { PrismaClient } from '@examspring/db';

const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_LOOKBACK_DAYS = 60;

export type SubjectMastery = {
  subjectId: string;
  subject: string;
  averageMastery: number;
  objectives: number;
};

/** Consecutive days with at least one answer, ending today or yesterday (UTC days). */
export function studyStreak(answeredAt: Date[], now = new Date()): number {
  const days = new Set(answeredAt.map((d) => Math.floor(d.getTime() / DAY_MS)));
  let day = Math.floor(now.getTime() / DAY_MS);
  if (!days.has(day)) day -= 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}

/**
 * What a guardian sees (SKILL.md 2.8): mastery by subject, streak, last 7 days.
 * Never individual answers.
 */
export async function guardianSummary(prisma: PrismaClient, learnerId: string) {
  const scores = await prisma.masteryScore.findMany({
    where: { learnerId },
    select: { objectiveId: true, score: true },
  });
  const objectives = await prisma.objective.findMany({
    where: { id: { in: scores.map((s) => s.objectiveId) } },
    select: { id: true, subject: { select: { id: true, name: true } } },
  });
  const subjectOf = new Map(objectives.map((o) => [o.id, o.subject]));
  const bySubject = new Map<string, { subject: string; total: number; count: number }>();
  for (const s of scores) {
    const subject = subjectOf.get(s.objectiveId);
    if (!subject) continue;
    const entry = bySubject.get(subject.id) ?? { subject: subject.name, total: 0, count: 0 };
    entry.total += Number(s.score);
    entry.count += 1;
    bySubject.set(subject.id, entry);
  }
  const mastery: SubjectMastery[] = [...bySubject].map(([subjectId, e]) => ({
    subjectId,
    subject: e.subject,
    averageMastery: e.total / e.count,
    objectives: e.count,
  }));
  const since = new Date(Date.now() - STREAK_LOOKBACK_DAYS * DAY_MS);
  const recent = await prisma.attemptItem.findMany({
    where: { answeredAt: { gte: since }, attempt: { learnerId } },
    select: { answeredAt: true },
  });
  const answered = recent.flatMap((r) => (r.answeredAt ? [r.answeredAt] : []));
  const weekAgo = Date.now() - 7 * DAY_MS;
  return {
    mastery,
    streakDays: studyStreak(answered),
    last7DaysAnswers: answered.filter((d) => d.getTime() >= weekAgo).length,
  };
}
