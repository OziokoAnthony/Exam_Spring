import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME;

  if (email === undefined || password === undefined || fullName === undefined) {
    throw new Error('SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, and SEED_ADMIN_NAME are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);
  const admin =
    existing === null
      ? await prisma.user.create({
          data: { email, passwordHash, fullName, role: 'ADMIN', isMinor: false },
        })
      : existing;

  const exam = await prisma.exam.upsert({
    where: { code: 'WAEC' },
    update: {},
    create: {
      code: 'WAEC',
      name: 'WAEC SSCE',
      description: 'West African Senior School Certificate Exam',
    },
  });

  const version = await prisma.examVersion.upsert({
    where: { examId_versionLabel: { examId: exam.id, versionLabel: '2025' } },
    update: {},
    create: { examId: exam.id, versionLabel: '2025', effectiveFrom: new Date('2025-01-01') },
  });

  const math = await prisma.subject.upsert({
    where: { examId_code: { examId: exam.id, code: 'MATH' } },
    update: {},
    create: { code: 'MATH', name: 'Mathematics', examId: exam.id, examVersionId: version.id },
  });

  const objectives = [
    ['MATH.ALG.01', 'Solve linear equations in one unknown'],
    ['MATH.ALG.02', 'Solve simultaneous linear equations'],
    ['MATH.NUM.01', 'Operations on fractions'],
    ['MATH.NUM.02', 'Indices and radicals'],
    ['MATH.GEO.01', 'Angles and triangles'],
  ];

  for (let i = 0; i < objectives.length; i += 1) {
    const [code, description] = objectives[i]!;
    await prisma.objective.upsert({
      where: { subjectId_code: { subjectId: math.id, code } },
      update: {},
      create: { subjectId: math.id, code, description, orderIndex: i + 1, examWeight: 1.0 },
    });
  }

  const existingQuestions = await prisma.question.count();
  if (existingQuestions === 0) {
    const alg01 = await prisma.objective.findUnique({
      where: { subjectId_code: { subjectId: math.id, code: 'MATH.ALG.01' } },
    });
    for (let i = 1; i <= 15; i += 1) {
      await prisma.question.create({
        data: {
          subjectId: math.id,
          difficulty: (i % 5) + 1,
          status: 'APPROVED',
          versions: {
            create: {
              version: 1,
              body: `Sample Math question ${i}: solve for x.`,
              options: [
                { key: 'A', text: '1' },
                { key: 'B', text: '2' },
                { key: 'C', text: '3' },
                { key: 'D', text: '4' },
              ],
              answerKey: 'B',
              explanation: 'Worked solution goes here.',
              authoredBy: admin.id,
              provenance: { source: 'founder-authored', license: 'owned', exam_year: 2025 },
            },
          },
        },
        include: { versions: true },
      });
    }
    // Wire current version + objectives after creation.
    const questions = await prisma.question.findMany({ include: { versions: true } });
    for (const q of questions) {
      const v = q.versions[0];
      if (v) {
        await prisma.question.update({ where: { id: q.id }, data: { currentVersionId: v.id } });
        if (alg01) {
          await prisma.questionObjective.upsert({
            where: { questionId_objectiveId: { questionId: q.id, objectiveId: alg01.id } },
            update: {},
            create: { questionId: q.id, objectiveId: alg01.id, primary: true },
          });
        }
      }
    }
  }
}

main()
  .catch((error: unknown) => {
    process.exitCode = 1;
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
