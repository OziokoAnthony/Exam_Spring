-- CreateEnum
CREATE TYPE "AttemptMode" AS ENUM ('DIAGNOSTIC', 'PRACTICE', 'CBT', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "MasteryEventType" AS ENUM ('ATTEMPT', 'DIAGNOSTIC', 'DECAY', 'MANUAL_ADJUST');

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "learner_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "mode" "AttemptMode" NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "total_questions" INTEGER NOT NULL,
    "correct_count" INTEGER,
    "score_pct" DECIMAL(5,2),
    "duration_ms" INTEGER,
    "idempotency_key" TEXT NOT NULL,
    "device_id" TEXT,
    "synced_from_offline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_version_id" UUID NOT NULL,
    "response" TEXT,
    "is_correct" BOOLEAN,
    "time_ms" INTEGER,
    "answered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mastery_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "learner_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "event_type" "MasteryEventType" NOT NULL,
    "delta" DECIMAL(5,4) NOT NULL,
    "source_attempt_item_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mastery_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mastery_scores" (
    "learner_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "score" DECIMAL(5,4) NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "last_practiced_at" TIMESTAMPTZ,
    "next_review_due_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mastery_scores_pkey" PRIMARY KEY ("learner_id","objective_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attempts_idempotency_key_key" ON "attempts"("idempotency_key");

-- CreateIndex
CREATE INDEX "attempts_learner_id_idx" ON "attempts"("learner_id");

-- CreateIndex
CREATE INDEX "attempts_subject_id_idx" ON "attempts"("subject_id");

-- CreateIndex
CREATE INDEX "attempt_items_attempt_id_idx" ON "attempt_items"("attempt_id");

-- CreateIndex
CREATE INDEX "attempt_items_question_id_idx" ON "attempt_items"("question_id");

-- CreateIndex
CREATE INDEX "mastery_events_learner_id_idx" ON "mastery_events"("learner_id");

-- CreateIndex
CREATE INDEX "mastery_events_objective_id_idx" ON "mastery_events"("objective_id");

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
