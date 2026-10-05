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

  const EXAMS: Array<{ code: string; name: string; description: string; subjects: Array<[string, string]> }> = [
    {
      code: 'FSLC', name: 'FSLC', description: 'First School Leaving Certificate',
      subjects: [['ENG','English Language'],['MATH','Mathematics'],['BST','Basic Science and Technology'],['SST','Social Studies'],['VER','Verbal Reasoning'],['NVR','Non-Verbal Reasoning']],
    },
    {
      code: 'BECE', name: 'BECE', description: 'Basic Education Certificate Examination',
      subjects: [['ENG','English Language'],['MATH','Mathematics'],['BASIC_SCI','Basic Science'],['BASIC_TECH','Basic Technology'],['SST','Social Studies'],['CCA','Cultural and Creative Arts'],['BST','Business Studies'],['AGRIC','Agricultural Science'],['HOME_ECON','Home Economics'],['NG_LANG','One Nigerian Language']],
    },
    {
      code: 'NECO', name: 'NECO', description: 'National Examinations Council',
      subjects: [['ENG','English Language'],['MATH','General Mathematics'],['PHYS','Physics'],['CHEM','Chemistry'],['BIO','Biology'],['ECONS','Economics'],['GOVT','Government'],['LIT','Literature in English'],['CRS','Christian Religious Studies'],['IRS','Islamic Religious Studies'],['GEO','Geography'],['HA','History'],['AGRIC','Agricultural Science'],['COMM','Commerce'],['ACCT','Financial Accounting']],
    },
    {
      code: 'NABTEB', name: 'NABTEB', description: 'National Business and Technical Examinations Board',
      subjects: [['ENG','English Language'],['MATH','General Mathematics'],['PHYS','Physics'],['CHEM','Chemistry'],['BIO','Biology'],['ECONS','Economics'],['GOVT','Government'],['LIT','Literature in English'],['CRS','Christian Religious Studies'],['IRS','Islamic Religious Studies'],['GEO','Geography'],['HA','History'],['AGRIC','Agricultural Science'],['COMM','Commerce'],['ACCT','Financial Accounting'],['ENT','Entrepreneurship'],['ICT','Computer Craft Studies'],['AUTO','Automobile Mechanics'],['WOOD','Wood Work'],['ELEC','Electrical Installation']],
    },
    {
      code: 'WAEC', name: 'WAEC SSCE', description: 'West African Senior School Certificate Exam',
      subjects: [['ENG','English Language'],['MATH','Mathematics'],['PHYS','Physics'],['CHEM','Chemistry'],['BIO','Biology'],['ECONS','Economics'],['GOVT','Government'],['LIT','Literature in English'],['CRS','Christian Religious Studies'],['IRS','Islamic Religious Studies'],['GEO','Geography'],['HA','History'],['AGRIC','Agricultural Science'],['COMM','Commerce'],['ACCT','Financial Accounting'],['ENT','Entrepreneurship'],['ICT','Information and Communication Technology']],
    },
    {
      code: 'JAMB', name: 'JAMB UTME', description: 'Unified Tertiary Matriculation Examination',
      subjects: [['ENG','English Language'],['MATH','Mathematics'],['PHYS','Physics'],['CHEM','Chemistry'],['BIO','Biology'],['ECONS','Economics'],['GOVT','Government'],['LIT','Literature in English'],['CRS','Christian Religious Studies'],['IRS','Islamic Religious Studies'],['GEO','Geography'],['HA','History'],['AGRIC','Agricultural Science'],['COMM','Commerce'],['ACCT','Financial Accounting'],['SINS','Use of English & Civic Education']],
    },
    {
      code: 'POST_UTME', name: 'POST UTME', description: 'University screening exams (institution-specific; uses JAMB-style curriculum)',
      subjects: [['ENG','English Language'],['MATH','Mathematics'],['PHYS','Physics'],['CHEM','Chemistry'],['BIO','Biology'],['ECONS','Economics'],['GOVT','Government'],['LIT','Literature in English'],['CRS','Christian Religious Studies'],['IRS','Islamic Religious Studies'],['GEO','Geography'],['HA','History'],['AGRIC','Agricultural Science'],['COMM','Commerce'],['ACCT','Financial Accounting']],
    },
  ];

  const examByCode = new Map<string, string>();
  for (const def of EXAMS) {
    const exam = await prisma.exam.upsert({
      where: { code: def.code },
      update: {},
      create: { code: def.code, name: def.name, description: def.description },
    });
    examByCode.set(def.code, exam.id);
    const version = await prisma.examVersion.upsert({
      where: { examId_versionLabel: { examId: exam.id, versionLabel: '2025' } },
      update: {},
      create: { examId: exam.id, versionLabel: '2025', effectiveFrom: new Date('2025-01-01') },
    });
    for (const [code, name] of def.subjects) {
      await prisma.subject.upsert({
        where: { examId_code: { examId: exam.id, code } },
        update: {},
        create: { code, name, examId: exam.id, examVersionId: version.id },
      });
    }
  }

  const waecId = examByCode.get('WAEC') as string;
  const math = await prisma.subject.findFirst({ where: { examId: waecId, code: 'MATH' } });
  const english = await prisma.subject.findFirst({ where: { examId: waecId, code: 'ENG' } });
  if (!math || !english) throw new Error('WAEC subjects missing');

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

  const englishObjectives: Array<[string, string]> = [
    ['ENG.COM.01', 'Comprehension passages'],
    ['ENG.ESSAY.01', 'Essay writing'],
    ['ENG.LEX.01', 'Lexis and structure'],
    ['ENG.SUM.01', 'Summary writing'],
    ['ENG.ORAL.01', 'Oral forms'],
  ];
  for (let i = 0; i < englishObjectives.length; i += 1) {
    const [code, description] = englishObjectives[i]!;
    await prisma.objective.upsert({
      where: { subjectId_code: { subjectId: english.id, code } },
      update: {},
      create: { subjectId: english.id, code, description, orderIndex: i + 1, examWeight: 1.0 },
    });
  }

  const englishQuestionCount = await prisma.question.count({ where: { subjectId: english.id } });
  if (englishQuestionCount === 0) {
    const com01 = await prisma.objective.findFirst({
      where: { subjectId: english.id, code: 'ENG.COM.01' },
    });
    for (let i = 1; i <= 5; i += 1) {
      const q = await prisma.question.create({
        data: {
          subjectId: english.id,
          difficulty: (i % 5) + 1,
          status: 'APPROVED',
          versions: {
            create: {
              version: 1,
              body: `Sample English question ${i}: choose the correct option.`,
              options: [
                { key: 'A', text: 'Option one' },
                { key: 'B', text: 'Option two' },
                { key: 'C', text: 'Option three' },
                { key: 'D', text: 'Option four' },
              ],
              answerKey: 'C',
              explanation: 'Worked solution goes here.',
              authoredBy: admin.id,
              provenance: { source: 'founder-authored', license: 'owned', exam_year: 2025 },
            },
          },
        },
        include: { versions: true },
      });
      const v = q.versions[0];
      if (v) {
        await prisma.question.update({ where: { id: q.id }, data: { currentVersionId: v.id } });
        if (com01) {
          await prisma.questionObjective.create({
            data: { questionId: q.id, objectiveId: com01.id, primary: true },
          });
        }
      }
    }
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
