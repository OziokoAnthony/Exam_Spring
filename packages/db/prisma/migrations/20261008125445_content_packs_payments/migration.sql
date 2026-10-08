-- CreateEnum
CREATE TYPE "ContentPackStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "content_packs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ContentPackStatus" NOT NULL DEFAULT 'DRAFT',
    "storage_key" TEXT,
    "size_bytes" INTEGER,
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "content_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_packs_subject_id_version_key" ON "content_packs"("subject_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_reference_key" ON "payment_orders"("reference");

-- CreateIndex
CREATE INDEX "payment_orders_user_id_idx" ON "payment_orders"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_provider_provider_event_id_key" ON "payment_events"("provider", "provider_event_id");

-- AddForeignKey
ALTER TABLE "content_packs" ADD CONSTRAINT "content_packs_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
