import { z } from 'zod';

import type { Prisma, PrismaClient } from '@examspring/db';

type CohortInput = {
  id: string;
  name: string;
  joinCode: string;
  members: { learnerId: string }[];
  assignments: {
    id: string;
    title: string;
    objectiveIds: Prisma.JsonValue;
    dueAt: Date | null;
    createdAt: Date;
  }[];
};

type Assignment = {
  id: string;
  title: string;
  objectiveIds: string[];
  dueAt: Date | null;
  createdAt: Date;
};

const ObjectiveIdsSchema = z.array(z.string().uuid()).catch([]);

type Cell = { learnerId: string; objectiveId: string; score: number };

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** Heatmap (learner × objective), per-learner averages and assignment completion (SKILL.md 2.9). */
export async function cohortSummary(prisma: PrismaClient, cohort: CohortInput) {
  const learnerIds = cohort.members.map((m) => m.learnerId);
  const parsedAssignments: Assignment[] = cohort.assignments.map((a) => ({
    ...a,
    objectiveIds: ObjectiveIdsSchema.parse(a.objectiveIds),
  }));
  const [learners, scores] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: learnerIds } },
      select: { id: true, fullName: true },
    }),
    prisma.masteryScore.findMany({
      where: { learnerId: { in: learnerIds } },
      select: { learnerId: true, objectiveId: true, score: true },
    }),
  ]);
  const cells: Cell[] = scores.map((s) => ({
    learnerId: s.learnerId,
    objectiveId: s.objectiveId,
    score: Number(s.score),
  }));
  const objectiveIds = [
    ...new Set([
      ...cells.map((c) => c.objectiveId),
      ...parsedAssignments.flatMap((a) => a.objectiveIds),
    ]),
  ];
  const objectives = await prisma.objective.findMany({
    where: { id: { in: objectiveIds } },
    select: { id: true, code: true, description: true },
    orderBy: { orderIndex: 'asc' },
  });
  const assignments = await Promise.all(
    parsedAssignments.map((a) => assignmentProgress(prisma, a, learnerIds, cells)),
  );
  return {
    cohort: { id: cohort.id, name: cohort.name, joinCode: cohort.joinCode },
    members: learners.map((l) => ({
      learnerId: l.id,
      fullName: l.fullName,
      averageMastery: average(cells.filter((c) => c.learnerId === l.id).map((c) => c.score)),
    })),
    objectives,
    cells,
    assignments,
  };
}

async function assignmentProgress(
  prisma: PrismaClient,
  assignment: Assignment,
  learnerIds: string[],
  cells: Cell[],
) {
  const practised = await prisma.masteryEvent.findMany({
    where: {
      learnerId: { in: learnerIds },
      objectiveId: { in: assignment.objectiveIds },
      createdAt: { gte: assignment.createdAt },
    },
    distinct: ['learnerId'],
    select: { learnerId: true },
  });
  const relevant = cells.filter((c) => assignment.objectiveIds.includes(c.objectiveId));
  return {
    id: assignment.id,
    title: assignment.title,
    dueAt: assignment.dueAt,
    objectiveIds: assignment.objectiveIds,
    completedCount: practised.length,
    memberCount: learnerIds.length,
    averageMastery: average(relevant.map((c) => c.score)),
  };
}
