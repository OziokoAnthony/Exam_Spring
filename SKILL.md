# 1. PROJECT IDENTITY

## What This Is

ExamSpring is a mobile-first, offline-capable learning and assessment
platform for Nigerian students preparing for national and entrance exams.

It is NOT a generic AI tutor. It is an **auditable exam-readiness system**:
every question, explanation, and recommendation is tagged to an official
syllabus objective, reviewed by a human, and traceable to its source.

The product proves, with data, how ready a learner is for their exam —
and what they should study next.

## Exams Covered (Platform Supports All 6; Content Rolls Out in Stages)

1. **FSLC** — First School Leaving Certificate (Primary 6 / Common Entrance)
2. **BECE** — Basic Education Certificate Examination (JSS3)
3. **NECO** — National Examinations Council (Senior Secondary)
4. **NABTEB** — National Business and Technical Examinations Board
5. **WAEC/JAMB** — WASSCE + Unified Tertiary Matriculation Examination
6. **POST UTME** — University screening exams (institution-specific)

The platform's data model supports all 6 from Day 1.
Content is added exam-by-exam. Starting content: **WAEC/JAMB Math + English**.

## Who It Serves

- **Learners** at all levels: primary, junior secondary, senior secondary,
  private candidates, post-secondary aspirants
- **Parents/guardians** paying for measurable exam preparation
- **Teachers and tutorial centres** needing assignments, cohorts, analytics
- **Content reviewers/publishers** needing a controlled authoring workflow

## Region

Nigeria-first. Lagos and Abuja are the initial target markets.
Expansion to other West African exam markets is Phase 3+.

## The Core Problem

1. Fragmented prep — students use random PDFs, WhatsApp groups, old papers
2. Weak feedback — wrong answers aren't explained; mistakes repeat
3. Bad connectivity — most study apps assume fast internet; Nigeria doesn't have it

## The Differentiated Wedge

Not "AI tutor." The wedge is:

- **Syllabus-aligned** — every item maps to an official exam objective
- **Auditable** — every question has provenance and human review
- **Adaptive** — deterministic mastery model first, ML later
- **Offline-first** — download packs, study without internet, sync later
- **Guardrailed AI** — tutor answers only from approved content, cites sources,
  refuses when unsure, escalates to humans
- **Multi-exam** — one platform for a learner's full academic journey
  (Primary → JSS → SSS → University entrance)

## Platform Strategy

- **MVP (Months 1–2):** PWA only. Installable, offline-capable, works on
  Android + iOS + desktop browsers. No app store.
- **Phase 2 (Month 3+):** React Native app (Android first, then iOS) built
  against the same API. Web/PWA remains fully supported.
- **One backend. Multiple clients.** Web, PWA, and native apps share the
  same NestJS API and Postgres database.

## Non-Negotiables (Never Compromise These)

1. **Child safety first.** Many users are minors. Every decision protects them.
2. **NDPA compliance.** Nigeria Data Protection Act 2023 governs everything.
3. **Content provenance.** No scraped content. Ever. Every question has a source.
4. **Human review.** No question reaches a learner without approval.
5. **Deterministic scoring.** Answer keys score; AI never scores.
6. **AI is optional.** The product works fully without the AI tutor.
7. **Offline-capable.** Core learning works without internet.
8. **No data selling.** Learner data is never sold or shared for profit.
9. **Exam-agnostic engine.** The adaptive engine works for any exam;
   curriculum and rules are configuration, not code.
10. **One codebase per client.** No duplication across web/PWA/native.

## What Success Looks Like (6-Month View)

- 1 pilot tutorial centre, 20–50 real learners
- 2 exams with live content (WAEC/JAMB first)
- Paid conversion ≥ 5%
- Objective-level mastery gains measurable
- Offline sync success ≥ 99%
- Zero child-data incidents
- Content pipeline producing ≥ 50 reviewed items/day

## What This Project Is NOT

- Not a social network
- Not a video platform
- Not a homework-answers bot
- Not a scraping tool
- Not a replacement for teachers
- Not affiliated with WAEC, JAMB, NECO, NABTEB, or any exam body
  (unless a written agreement exists)

  # 2. MVP SCOPE — WHAT WE BUILD NOW VS LATER

This section is the contract. If it's not in "MVP IN SCOPE," the agent does
not build it. No exceptions. No "while I'm here" features.

The platform supports 6 exams. The MVP launches with content for ONE exam
(WAEC/JAMB Math + English) to prove the loop. The data model supports all 6
from Day 1.

## MVP IN SCOPE (Build This)

### 2.1 Users & Roles

- Learner (student)
- Parent/guardian (view-only progress)
- Teacher (cohort + assignment management)
- Admin (content review, platform operations)

### 2.2 Exams Supported (Data Model Level)

The platform models all 6 exams from Day 1:

1. FSLC
2. BECE
3. NECO
4. NABTEB
5. WAEC/JAMB
6. POST UTME

Each exam has its own:

- Syllabus structure
- Subject list
- Objective taxonomy
- Exam rules (timing, format, marking)
- Content rollout schedule

Content rollout (staged):

- **MVP launch:** WAEC/JAMB Math + English only
- **Phase 2:** + BECE Math + English, + JAMB-specific rules
- **Phase 3:** + NECO, + more subjects
- **Phase 4:** + FSLC, NABTEB, POST UTME

### 2.3 Auth & Onboarding

- Email + password signup (phone OTP is Phase 2)
- Email verification
- Role selection at signup
- Consent flow for under-18 learners (parent/guardian email consent)
- Age declaration + verification step
- Password reset
- Learner selects exam(s) and target date during onboarding

### 2.4 Curriculum & Content

- Curriculum model supports multiple exams, subjects, and objective trees
- Initial content: WAEC/JAMB Mathematics + English
- Question bank with:
  - Exam + subject + objective tagging (many-to-many)
  - Multiple-choice questions (4 options, 1 correct)
  - Explanation field
  - Difficulty rating (1–5)
  - Provenance (author, source, license, exam version/year)
  - Version history (immutable)
  - Review status (draft / pending / approved / rejected)
- Admin review console:
  - Create question
  - Edit (creates new version)
  - Approve / reject / request changes
  - Flag for second review
  - Filter by exam, subject, objective, status
- ~40 seed questions minimum (human-authored, not AI)

### 2.5 Diagnostic Assessment

- On first login, learner takes a diagnostic for their selected exam
- 15 questions per subject, mixed difficulty
- Server-side scoring
- Produces objective-level mastery scores (0.0–1.0)
- Shows learner: strong topics, weak topics, recommended next

### 2.6 Adaptive Practice Loop

- Learner picks subject → sees recommended next objective
- Recommendation logic (deterministic):
  - Weight = (1 - mastery) × exam_weight × recency_factor
  - Pick highest-weight objective not practiced in last 24h
- Learner answers 10 questions on that objective
- Immediate feedback: correct/incorrect + explanation
- Mastery updates after each answer (Bayesian-ish update)
- Progress bar shows mastery growth

### 2.7 Timed CBT Simulation (Lite)

- Learner picks subject → 20 questions, 25 minutes
- Timer visible, auto-submit at 0
- Navigation: next / prev / flag for review
- Submit → server scores → shows result + review

### 2.8 Parent View

- Parent linked to learner (via learner invite)
- Sees: mastery by subject, study streak, last 7 days activity
- Cannot see: individual answers, tutor conversations, PII beyond what's needed
- Export progress report as PDF

### 2.9 Teacher View (Minimal)

- Teacher creates a cohort
- Invites learners via code
- Sees cohort-level mastery heatmap
- Assigns an objective to the cohort
- Sees completion + average mastery

### 2.10 Offline Mode (Basic — PWA)

- Learner can "download" a subject pack (objectives + questions + explanations)
- Stored in IndexedDB (Dexie)
- Service worker handles offline routing
- Attempts made offline are queued locally
- On reconnect, queue syncs (idempotent)
- Sync status visible to learner ("3 attempts pending")
- Low-data mode toggle (disables images > 100KB)

### 2.11 PWA Installation

- Manifest + service worker
- Installable on Android, iOS, and desktop browsers
- Add-to-home-screen prompt after first successful practice
- Offline-capable shell
- Push notifications deferred to Phase 2

### 2.12 Payments

- Paystack integration
- One plan: "Full Access" monthly
- Free tier: diagnostic + 20 practice questions/day
- Paid tier: unlimited practice, CBT, offline packs
- Webhook reconciliation with idempotency
- Receipt email

### 2.13 Notifications (Email Only)

- Welcome email
- Weekly progress summary (learner + parent)
- Payment receipt
- Password reset
- SMS/WhatsApp deferred to Phase 2

### 2.14 Admin & Ops

- Admin dashboard: users, questions, subscriptions
- Content review queue
- Basic metrics: signups, active learners, items answered, mastery gains
- Error tracking (Sentry)
- Uptime monitoring

### 2.15 Deployment & Infrastructure

- Web app (Next.js PWA) on Vercel
- API (NestJS) on Railway or Fly.io
- Postgres (managed) on Railway / Supabase / Neon
- Redis (managed) on Upstash
- Object storage (Cloudflare R2 or AWS S3)
- CI/CD via GitHub Actions
- Staging + production environments
- Transactional outbox for reliable events

---

## MVP OUT OF SCOPE (Do NOT Build Now)

The agent must refuse to build these, even if asked casually.
They are Phase 2 or later.

### Content & Exams

- ❌ Live content for FSLC, BECE, NECO, NABTEB, POST UTME
  (data model only; no content yet)
- ❌ Subjects beyond Math and English at launch
- ❌ Video lessons
- ❌ Live classes
- ❌ Scraped or AI-generated questions (content is human-authored)

### AI Features

- ❌ AI tutor (Phase 2 — needs approved corpus first)
- ❌ AI-generated explanations
- ❌ AI-generated questions
- ❌ Advanced ML/IRT adaptive model (deterministic only)
- ❌ Voice/chat interface

### Platform

- ❌ React Native / native mobile apps (Phase 2)
- ❌ Desktop apps (Electron, etc.)
- ❌ Kubernetes
- ❌ Microservices
- ❌ GraphQL
- ❌ WebSockets (SSE or polling only)
- ❌ Multi-region deployment
- ❌ Self-hosted infrastructure

### Features

- ❌ School SSO
- ❌ Parent-teacher chat
- ❌ Gamification (badges, leaderboards)
- ❌ Social features (friends, sharing)
- ❌ Content marketplace
- ❌ Publisher API
- ❌ Analytics warehouse (Postgres materialized views only)
- ❌ SMS/WhatsApp notifications
- ❌ Multi-currency payments
- ❌ Scholarship/sponsored seats
- ❌ Anomaly detection for cheating
- ❌ Watermarking
- ❌ Push notifications

---

## THE GOLDEN RULE

If a feature is not listed in "MVP IN SCOPE" above, the agent must ask
before building it. No exceptions.

When in doubt, cut. A smaller working MVP beats a larger broken one.

The platform supports 6 exams. The MVP proves the loop with 1 exam's content.
Everything else is staged.

# 3. TECH STACK — LOCKED

These choices are final for the MVP. The agent must not introduce new tools,
languages, or frameworks without explicit written approval from the founder.

Rationale: one person + AI agent + 9-day slice = every new tool is a new
failure point. Fewer tools, deeper mastery.

---

## 3.1 Language

- **TypeScript everywhere.** Frontend, backend, scripts, tests.
- **Strict mode on.** `"strict": true` in all tsconfig files. No exceptions.
- **No JavaScript files.** `.ts` and `.tsx` only (except config files that
  require `.js`).

Why: one language across the stack means shared types, shared validation
(Zod), and the AI agent stays in one mental model.

---

## 3.2 Frontend (Web / PWA)

- **Framework:** Next.js 14+ (App Router)
- **UI:** Tailwind CSS + shadcn/ui components
- **State:** React Server Components first; Zustand for client state
- **Forms:** React Hook Form + Zod
- **Data fetching:** Native fetch + React Query (TanStack Query)
- **PWA:** next-pwa (or built-in Next.js PWA support)
- **Offline storage:** Dexie (IndexedDB wrapper)
- **Icons:** Lucide
- **Charts:** Recharts (for mastery/progress visuals)
- **PDF export:** @react-pdf/renderer

**Why Next.js:** One framework for web + PWA. Server components reduce
client JS. Vercel deployment is instant. AI agents know it well.

**Why Tailwind + shadcn/ui:** Fast to build, consistent, accessible,
and the AI agent produces clean output with these patterns.

---

## 3.3 Backend (API)

- **Framework:** NestJS (TypeScript)
- **Runtime:** Node.js 20 LTS
- **API style:** REST + JSON
- **Validation:** Zod (shared schemas with frontend via a `packages/shared` module)
- **Auth:** JWT access tokens + refresh tokens; bcrypt for passwords
- **Background jobs:** BullMQ (Redis-backed)
- **Scheduled jobs:** NestJS scheduler + BullMQ
- **Logging:** Pino (structured JSON logs)
- **Error tracking:** Sentry
- **Observability:** OpenTelemetry (traces) — Phase 2 if time allows

**Why NestJS over Go:** One language. Faster hiring in Lagos. Shared types
with frontend. The adaptive engine is math, not raw throughput. Go is a
Phase 3 conversation if ever needed.

**Why REST over GraphQL:** Simpler. AI agents handle it better. No
over-fetching problems at this scale.

---

## 3.4 Database

- **Primary DB:** PostgreSQL 15+
- **Hosting:** Railway (MVP) → Supabase or Neon as backup option
- **ORM:** Prisma
- **Migrations:** Prisma Migrate (forward-only, numbered)
- **Row-Level Security:** Postgres RLS enabled on all tenant-scoped tables
- **Extensions:** `pgcrypto` (UUIDs), `pg_trgm` (search), `citext` (case-insensitive email)

**Why Postgres:** Your doc says it. It's correct. Relational integrity for
attempts/mastery/curriculum matters. RLS gives tenant isolation for free.

**Why Prisma:** Best TypeScript DX. AI agents generate clean Prisma schemas.
Migrate is reliable.

**Why not an ORM-free SQL layer (Kysely, Drizzle):** Prisma is faster for
a solo dev + AI agent. Revisit in Phase 3 if perf demands it.

---

## 3.5 Cache, Queues, Sessions

- **Redis:** Upstash (managed, serverless-friendly)
- **Uses:**
  - Session/refresh token blacklist
  - Rate limiting
  - BullMQ job queues
  - Idempotency keys
  - Short-lived cache (curriculum, feature flags)

**Why Upstash:** Pay-per-request, no server to manage, works from Vercel
edge functions if needed.

---

## 3.6 Object Storage & CDN

- **Storage:** Cloudflare R2 (S3-compatible, no egress fees)
- **CDN:** Cloudflare (in front of R2 and the Next.js app)
- **Uses:**
  - Content packs (versioned, checksummed)
  - Question media (images, diagrams)
  - Parent progress PDF exports
  - Backups (encrypted)

**Why R2:** Zero egress fees matter for a Nigerian audience on low-data plans.

---

## 3.7 Payments

- **Primary:** Paystack
- **Backup:** Flutterwave (Phase 2)
- **Webhooks:** Idempotent handling, stored raw payloads, reconciled via outbox
- **Currency:** NGN only at MVP

**Why Paystack:** Best developer experience in Nigeria. Reliable webhooks.
Wide card + transfer + USSD support.

---

## 3.8 Email & Notifications

- **Transactional email:** Resend (or Postmark)
- **Templates:** React Email
- **SMS/WhatsApp:** Deferred to Phase 2 (Termii or Twilio)

**Why Resend:** Clean API, React Email integration, good deliverability,
generous free tier.

---

## 3.9 AI (Tutor — Phase 2, but stack locked now)

- **Provider:** OpenAI (GPT-4o-mini for cost) or Anthropic Claude (Haiku)
- **Retrieval:** pgvector extension in Postgres (no separate vector DB)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Guardrails:**
  - Closed corpus only (approved questions + objectives)
  - System prompt enforces citations + refusal
  - Response length cap
  - Per-learner daily call cap
  - Cache common Q&A per objective
- **Feature flag:** Tutor can be disabled globally without deploy

**Why pgvector over Pinecone/Weaviate:** One less service. Postgres already
there. Fine for MVP content volume.

**Why not build the tutor in MVP:** Content corpus must exist and be
reviewed first. Building the tutor before the corpus = hallucination machine.

---

## 3.10 Testing

- **Unit + integration:** Vitest
- **E2E:** Playwright
- **API tests:** Supertest (NestJS native)
- **Coverage target:** 70% on critical paths (auth, scoring, payments, sync)
- **No coverage target on UI components** — test behavior, not markup

**Why Vitest over Jest:** Faster, better TypeScript support, modern.

**Why Playwright:** Real browser, offline emulation, mobile viewport testing,
works in CI.

---

## 3.11 Code Quality

- **Linter:** ESLint (with TypeScript + import rules)
- **Formatter:** Prettier
- **Git hooks:** Husky + lint-staged
- **Commit convention:** Conventional Commits
- **Type checking:** `tsc --noEmit` in CI

**Non-negotiable:** CI fails if lint, typecheck, or tests fail. No bypass.

---

## 3.12 Deployment & Infrastructure

- **Frontend:** Vercel (Next.js native)
- **Backend:** Railway (MVP) or Fly.io
- **Database:** Railway Postgres (MVP)
- **Redis:** Upstash
- **Storage:** Cloudflare R2
- **CI/CD:** GitHub Actions
- **Environments:** `local`, `staging`, `production`
- **Secrets:** Doppler or Infisical (never in `.env` committed)
- **Containers:** Docker for local dev parity; managed platform for prod
- **IaC:** Deferred to Phase 2 (Terraform or Pulumi)

**Why NOT Kubernetes:** Your doc mentions it. Don't. It's a full-time job.
Managed platforms give 95% of the benefit at 5% of the operational cost.

**Why NOT AWS directly:** Too many moving parts for a solo dev. Managed
platforms (Vercel, Railway, Upstash, R2) compose better.

---

## 3.13 Monorepo Structure

- **Tool:** pnpm workspaces + Turborepo
- **Packages:**
  - `frontend` — Next.js PWA
  - `backend` — NestJS backend
  - `packages/shared` — Zod schemas, types, constants
  - `packages/db` — Prisma schema + client
  - `packages/ui` — shared React components (optional, Phase 2)

**Why monorepo:** Shared types between web and API. One PR = full feature.
AI agent sees the whole system.

**Why not polyrepo:** Solo dev. Monorepo is faster.

---

## 3.14 AI Agent Tools (Recommended)

- **Cursor** or **Claude Code** — primary coding agent
- **v0.dev** — UI scaffolding (optional)
- **GitHub Copilot** — inline completions (optional)
- **The SKILL.md + .cursorrules + CLAUDE.md** — must be present at repo root

---

## 3.15 Banned Tools (Do NOT Introduce)

The agent must not add these without explicit approval:

- ❌ Any state manager other than Zustand (no Redux, MobX, Recoil)
- ❌ Any ORM other than Prisma (no TypeORM, Drizzle, Kysely)
- ❌ Any CSS framework other than Tailwind (no styled-components, Emotion)
- ❌ Any test runner other than Vitest (no Jest)
- ❌ Any auth library other than the built-in JWT approach (no NextAuth, Clerk, Auth0 at MVP)
- ❌ Any queue other than BullMQ
- ❌ Any cloud other than the listed platforms
- ❌ Any database other than Postgres
- ❌ Any vector DB other than pgvector
- ❌ JavaScript files in `src/` directories
- ❌ `any` type in TypeScript (use `unknown` + validation)
- ❌ `console.log` in committed code (use the logger)

---

## 3.16 Version Pinning

All dependencies use exact versions (no `^` or `~`) in `package.json`.
Lockfile committed. Upgrades are deliberate PRs, not automatic.

Why: reproducibility. The AI agent must not silently upgrade a dependency.

# 4. ARCHITECTURE RULES

These are the structural rules the AI agent must follow. Violating them
creates drift, bugs, and security holes. Read this section before creating
any new file.

---

## 4.1 High-Level Shape

ExamSpring is a **modular monolith**.

- One backend application (`backend`)
- One frontend application (`frontend`)
- Shared code in `packages/*`
- One Postgres database
- One Redis instance
- One object storage bucket

NOT microservices. NOT serverless functions scattered everywhere.
NOT a separate service per domain.

Why: a solo founder + AI agent cannot operate distributed systems.
Modular monolith gives clean boundaries without operational pain.

---

## 4.2 Backend Modules (NestJS)

The API is organized into modules. Each module owns its domain.

# 5. DATA MODEL (REFERENCE)

This section defines the core database entities. It is a reference, not the
full Prisma schema. The actual schema lives in `packages/db/prisma/schema.prisma`.

Rules:

- All tables use `id` (UUID v4, default `gen_random_uuid()`)
- All tables have `created_at` and `updated_at` (timestamptz, default `now()`)
- Tenant-scoped tables have `tenant_id` (nullable for global data)
- No soft deletes except where explicitly noted; use `deleted_at` only on
  user-facing resources that need recovery (e.g., questions)
- No nullable foreign keys unless the relationship is truly optional

---

## 5.1 Identity & Users

### users

- `id` (uuid, pk)
- `email` (citext, unique, not null)
- `email_verified_at` (timestamptz, nullable)
- `password_hash` (text, not null)
- `role` (enum: LEARNER, PARENT, TEACHER, ADMIN, not null)
- `full_name` (text, not null)
- `phone` (text, nullable) — Phase 2 for OTP
- `date_of_birth` (date, nullable)
- `is_minor` (boolean, not null, default false)
- `tenant_id` (uuid, fk to tenants, nullable) — set for school-affiliated users
- `status` (enum: ACTIVE, SUSPENDED, DELETED, default ACTIVE)
- `last_login_at` (timestamptz, nullable)
- `deleted_at` (timestamptz, nullable)

Indexes: `email` (unique), `tenant_id`, `role`

### sessions

- `id` (uuid, pk)
- `user_id` (uuid, fk users, not null)
- `refresh_token_hash` (text, not null)
- `device_label` (text, nullable)
- `ip_address` (inet, nullable)
- `user_agent` (text, nullable)
- `expires_at` (timestamptz, not null)
- `revoked_at` (timestamptz, nullable)
- `last_used_at` (timestamptz, not null)

Indexes: `user_id`, `refresh_token_hash` (unique)

### password_resets

- `id` (uuid, pk)
- `user_id` (uuid, fk users, not null)
- `token_hash` (text, unique, not null)
- `expires_at` (timestamptz, not null)
- `used_at` (timestamptz, nullable)

### consent_records (NDPA)

- `id` (uuid, pk)
- `user_id` (uuid, fk users, not null) — the learner
- `guardian_id` (uuid, fk users, nullable) — the consenting guardian
- `consent_type` (enum: DATA_PROCESSING, MARKETING, AI_TUTOR, PHOTO_USAGE)
- `granted_at` (timestamptz, not null)
- `revoked_at` (timestamptz, nullable)
- `evidence` (jsonb, not null) — IP, user agent, method
- `policy_version` (text, not null)

### guardian_links

- `id` (uuid, pk)
- `guardian_id` (uuid, fk users, not null)
- `learner_id` (uuid, fk users, not null)
- `relationship` (enum: MOTHER, FATHER, GUARDIAN, OTHER)
- `verified_at` (timestamptz, nullable)
- `status` (enum: PENDING, ACTIVE, REVOKED)

Indexes: `guardian_id`, `learner_id`, unique (`guardian_id`, `learner_id`)

---

## 5.2 Tenancy

### tenants

- `id` (uuid, pk)
- `name` (text, not null)
- `type` (enum: SCHOOL, TUTORIAL_CENTRE, PUBLISHER, OTHER)
- `region` (text, nullable)
- `status` (enum: ACTIVE, SUSPENDED, default ACTIVE)
- `settings` (jsonb, default '{}')

### tenant_memberships

- `id` (uuid, pk)
- `tenant_id` (uuid, fk tenants, not null)
- `user_id` (uuid, fk users, not null)
- `role_in_tenant` (enum: OWNER, ADMIN, TEACHER, LEARNER, VIEWER)
- `joined_at` (timestamptz, not null)

Indexes: unique (`tenant_id`, `user_id`)

---

## 5.3 Curriculum

### exams

- `id` (uuid, pk)
- `code` (text, unique, not null) — FSLC, BECE, NECO, NABTEB, WAEC, JAMB, POST_UTME
- `name` (text, not null)
- `description` (text, nullable)
- `is_active` (boolean, default true)

### exam_versions

- `id` (uuid, pk)
- `exam_id` (uuid, fk exams, not null)
- `version_label` (text, not null) — e.g., "2025", "2024-syllabus"
- `effective_from` (date, not null)
- `effective_to` (date, nullable)
- `source_url` (text, nullable)
- `source_notes` (text, nullable)

Indexes: (`exam_id`, `version_label`) unique

### subjects

- `id` (uuid, pk)
- `code` (text, not null) — e.g., "MATH", "ENG"
- `name` (text, not null)
- `exam_id` (uuid, fk exams, not null)
- `exam_version_id` (uuid, fk exam_versions, nullable)

Indexes: (`exam_id`, `code`) unique

### objectives

- `id` (uuid, pk)
- `subject_id` (uuid, fk subjects, not null)
- `code` (text, not null) — e.g., "MATH.ALG.01"
- `description` (text, not null)
- `parent_objective_id` (uuid, fk objectives, nullable) — for tree structure
- `exam_weight` (numeric(4,3), default 1.0) — how heavily weighted in the exam
- `order_index` (int, not null)

Indexes: (`subject_id`, `code`) unique, `parent_objective_id`

---

## 5.4 Question Bank

### questions

- `id` (uuid, pk)
- `tenant_id` (uuid, fk tenants, nullable) — null = global bank
- `subject_id` (uuid, fk subjects, not null)
- `type` (enum: MCQ, default MCQ)
- `difficulty` (int, 1–5, not null)
- `status` (enum: DRAFT, PENDING_REVIEW, APPROVED, REJECTED, RETIRED, default DRAFT)
- `current_version_id` (uuid, fk question_versions, nullable)
- `deleted_at` (timestamptz, nullable)

Indexes: `subject_id`, `status`, `tenant_id`

### question_versions (immutable)

- `id` (uuid, pk)
- `question_id` (uuid, fk questions, not null)
- `version` (int, not null)
- `body` (text, not null)
- `options` (jsonb, not null) — `[{key: "A", text: "..."}, ...]`
- `answer_key` (text, not null) — "A", "B", "C", or "D"
- `explanation` (text, not null)
- `media_urls` (jsonb, default '[]')
- `authored_by` (uuid, fk users, not null)
- `approved_by` (uuid, fk users, nullable)
- `approved_at` (timestamptz, nullable)
- `provenance` (jsonb, not null) — `{source, license, original_ref, exam_year}`

Indexes: unique (`question_id`, `version`)

### question_objectives (many-to-many)

- `question_id` (uuid, fk questions, not null)
- `objective_id` (uuid, fk objectives, not null)
- `primary` (boolean, default false)

Primary key: (`question_id`, `objective_id`)

### question_stats (materialized, recomputed periodically)

- `question_id` (uuid, pk, fk questions)
- `n_attempts` (int, default 0)
- `p_value` (numeric(4,3), nullable) — proportion correct
- `discrimination` (numeric(4,3), nullable)
- `avg_time_ms` (int, nullable)
- `last_computed_at` (timestamptz, not null)

---

## 5.5 Content Packs

### content_packs

- `id` (uuid, pk)
- `exam_id` (uuid, fk exams, not null)
- `subject_id` (uuid, fk subjects, not null)
- `version` (text, not null)
- `size_bytes` (bigint, not null)
- `checksum` (text, not null) — SHA-256
- `storage_key` (text, not null) — R2/S3 key
- `manifest` (jsonb, not null) — list of objective + question IDs
- `published_at` (timestamptz, not null)
- `is_active` (boolean, default true)

Indexes: (`exam_id`, `subject_id`, `version`) unique

### learner_pack_downloads

- `id` (uuid, pk)
- `learner_id` (uuid, fk users, not null)
- `pack_id` (uuid, fk content_packs, not null)
- `downloaded_at` (timestamptz, not null)
- `last_synced_at` (timestamptz, nullable)
- `device_id` (text, nullable)

Indexes: unique (`learner_id`, `pack_id`, `device_id`)

---

## 5.6 Attempts (Immutable)

### attempts

- `id` (uuid, pk)
- `learner_id` (uuid, fk users, not null)
- `exam_id` (uuid, fk exams, not null)
- `subject_id` (uuid, fk subjects, not null)
- `mode` (enum: DIAGNOSTIC, PRACTICE, CBT, ASSIGNMENT)
- `started_at` (timestamptz, not null)
- `submitted_at` (timestamptz, nullable)
- `total_questions` (int, not null)
- `correct_count` (int, nullable)
- `score_pct` (numeric(5,2), nullable)
- `duration_ms` (int, nullable)
- `idempotency_key` (text, unique, not null)
- `assignment_id` (uuid, fk assignments, nullable)
- `device_id` (text, nullable)
- `synced_from_offline` (boolean, default false)

Indexes: `learner_id`, `subject_id`, `submitted_at`

### attempt_items (immutable)

- `id` (uuid, pk)
- `attempt_id` (uuid, fk attempts, not null)
- `question_id` (uuid, fk questions, not null)
- `question_version_id` (uuid, fk question_versions, not null)
- `response` (text, nullable) — selected option key, null if skipped
- `is_correct` (boolean, nullable) — null if skipped
- `time_ms` (int, nullable)
- `confidence` (int, nullable) — 1–5 if learner reports it
- `answered_at` (timestamptz, nullable)

Indexes: `attempt_id`, `question_id`

---

## 5.7 Mastery

### mastery_events (append-only)

- `id` (uuid, pk)
- `learner_id` (uuid, fk users, not null)
- `objective_id` (uuid, fk objectives, not null)
- `event_type` (enum: ATTEMPT, DIAGNOSTIC, DECAY, MANUAL_ADJUST)
- `delta` (numeric(5,4), not null)
- `source_attempt_item_id` (uuid, fk attempt_items, nullable)
- `created_at` (timestamptz, not null)

Indexes: `learner_id`, `objective_id`, `created_at`

### mastery_scores (projection, rebuildable)

- `learner_id` (uuid, fk users, not null)
- `objective_id` (uuid, fk objectives, not null)
- `score` (numeric(5,4), not null) — 0.0000 to 1.0000
- `confidence` (numeric(5,4), not null) — 0.0000 to 1.0000
- `attempts_count` (int, not null, default 0)
- `last_practiced_at` (timestamptz, nullable)
- `next_review_due_at` (timestamptz, nullable)
- `updated_at` (timestamptz, not null)

Primary key: (`learner_id`, `objective_id`)

---

## 5.8 Cohorts & Assignments

### cohorts

- `id` (uuid, pk)
- `tenant_id` (uuid, fk tenants, nullable)
- `teacher_id` (uuid, fk users, not null)
- `name` (text, not null)
- `join_code` (text, unique, not null)
- `exam_id` (uuid, fk exams, not null)
- `archived_at` (timestamptz, nullable)

### cohort_members

- `cohort_id` (uuid, fk cohorts, not null)
- `learner_id` (uuid, fk users, not null)
- `joined_at` (timestamptz, not null)

Primary key: (`cohort_id`, `learner_id`)

### assignments

- `id` (uuid, pk)
- `cohort_id` (uuid, fk cohorts, not null)
- `teacher_id` (uuid, fk users, not null)
- `title` (text, not null)
- `objective_ids` (jsonb, not null) — array of objective UUIDs
- `due_at` (timestamptz, nullable)
- `created_at` (timestamptz, not null)

---

## 5.9 Billing

### plans

- `id` (uuid, pk)
- `code` (text, unique, not null) — "FULL_ACCESS_MONTHLY"
- `name` (text, not null)
- `price_ngn` (int, not null) — in kobo
- `billing_period` (enum: MONTHLY, TERMLY, ANNUAL)
- `is_active` (boolean, default true)

### subscriptions

- `id` (uuid, pk)
- `user_id` (uuid, fk users, not null)
- `plan_id` (uuid, fk plans, not null)
- `status` (enum: PENDING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED)
- `provider` (text, not null) — "paystack"
- `provider_ref` (text, unique, not null)
- `current_period_start` (timestamptz, not null)
- `current_period_end` (timestamptz, not null)
- `cancel_at_period_end` (boolean, default false)

Indexes: `user_id`, `status`

### payment_events (immutable)

- `id` (uuid, pk)
- `subscription_id` (uuid, fk subscriptions, nullable)
- `provider_event_id` (text, unique, not null)
- `event_type` (text, not null)
- `amount_kobo` (int, nullable)
- `currency` (text, default 'NGN')
- `raw_payload` (jsonb, not null)
- `reconciled_at` (timestamptz, nullable)
- `created_at` (timestamptz, not null)

---

## 5.10 Sync & Offline

### sync_log

- `id` (uuid, pk)
- `learner_id` (uuid, fk users, not null)
- `device_id` (text, not null)
- `pack_id` (uuid, fk content_packs, nullable)
- `operation` (enum: DOWNLOAD_PACK, PUSH_ATTEMPTS, PULL_PACK)
- `status` (enum: SUCCESS, PARTIAL, FAILED)
- `items_count` (int, nullable)
- `error` (text, nullable)
- `created_at` (timestamptz, not null)

---

## 5.11 Audit & Compliance

### audit_log (append-only)

- `id` (uuid, pk)
- `actor_id` (uuid, fk users, nullable) — null for system
- `action` (text, not null) — e.g., "question.approved", "user.deleted"
- `entity_type` (text, not null)
- `entity_id` (uuid, nullable)
- `before` (jsonb, nullable)
- `after` (jsonb, nullable)
- `ip_address` (inet, nullable)
- `user_agent` (text, nullable)
- `created_at` (timestamptz, not null)

Indexes: `actor_id`, `entity_type`, `entity_id`, `created_at`

### data_export_requests

- `id` (uuid, pk)
- `user_id` (uuid, fk users, not null)
- `status` (enum: PENDING, PROCESSING, READY, FAILED, EXPIRED)
- `storage_key` (text, nullable)
- `requested_at` (timestamptz, not null)
- `completed_at` (timestamptz, nullable)
- `expires_at` (timestamptz, nullable)

### data_deletion_requests

- `id` (uuid, pk)
- `user_id` (uuid, fk users, not null)
- `status` (enum: PENDING, PROCESSING, COMPLETED, FAILED)
- `requested_at` (timestamptz, not null)
- `completed_at` (timestamptz, nullable)
- `reason` (text, nullable)

---

## 5.12 Outbox & Jobs

### outbox_events

- `id` (uuid, pk)
- `aggregate_type` (text, not null)
- `aggregate_id` (uuid, not null)
- `event_type` (text, not null)
- `payload` (jsonb, not null)
- `status` (enum: PENDING, PROCESSING, DONE, FAILED, DLQ)
- `attempts` (int, default 0)
- `available_at` (timestamptz, not null, default now())
- `processed_at` (timestamptz, nullable)
- `last_error` (text, nullable)
- `created_at` (timestamptz, not null)

Indexes: `status`, `available_at`

### idempotency_keys

- `key` (text, pk)
- `user_id` (uuid, fk users, nullable)
- `endpoint` (text, not null)
- `response_status` (int, not null)
- `response_body` (jsonb, not null)
- `created_at` (timestamptz, not null)
- `expires_at` (timestamptz, not null)

---

## 5.13 Feature Flags

### feature_flags

- `name` (text, pk)
- `enabled` (boolean, default false)
- `rollout_pct` (int, default 0)
- `updated_at` (timestamptz, not null)

---

## 5.14 Materialized Views (Analytics)

- `mv_learner_mastery_by_subject` — aggregated mastery per learner per subject
- `mv_cohort_performance` — per-cohort averages
- `mv_item_performance` — question p-value, discrimination
- `mv_daily_active_learners` — DAU/WAU/MAU

Refreshed via BullMQ jobs on a schedule. Never queried in request path.

---

## 5.15 RLS Policies

Every tenant-scoped table (`questions`, `cohorts`, `assignments`,
`tenant_memberships`) has RLS enabled with a policy like:

````sql
CREATE POLICY tenant_isolation ON questions
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id')::uuid);


  # 6. CODING CONVENTIONS

These are the day-to-day rules the AI agent must follow when writing code.
They exist so the codebase stays consistent across hundreds of AI-generated
files.

If a rule here conflicts with a lint rule, fix the lint rule.
If a rule here conflicts with Section 4 (Architecture), Section 4 wins.

---

## 6.1 TypeScript Rules

### Strictness
- `"strict": true` in every tsconfig
- `"noUncheckedIndexedAccess": true`
- `"noImplicitOverride": true`
- `"noFallthroughCasesInSwitch": true`
- `"exactOptionalPropertyTypes": true`

### Types
- **No `any`.** Ever. Use `unknown` + Zod validation, or a specific type.
- **No `as` casting** unless interfacing with a third-party untyped library.
  Document why in a comment.
- **No non-null assertion (`!`)** unless preceded by an explicit runtime check.
- **Prefer `type` over `interface`** for object shapes, unless extending.
- **Prefer `readonly`** for arrays/objects that don't mutate.
- **Union types over enums** in TypeScript. Enums live in the DB as Postgres enums.
- **No `Function` type.** Use specific signatures.
- **No `object` type.** Use `Record<string, unknown>` or a specific shape.

### Exports
- **Named exports only.** No `export default` except in Next.js pages/layouts.
- **One primary export per file.** Helpers can be co-located if small.

### Imports
- **Absolute imports** via `@/` (frontend) or `@app/` (backend). No `../../..`.
- **Import order:** external → internal packages → relative → types.
- **No circular imports.** If two modules need each other, extract to `common/`.

---

## 6.2 File & Folder Rules

- **One component per file** (with rare exceptions for tightly coupled pairs).
- **File names:** kebab-case for everything except React components.
- **React component files:** PascalCase (`PracticeCard.tsx`).
- **Test files:** colocated as `*.spec.ts` or `*.test.ts`.
- **Max file length:** 400 lines. If longer, split.
- **Max function length:** 50 lines. If longer, extract.
- **Max function parameters:** 4. If more, use an options object.
- **Max nesting depth:** 4 levels. If deeper, extract or early-return.

---

## 6.3 Functions & Methods

- **Pure functions preferred.** Side effects isolated and named clearly.
- **Early returns over nested if/else.**
- **No boolean parameters that change behavior.** Use options objects or
  separate functions.
- **Name functions with verbs:** `computeMastery`, `buildContentPack`,
  `sendWelcomeEmail`.
- **Name booleans with `is`/`has`/`can`/`should`:** `isActive`, `hasAccess`,
  `canRetry`, `shouldSync`.
- **Async functions must have error handling.** No floating promises.
- **No `async` without `await`.** Remove `async` if not needed.

---

## 6.4 Error Handling

### Backend
- Every controller method is wrapped by the global exception filter.
- Service methods throw typed exceptions (`NotFoundException`,
  `ValidationException`, `ForbiddenException`).
- Never throw plain `Error` in a service — use NestJS HTTP exceptions or
  domain-specific exceptions.
- All caught errors are logged with context (`requestId`, `userId`, `route`).
- Never swallow errors silently. If you catch, either handle or rethrow.

### Frontend
- API client (`lib/api/`) throws a typed `ApiError` with `code` and `message`.
- Components render error states explicitly (error boundary or inline).
- No `try/catch` in React components unless handling a user-triggered action.
- Toast notifications for user-facing errors, not `alert()`.

### Error codes (shared)
Defined in `packages/shared/errors.ts`:
- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`
- `BUSINESS_RULE_VIOLATION`

---

## 6.5 Logging

- **Backend:** Use Pino logger (`@nestjs/common` Logger or injected Pino).
  Never `console.log`.
- **Frontend:** No `console.log` in committed code. Use a dev-only logger
  utility or remove before commit.
- **Log levels:**
  - `error` — something broke, needs attention
  - `warn` — unusual but handled
  - `info` — significant business events (user created, payment succeeded)
  - `debug` — development detail
  - `trace` — very fine detail, off in prod
- **Every log includes:** `requestId`, `userId` (if authenticated), `route`.
- **Never log:** passwords, tokens, PII (email, phone, full name), answer keys,
  raw payment payloads.
- **Redact** sensitive fields via Pino redaction config.

---

## 6.6 Validation (Zod)

- **All API inputs validated with Zod** at the controller boundary.
- **All external data validated:** webhooks, third-party API responses,
  offline sync payloads, content pack manifests.
- **Schemas live in `packages/shared/schemas/`** so frontend and backend share
  them.
- **Types derived from schemas:** `type CreateQuestionDto = z.infer<typeof CreateQuestionSchema>`.
- **No manual type guards** when Zod can do it.
- **Error messages are user-safe.** No internal field names in user errors.

---

## 6.7 Database (Prisma)

- **Prisma schema is the source of truth** for the DB structure.
- **Model names:** PascalCase in Prisma (`User`, `QuestionVersion`).
  Table names snake_case via `@@map`.
- **Column names:** camelCase in Prisma, snake_case via `@map`.
- **Every model has `id`, `createdAt`, `updatedAt`.**
- **No `select: *`** in hot paths. Select only needed fields.
- **No N+1 queries.** Use `include` or separate batched queries.
- **Transactions for multi-step writes.** Use `prisma.$transaction`.
- **No raw SQL** except documented cases (Section 4.8).
- **Migrations reviewed** by founder before merge.

---

## 6.8 API Client (Frontend)

- **Single API client in `lib/api/client.ts`** handles:
  - Base URL from env
  - Auth header injection
  - Refresh-on-401 logic
  - Response envelope unwrapping
  - Zod validation of responses
  - Error normalization to `ApiError`
- **Typed endpoint modules:** `lib/api/questions.ts`, `lib/api/attempts.ts`, etc.
- **React Query hooks** wrap endpoints: `useQuestions()`, `useSubmitAttempt()`.
- **No raw `fetch` in components.** Always via the client.

---

## 6.9 React / Next.js Rules

- **Server Components by default.** Add `"use client"` only when needed.
- **When to use Client Components:**
  - Local state (useState, useReducer)
  - Effects (useEffect)
  - Event handlers (onClick, onChange)
  - Browser APIs (localStorage, IndexedDB)
  - Third-party client-only libraries
- **No data fetching in Client Components** unless interactive (React Query).
- **Server Actions** for mutations from Server Components. Use sparingly.
- **Route groups** (`(auth)`, `(learner)`) organize by role/area.
- **Layouts** handle shared UI. **Pages** handle data fetching and composition.
- **Loading and error files** (`loading.tsx`, `error.tsx`) for each route group.
- **Metadata** exported from pages for SEO.

---

## 6.10 State Management (Zustand)

- **Global state only when needed.** Most state is server state (React Query)
  or URL state.
- **Stores in `stores/`**, one per domain: `useAuthStore`, `useOfflineStore`.
- **Actions defined in the store**, not called from components directly.
- **Selectors** to avoid re-renders: `useAuthStore(s => s.user)`.
- **No server data in Zustand.** Server data lives in React Query.

---

## 6.11 Styling (Tailwind)

- **Utility-first.** No custom CSS files except `globals.css`.
- **No inline `style`** unless dynamic values (e.g., progress bar width).
- **Design tokens** in `tailwind.config.ts` (colors, spacing, fonts).
- **shadcn/ui components** as the base for buttons, inputs, dialogs, etc.
- **Class order:** layout → spacing → typography → color → state → responsive.
- **Use `cn()`** utility for conditional classes.
- **Mobile-first.** Use `sm:`, `md:`, `lg:` breakpoints to scale up.
- **No arbitrary values** (`w-[437px]`) unless truly one-off. Use tokens.

---

## 6.12 Testing

### What to test
- **Critical paths** (100% coverage target):
  - Auth (signup, login, refresh, reset)
  - Attempt submission + scoring
  - Mastery computation
  - Payment webhook handling
  - Offline sync
  - Consent flow
- **Business logic** (high coverage):
  - Adaptive recommender
  - Content pack builder
  - Report generation
- **Utilities** (high coverage):
  - Date, currency, formatting helpers
- **Do NOT test:**
  - Trivial getters/setters
  - Third-party library behavior
  - UI markup (test behavior instead)

### Test structure
- **Arrange → Act → Assert** (AAA pattern)
- **One assertion per test** where possible
- **Descriptive test names:** `it('returns 403 when learner accesses another learner attempt')`
- **No shared mutable state between tests.**
- **Use factories** for test data (`makeUser()`, `makeQuestion()`).

### E2E (Playwright)
- Cover the full learner journey: signup → diagnostic → practice → CBT → payment
- Cover offline: download pack, go offline, submit attempts, come online, verify sync
- Run in CI on every PR

---

## 6.13 Git & Commits

- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `perf:`.
- **Commit message:** imperative, present tense, < 72 chars.
- **One logical change per commit.**
- **No commits with failing tests.**
- **No commits with lint errors.**
- **No secrets in commits.** Pre-commit hook scans.
- **Branch naming:** `feat/learner-diagnostic`, `fix/sync-idempotency`.
- **PR size:** < 500 lines changed. If larger, split.

---

## 6.14 Comments & Documentation

- **Code explains "how." Comments explain "why."**
- **No commented-out code.** Delete it; git remembers.
- **No obvious comments.** `// increment counter` is noise.
- **Document non-obvious decisions:** "We use a 14-day half-life for mastery
  decay because exam season is ~4 months."
- **JSDoc for exported functions** in `packages/shared`.
- **README per package** explaining its purpose and how to run it.
- **ADRs** (Architecture Decision Records) for significant decisions in `docs/adr/`.

---

## 6.15 Security-Critical Code

Extra rules for auth, payments, child data, and file handling:

- **Every line reviewed by founder** before merge. No exceptions.
- **Never trust client input.** Validate and authorize server-side.
- **Every resource access checks ownership.**
- **Use parameterized queries only.** (Prisma does this by default.)
- **No `eval`, no `new Function`, no dynamic `require`.**
- **No secrets in code or logs.**
- **Rate limit every public endpoint.**
- **Escape user content** in HTML rendering (React does this by default;
  never use `dangerouslySetInnerHTML` without sanitization).
- **No file uploads at MVP** (content is admin-authored only).

---

## 6.16 Performance Rules

- **No premature optimization.** Measure first.
- **Frontend bundle:** no dependency > 50KB gzipped without justification.
- **Images:** WebP, lazy-loaded, sized appropriately.
- **API:** p95 < 400ms for read endpoints, < 800ms for writes.
- **DB:** every query has an index for its `where` clause.
- **N+1 queries are bugs.** Fix before merging.
- **Content packs < 15 MB per subject** for low-data mode.
- **No blocking synchronous work** in request handlers.

---

## 6.17 Dependency Rules

- **No new dependency without founder approval.**
- **Prefer built-in Node.js APIs** over dependencies for simple tasks.
- **Prefer small, maintained libraries** over large frameworks.
- **Pin exact versions.** No `^` or `~` in `package.json`.
- **Audit dependencies monthly** (`pnpm audit`).
- **No dependencies with known critical CVEs.**

---

## 6.18 Environment & Configuration

- **All config via env vars.** Never hardcoded.
- **Env vars validated at boot** with Zod (`config/env.schema.ts`).
- **App crashes on startup if required env vars are missing.** Do not run
  half-configured.
- **`.env.example` committed** with placeholder values.
- **`.env` never committed.**
- **Secrets stored in Doppler/Infisical**, injected at deploy time.

---

## 6.19 Accessibility (A11y)

- **Semantic HTML** (`<button>`, `<nav>`, `<main>`).
- **Labels on all form inputs.**
- **Keyboard navigable.** Every interactive element reachable via Tab.
- **Focus states visible.**
- **Color contrast** meets WCAG AA.
- **Alt text** on all images.
- **ARIA only when semantic HTML isn't enough.**
- **Test with screen reader** at least once before launch.

---

## 6.20 Mobile-First Rules

Since most Nigerian learners will use phones:

- **Design for 360px width first.**
- **Touch targets ≥ 44px.**
- **No hover-only interactions.**
- **Test on low-end Android** (Tecno, Infinix, itel).
- **No heavy animations.** Prefer CSS transitions.
- **Font sizes ≥ 16px** for body text.
- **Input types correct** (`type="email"`, `inputMode="numeric"`).
- **Offline states visible.** Show sync status.

---

## 6.21 The Coding Golden Rules

1. **Strict TypeScript. No `any`.**
2. **Zod validates all inputs and external data.**
3. **Errors are typed and logged with context.**
4. **No `console.log`. Use the logger.**
5. **No raw `fetch` in components. Use the API client.**
6. **No N+1 queries. No `select: *`.**
7. **No hardcoded config. Env vars only.**
8. **Server Components by default.**
9. **Mobile-first. Test on real low-end devices.**
10. **Security-critical code gets manual review. Always.**
11. **Small files, small functions, small PRs.**
12. **If it's not tested, it's not done.**


# 7. SECURITY RULES — NEVER BREAK THESE

This section covers the security invariants of ExamSpring. These rules are
non-negotiable. If the AI agent cannot follow a rule, it must stop and ask
the founder.

Context: ExamSpring handles data about minors. A security incident is not
just a bug — it is a regulatory and reputational catastrophe. Treat every
rule here as a hard constraint.

---

## 7.1 OWASP API Top 10 (2023) — Mandatory Compliance

The API must be defended against all 10. Below is how each is handled.

### API1: Broken Object Level Authorization (BOLA)
**The #1 API risk. Must never occur.**

Rules:
- Every request that references a resource ID must verify the caller owns
  or has legitimate access to that resource.
- Authorization checks live in the **service layer**, not the controller.
- Never trust an ID in a request body or URL parameter.
- Never expose internal IDs that could be enumerated (use UUIDs, not
  sequential IDs).
- Every service method that reads/writes user data takes an explicit
  `userId` or `tenantId` and scopes the query.

Tested with negative tests:
- Learner A cannot access Learner B's attempt.
- Parent cannot access another parent's child.
- Teacher cannot access a cohort they don't own.
- Anyone not in a tenant cannot access tenant data.

### API2: Broken Authentication
- Passwords hashed with bcrypt (cost 12).
- Refresh tokens are opaque, stored hashed in DB, rotated on use.
- Access tokens short-lived (15 min).
- Rate limit login and password reset endpoints.
- No user enumeration: same response for valid/invalid email on reset.
- Failed login attempts tracked; lockout after 10 failures in 15 min.
- Sessions revocable by user; all revoked on password change.

### API3: Broken Object Property Level Authorization
- Never return fields the caller shouldn't see (mass assignment protection).
- DTOs use explicit allow-lists of fields (via Zod).
- Sensitive fields (`password_hash`, `answer_key`) never in API responses.
- Question `answer_key` only returned to admin/reviewer, never to learners.
- Learner responses to attempts do not include the answer key until after
  submission.

### API4: Unrestricted Resource Consumption
- Rate limits on every public endpoint (Redis-backed).
  - Auth endpoints: 5 req/min per IP
  - Content read: 60 req/min per user
  - Attempt submission: 30 req/min per user
  - Tutor: 20 req/day per learner (Phase 2)
- Pagination enforced. No endpoint returns unbounded lists.
- Request body size limited (1 MB default).
- File uploads disabled at MVP.
- Query complexity limited (no deeply nested includes).

### API5: Broken Function Level Authorization
- Every controller route declares required roles explicitly.
- No route is public unless `@Public()` is applied and justified.
- Admin endpoints check `ADMIN` role at the guard.
- Teacher endpoints check `TEACHER` role AND cohort ownership.
- Never rely on UI hiding to enforce permissions.

### API6: Unrestricted Access to Sensitive Business Flows
- Diagnostic can only be taken once per learner per exam (unless admin resets).
- Practice submissions limited to reasonable rate.
- CBT attempts limited (e.g., 3 per day per subject).
- Payment webhooks idempotent + signature-verified.
- Tutor calls capped per day (Phase 2).

### API7: Server Side Request Forgery (SSRF)
- No user-supplied URLs are fetched server-side at MVP.
- If added later (e.g., publisher API), enforce allow-list of domains,
  block private IP ranges, use a dedicated egress proxy.

### API8: Security Misconfiguration
- CORS restricted to known origins (production domain + localhost in dev).
- Security headers via helmet: HSTS, X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, CSP.
- No default credentials anywhere.
- No debug endpoints in production.
- Error responses never leak stack traces, SQL, or internal IDs.
- `NODE_ENV=production` disables dev-only features.

### API9: Improper Inventory Management
- All endpoints under `/v1/`. Deprecated versions removed, not forgotten.
- API documented via OpenAPI (auto-generated from NestJS decorators).
- No shadow endpoints. If it's not in the router, it doesn't exist.

### API10: Unsafe Consumption of APIs
- All external API responses (Paystack, email, AI providers) are:
  - Validated with Zod schemas
  - Treated as untrusted
  - Timeout-protected (5s default)
  - Retried with backoff on transient failures
  - Logged (redacted) for debugging
- Webhook payloads verified via signature before processing.
- No external API called inside a DB transaction.

---

## 7.2 Authentication Rules

- Passwords: minimum 8 characters, bcrypt cost 12.
- Password reset tokens: single-use, 1-hour expiry, hashed in DB.
- Email verification required before full access.
- Refresh token rotation: old token revoked on use.
- Refresh token stored in `httpOnly` + `secure` + `sameSite=strict` cookie.
- Access token stored in memory (frontend), never localStorage.
- Logout revokes refresh token server-side.
- All sessions revoked on password change.
- No "remember me" longer than 30 days.

---

## 7.3 Authorization Rules

- Roles: `LEARNER`, `PARENT`, `TEACHER`, `ADMIN`.
- Every route declares roles explicitly.
- Object-level checks in service layer, not controller.
- Parent access to learner data requires verified `guardian_link`.
- Teacher access to learner data requires active cohort membership.
- Admin access audited (every admin action logged).
- No role escalation without explicit admin action.

---

## 7.4 Data Protection (NDPA Compliance)

Nigeria Data Protection Act 2023 governs. Specifically:

### Lawful basis
- Consent for children (under 18) requires parent/guardian consent.
- Legitimate interest for platform operation (security, fraud prevention).
- Contract for paid subscriptions.

### Children's data (special care)
- Age declared at signup.
- If under 18: parent/guardian email required for consent.
- Consent recorded with evidence (IP, user agent, timestamp, policy version).
- Consent can be revoked; revocation triggers data handling review.
- Data minimization: collect only what's needed.
- No behavioral advertising to minors. Ever.
- No third-party trackers on pages viewed by minors.

### Data subject rights (must be supported)
- **Access:** user can download all their data (self-service export).
- **Rectification:** user can correct their profile.
- **Erasure:** user can request deletion; processed within 30 days.
- **Restriction:** user can pause processing (account freeze).
- **Portability:** export in machine-readable format (JSON).
- **Objection:** user can opt out of non-essential processing.

### Retention
Per Section 5.16. No data kept longer than necessary.

### Processors
- All third parties (Paystack, Resend, OpenAI, hosting) must have
  Data Processing Agreements (DPAs) on file.
- No data transferred outside Nigeria without adequate safeguards
  (SCCs or adequacy decision).

### Breach response
- Any suspected breach: notify founder within 1 hour.
- Founder decides on NDPC notification within 72 hours.
- Incident log maintained.

---

## 7.5 Data Handling Rules

### In transit
- TLS 1.2+ everywhere. No plain HTTP in production.
- HSTS enabled with preload.
- Internal service calls (API ↔ DB) use TLS if crossing network boundary.

### At rest
- Postgres encrypted at rest (managed provider default).
- Object storage encrypted at rest (R2/S3 default).
- Backups encrypted.
- Secrets encrypted in secret manager.

### In code
- No PII in logs. Redact email, phone, name, DOB.
- No PII in error messages returned to clients.
- No PII in URLs (no email in query strings).
- No PII in analytics events (use hashed IDs).
- No PII in Sentry (use `beforeSend` to scrub).

### In the database
- PII columns identified and documented.
- Access to PII tables logged (audit).
- No PII in indexes that could leak via timing.
- Deletion cascades properly (no orphan PII).

---

## 7.6 Input Validation Rules

- All API inputs validated with Zod at the boundary.
- No string interpolation in SQL (Prisma handles this).
- No `eval`, `new Function`, dynamic `require`.
- HTML in user content escaped (React default).
- No `dangerouslySetInnerHTML` without sanitization (avoid entirely at MVP).
- File names sanitized before storage (no `../`).
- JSON payloads size-limited.
- Arrays length-limited.
- Numbers range-checked.

---

## 7.7 Output Encoding

- JSON responses: standard serialization (NestJS default).
- HTML: React escapes by default. Never bypass.
- CSV exports: escape commas, quotes, newlines.
- PDF exports: escape user content.
- Email templates: escape variables.

---

## 7.8 Secrets Management

- All secrets in Doppler or Infisical.
- Injected at deploy time via env vars.
- Never committed to git.
- `.env.example` has placeholders only.
- Pre-commit hook scans for secret patterns (API keys, tokens, private keys).
- Rotated quarterly or on suspected exposure.
- Different secrets per environment (dev, staging, prod).
- No sharing secrets via chat, email, or docs.

Secrets inventory:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET` (32+ bytes random)
- `JWT_REFRESH_SECRET`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `OPENAI_API_KEY` (Phase 2)
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `SENTRY_DSN`

---

## 7.9 Rate Limiting

Implemented in Redis, per-user and per-IP where applicable:

| Endpoint | Limit |
|---|---|
| `/auth/login` | 5/min per IP |
| `/auth/signup` | 3/min per IP |
| `/auth/reset-password` | 3/min per IP |
| `/auth/verify-email` | 5/min per IP |
| `/attempts` (POST) | 30/min per user |
| `/questions` (GET) | 60/min per user |
| `/tutor/*` (Phase 2) | 20/day per learner |
| `/webhooks/paystack` | 100/min per IP |
| Default | 100/min per user |

Response on limit: `429 Too Many Requests` with `Retry-After` header.

---

## 7.10 Webhook Security (Paystack)

- Verify signature using `PAYSTACK_WEBHOOK_SECRET`.
- Reject if signature invalid (return 401, log incident).
- Idempotent processing: `provider_event_id` unique constraint.
- Store raw payload before processing (immutable `payment_events`).
- Process via outbox, not synchronously.
- Never trust amount, currency, or user ID from webhook alone — cross-check
  against our records.
- Timeout: 10s max processing, then acknowledge and process async.

---

## 7.11 Offline Sync Security

Offline data is untrusted when it comes back.

- Attempt submissions from offline sync validated with Zod.
- Idempotency key required (prevents replay).
- Timestamp sanity checks (reject attempts dated in the future or > 30 days old).
- Question version referenced must exist and match what learner downloaded.
- Server re-scores; never trusts client-reported score.
- Sync payload size limited.
- Sync rate limited per device.

---

## 7.12 Child Safety (Beyond NDPA)

Specific to a platform used by minors:

- No direct messaging between users at MVP.
- No user-generated content visible to others at MVP.
- No profile pictures at MVP.
- Display name is chosen by learner; no forced real name.
- Tutor conversations private to learner (and logged for safety review).
- Parent sees progress, not conversations (privacy for the child).
- Any content flagged as unsafe triggers admin review.
- No location data collected.
- No contact list access.
- No advertising targeting minors.
- All moderation actions logged.

---

## 7.13 Logging & Audit

- All authentication events logged (login, logout, failed login, password change).
- All authorization failures logged (403 responses).
- All admin actions logged to `audit_log`.
- All data export/deletion requests logged.
- All consent changes logged.
- All payment events logged.
- Logs retention: 90 days hot, 1 year cold.
- Logs scrubbed of PII before storage.

---

## 7.14 Dependency Security

- `pnpm audit` runs in CI; fails on high/critical CVEs.
- Renovate or Dependabot enabled for updates.
- No dependencies with known unpatched critical CVEs.
- No abandoned packages (no commits in 2+ years) for security-critical roles.
- Lockfile committed and reviewed.

---

## 7.15 Incident Response

If a security incident occurs:

1. **Contain** — disable affected feature or endpoint.
2. **Assess** — what data, how many users, what severity.
3. **Notify** — founder within 1 hour.
4. **Remediate** — fix, deploy, verify.
5. **Report** — NDPC within 72 hours if breach affects personal data.
6. **Review** — post-mortem, no blame, add guardrail to prevent recurrence.
7. **Document** — incident log with timeline.

---

## 7.16 Security Testing

Before every production deploy:

- Lint + typecheck pass.
- Unit + integration tests pass.
- E2E tests pass.
- `pnpm audit` clean.
- Manual smoke test on staging.
- For security-critical changes (auth, payments, sync): founder reviews
  every line of the diff.

Once per quarter:
- Dependency audit.
- Access review (who has what).
- Secret rotation.
- Backup restore drill.

---

## 7.17 The Security Golden Rules

1. **Never trust the client.**
2. **Every resource access checks ownership.**
3. **Every input is validated with Zod.**
4. **Every external response is untrusted.**
5. **No PII in logs, URLs, or errors.**
6. **No secrets in code. Ever.**
7. **Rate limit everything public.**
8. **Idempotent everything that mutates.**
9. **Children's data is sacred. Minimize, protect, delete on request.**
10. **When in doubt, refuse and escalate.**

If the AI agent cannot satisfy any rule in this section, it must stop and
ask the founder before proceeding.


# 8. CHILD SAFETY & NDPA RULES

This section defines the specific flows, data handling, and compliance
requirements for operating a platform used by minors in Nigeria.

It is not legal advice. It is an engineering specification that implements
the Nigeria Data Protection Act 2023 (NDPA) and child-safety best practices.

The founder must have a Nigerian data-protection lawyer review the live
implementation before public launch.

---

## 8.1 Who Is a Child

Under NDPA and Nigerian law, anyone under 18 is a child.

ExamSpring will have users across ages:
- FSLC candidates: ~10–12 years old
- BECE candidates: ~13–15 years old
- WAEC/JAMB candidates: ~15–18 years old
- POST UTME candidates: ~17–20 years old
- Private candidates: any age

Therefore: **most of our users are children.** Treat the platform as a
children's product by default.

---

## 8.2 Age Declaration at Signup

At signup, the learner must declare their date of birth.

Rules:
- DOB is required.
- DOB is validated (reasonable range: 5–100 years old).
- The system computes `is_minor` at signup and on each birthday (via daily job).
- `is_minor` is stored on `users` and updated by a scheduled job.
- DOB is stored as a date (not a timestamp). It is PII.
- DOB is never displayed publicly. Never in URLs. Never in logs.
- DOB is never used for advertising or profiling.

---

## 8.3 Age Verification

Declared age is not verified age. For high-risk actions we apply
verification:

| Action | Verification required |
|---|---|
| Signup (declare DOB) | Self-declared |
| Payment | Guardian email required if minor |
| Parent view linking | Guardian email + verification |
| Data export request (minor) | Guardian confirmation |
| Data deletion request (minor) | Guardian confirmation |

Phase 2 may add stronger verification (e.g., ID upload) if regulator
guidance requires. At MVP, email-based guardian verification is the
baseline.

---

## 8.4 Guardian Consent Flow (Under-18 Learners)

This is the core NDPA compliance flow.

### Step 1 — Learner signs up
- Learner enters email, password, full name, DOB.
- System detects `is_minor = true`.
- Learner is created with status `PENDING_GUARDIAN_CONSENT`.
- Learner cannot access the platform beyond a "waiting for guardian"
  screen.

### Step 2 — Guardian email required
- Learner enters guardian's email during signup (or shortly after).
- System sends guardian an email:
  - Explains what ExamSpring is
  - Explains what data is collected
  - Links to the privacy notice (child-specific)
  - Provides an "Approve" and "Decline" link (single-use tokens)

### Step 3 — Guardian approves
- Guardian clicks link, verifies identity (email magic link).
- Guardian creates a minimal account (or links to existing).
- `consent_records` row created with:
  - `consent_type = DATA_PROCESSING`
  - `guardian_id`
  - `evidence` (IP, user agent, timestamp, policy version)
- Learner status becomes `ACTIVE`.
- Guardian is linked via `guardian_links`.

### Step 4 — Guardian can revoke
- Guardian can revoke consent at any time.
- Revocation sets `revoked_at` on the consent record.
- Learner account is suspended.
- Data handling review triggered (what to keep for legal, what to delete).

### Time limits
- Guardian consent link expires in 7 days.
- After expiry, learner can request a new link.
- After 30 days without consent, learner account is soft-deleted.

---

## 8.5 What We Tell the Guardian

The guardian consent email and privacy notice must clearly state:

- What data we collect about the child (name, email, DOB, exam target,
  answers, progress, study time)
- Why we collect it (to provide the learning service, measure progress,
  improve content)
- Who sees it (the learner, the guardian, teachers in the learner's cohort,
  internal staff on a need-to-know basis)
- Who never sees it (no advertisers, no data brokers, no third parties
  except processors listed in the privacy notice)
- How long we keep it (per retention schedule)
- How to access, correct, or delete it
- How to contact us (DPO email)
- That consent can be withdrawn at any time

Plain language. No legal jargon. In English at MVP; Nigerian language
translations in Phase 2.

---

## 8.6 Data Minimization for Minors

Collect only what is strictly needed:

### Collected
- Full name (for the learner's own account, guardian's account)
- Email (auth)
- Date of birth (age verification, exam eligibility)
- Exam target (product function)
- Answers and attempts (product function)
- Study time and progress (product function)
- Guardian email (consent)

### NOT collected
- Home address
- Phone number (Phase 2, only if SMS is added)
- Photo / profile picture (MVP has none)
- Location data
- Device identifiers beyond what's needed for session security
- Biometrics
- Government IDs (MVP)
- Health data
- Race, ethnicity, religion
- Any data not directly used by the product

---

## 8.7 Parent/Guardian Access Rules

A guardian linked to a learner can see:
- Mastery by subject and objective
- Study streak and time on task
- Recent activity (last 7 days)
- Diagnostic and CBT scores
- Progress reports (downloadable PDF)

A guardian **cannot** see:
- Individual answer responses in raw form (they see aggregated results)
- Tutor conversations (privacy for the child)
- Login times / session details (unless suspicious activity)
- Notes the learner writes to themselves
- Messages to teachers (Phase 2)

Rationale: the child is the primary user. The guardian is paying and
needs to see outcomes, not surveillance.

---

## 8.8 Teacher Access Rules

A teacher in a learner's cohort can see:
- Cohort-level aggregated mastery
- Individual learner's mastery within the cohort's scope
- Assignment completion status
- Flagged questions for review

A teacher **cannot** see:
- Learners outside their cohorts
- Tutor conversations
- Payment details
- Guardian contact info (unless the guardian initiates contact)
- Data from a learner who has left the cohort (after a grace period)

Cohort access is verified server-side on every request.

---

## 8.9 AI Tutor Rules for Minors (Phase 2)

When the AI tutor is enabled:

- Tutor uses only approved content. No open-web retrieval.
- Tutor refuses off-topic, harmful, or personal questions.
- Tutor never asks for personal information.
- Tutor never gives medical, legal, or psychological advice.
- Tutor conversations are logged (encrypted) for safety review.
- Flagged conversations go to human review queue within 24 hours.
- Guardian cannot read tutor conversations (privacy), but ExamSpring
  safety staff can review flagged ones.
- Learner can report a tutor response; report triggers review.
- Tutor is disabled for learners under 13 unless guardian opts in.

---

## 8.10 Data Subject Rights — Child-Specific Implementation

### Right of access
- Learner (or guardian) can request an export of all data.
- Export is generated within 7 days.
- Delivered as a JSON + PDF bundle to the guardian's email.
- Export expires after 7 days (storage key deleted).

### Right to rectification
- Learner can edit their name, email, DOB (DOB change triggers consent
  re-verification if crossing the minor/adult boundary).
- Guardian can edit learner's data via their account.

### Right to erasure
- Learner (with guardian if minor) can request account deletion.
- Deletion process:
  1. Account soft-deleted (30-day recovery window).
  2. After 30 days, PII purged.
  3. Attempts and mastery events anonymized (aggregate stats retained).
  4. Audit log retains the deletion event (no PII).
- Some data retained for legal/tax reasons (payment records for 7 years).

### Right to restriction
- Guardian can pause the account (freeze) without deleting.
- Frozen accounts retain data but cannot be used.

### Right to portability
- Export in machine-readable format (JSON).

### Right to object
- Guardian can opt out of non-essential processing.
- Essential processing (product function, security) cannot be opted out
  while using the service.

---

## 8.11 Retention for Minors

Special rule: **data about a minor is retained only as long as the minor
is using the platform or the guardian maintains the account.**

- If a learner account is inactive for 24 months and the guardian does not
  respond to a retention notice, PII is purged.
- Attempts and mastery events anonymized and retained for aggregate product
  analytics (5 years).
- Consent records retained 7 years after revocation (legal defense).

---

## 8.12 Cross-Border Data Transfer

NDPA restricts transfers of personal data outside Nigeria unless:
- The receiving country has adequate protection, OR
- The controller has put in place safeguards (standard contractual clauses,
  binding corporate rules), OR
- The data subject (or guardian) has given explicit consent.

MVP implications:
- Prefer Nigerian or African-region hosting where possible.
- If using EU/US providers (e.g., OpenAI, Resend), ensure DPAs are signed
  and disclose in the privacy notice.
- Log cross-border transfers in a register.

---

## 8.13 Data Protection Officer (DPO)

- NDPA requires certain controllers to appoint a DPO.
- ExamSpring will appoint one before public launch (can be the founder
  initially, or a contracted DPO service).
- DPO email published: `dpo@examspring.ng`
- DPO responsibilities:
  - Monitor compliance
  - Handle data subject requests
  - Liaise with NDPC
  - Maintain records of processing activities (ROPA)

---

## 8.14 Records of Processing Activities (ROPA)

Maintain a document listing:
- What data is processed
- Why (purpose)
- Legal basis
- Who has access
- Where stored
- How long retained
- Who it's shared with

This is a living document. Updated whenever a new processing activity is
added. Stored in `docs/compliance/ropa.md`.

---

## 8.15 Data Protection Impact Assessment (DPIA)

A DPIA is required when processing is likely to result in high risk to
data subjects. Processing children's data at scale qualifies.

Before public launch:
- Conduct a DPIA covering:
  - Data flows
  - Risks to children
  - Mitigations
  - Residual risk
  - Sign-off by DPO
- Store in `docs/compliance/dpia.md`.
- Review annually or when significant changes occur.

The founder is responsible for commissioning the DPIA. A lawyer or DPO
should review it.

---

## 8.16 Breach Notification

If a personal data breach occurs:

- Notify the DPO immediately (internal).
- DPO assesses risk to data subjects.
- If high risk: notify NDPC within 72 hours.
- If high risk to individuals: notify affected users (and guardians of
  minors) without undue delay.
- Document the breach: cause, scope, response, remediation.
- Post-incident review within 14 days.

Breach log in `docs/compliance/breach-log.md`.

---

## 8.17 Marketing & Communications Rules

- No marketing emails to minors.
- Marketing emails to guardians require separate consent.
- No behavioral advertising.
- No third-party ad trackers on any page.
- No social media pixels.
- Analytics must be privacy-preserving (aggregate, anonymized).
- Newsletter signups require explicit opt-in.

---

## 8.18 Cookies & Tracking

- Only essential cookies at MVP (auth session).
- No analytics cookies without consent.
- Cookie banner if non-essential cookies are added (Phase 2).
- No tracking pixels.
- No fingerprinting.

---

## 8.19 Third-Party Processors

Current processors and their roles:

| Processor | Purpose | Data shared |
|---|---|---|
| Paystack | Payments | Name, email, amount |
| Resend | Email delivery | Email address, name |
| Vercel | Hosting (frontend) | Request logs (no PII beyond IP) |
| Railway / Fly.io | Hosting (backend) | Request logs |
| Supabase / Neon / Railway | Managed Postgres | All stored data |
| Upstash | Redis | Session data, cache |
| Cloudflare R2 | Object storage | Content packs, exports |
| Sentry | Error tracking | Scrubbed error data |
| OpenAI (Phase 2) | AI tutor | Tutor prompts (scrubbed) |

Every processor must have a signed DPA. Log in
`docs/compliance/processors.md`.

---

## 8.20 Consent Record Schema

Every consent record captures:

```json
{
  "userId": "uuid of learner",
  "guardianId": "uuid of guardian (if minor)",
  "consentType": "DATA_PROCESSING",
  "grantedAt": "ISO timestamp",
  "revokedAt": null,
  "policyVersion": "2025-01-v1",
  "evidence": {
    "ip": "102.x.x.x",
    "userAgent": "...",
    "method": "email-magic-link",
    "emailSentTo": "guardian@example.com"
  }
}



# 9. AI TUTOR GUARDRAILS

This section defines how the AI tutor behaves. The tutor is Phase 2 (not MVP),
but the guardrails are locked now so no shortcuts are taken when it's built.

The tutor is a **constrained retrieval system**, not a general chatbot.
It exists to help learners understand approved content. It is not a search
engine, not an advice column, not a companion.

---

## 9.1 Purpose

The tutor helps a learner:
- Understand a concept tied to a syllabus objective
- Get a hint on a question they're stuck on
- See a worked example of a similar problem
- Understand why their answer was wrong (after submission)

The tutor does NOT:
- Give answers to questions the learner hasn't attempted
- Replace teachers or parents
- Discuss anything outside approved content
- Give advice on personal, medical, legal, or emotional topics

---

## 9.2 Architecture


# 10. WHAT THE AGENT MUST NEVER DO

This section is the explicit prohibition list. The AI agent reads this
before every task. These are hard rules, not suggestions.

If a task requires violating any rule here, the agent must STOP and ask
the founder. No exceptions. No "just this once." No "it's faster this way."

The cost of one violation (a data leak, a broken migration, a security
hole in a children's product) exceeds any speed gain.

---

## 10.1 Architecture Prohibitions

The agent must NEVER:

1. Split the monolith into microservices.
2. Introduce Kubernetes, Docker Swarm, or any orchestrator.
3. Add GraphQL.
4. Add WebSockets (SSE or polling only).
5. Add gRPC.
6. Add a message broker other than Redis + BullMQ (no Kafka, RabbitMQ, NATS).
7. Add a second database (no MongoDB, no DynamoDB, no Cassandra).
8. Add a separate vector database (pgvector only).
9. Add a second cache layer.
10. Add serverless functions outside the monorepo.
11. Add edge functions that bypass the API.
12. Deploy to a second cloud provider.
13. Add multi-region anything.
14. Build a custom API gateway.
15. Introduce event sourcing beyond the outbox pattern.
16. Introduce CQRS.
17. Introduce domain-driven design tactical patterns (aggregates, value objects) beyond what's already in the codebase.
18. Add a service mesh.
19. Add a sidecar pattern.
20. Add any infrastructure not listed in Section 3.

---

## 10.2 Dependency Prohibitions

The agent must NEVER:

1. Add a dependency without founder approval.
2. Add a state manager other than Zustand (no Redux, MobX, Recoil, Jotai).
3. Add an ORM other than Prisma (no TypeORM, Drizzle, Kysely, Sequelize).
4. Add a CSS framework other than Tailwind (no styled-components, Emotion, CSS Modules beyond Next.js defaults).
5. Add a test runner other than Vitest (no Jest, Mocha, Ava).
6. Add an E2E tool other than Playwright (no Cypress, Puppeteer).
7. Add an auth library (no NextAuth, Clerk, Auth0, Supabase Auth at MVP).
8. Add a form library other than React Hook Form.
9. Add a validation library other than Zod.
10. Add a date library other than `date-fns` (no moment, dayjs, luxon).
11. Add an HTTP client other than native `fetch` (no axios, got, superagent).
12. Add a chart library other than Recharts.
13. Add a UI kit other than shadcn/ui + Tailwind.
14. Add an icon library other than Lucide.
15. Add a logging library other than Pino.
16. Add an analytics library that isn't privacy-preserving.
17. Add any package that hasn't had a release in 2+ years.
18. Add any package with a known critical CVE.
19. Add any package > 50KB gzipped without justification.
20. Add `lodash` (use native JS).

---

## 10.3 Code Prohibitions

The agent must NEVER:

1. Use `any` in TypeScript.
2. Use `as` casting without a documented reason.
3. Use non-null assertion (`!`) without a runtime check.
4. Use `export default` except in Next.js pages/layouts.
5. Use `console.log` in committed code.
6. Use `eval`, `new Function`, or dynamic `require`.
7. Use `dangerouslySetInnerHTML`.
8. Write a function longer than 50 lines.
9. Write a file longer than 400 lines.
10. Nest deeper than 4 levels.
11. Pass more than 4 positional parameters.
12. Use boolean parameters that change behavior.
13. Use `var`.
14. Use `==` (use `===`).
15. Use `for...in` on arrays.
16. Mutate function arguments.
17. Use `Date.now()` for timestamps that need timezone correctness (use `new Date().toISOString()`).
18. Use floating-point math for money (use integer kobo).
19. Store dates as strings in the DB.
20. Use `SELECT *` in hot paths (use explicit field selection).
21. Write raw SQL outside the documented exceptions.
22. Write a `findMany()` without a `where` clause.
23. Write a `delete()` without a `where` clause.
24. Comment out code (delete it; git remembers).
25. Write obvious comments that restate the code.
26. Leave `TODO` comments without a linked issue.
27. Leave debug logs in committed code.
28. Catch errors silently.
29. Swallow promise rejections.
30. Use `async` without `await`.
31. Use `setTimeout` for scheduling business logic (use BullMQ).
32. Use `setInterval` in request handlers.
33. Use global mutable state.
34. Write to `localStorage` for auth tokens.
35. Store secrets in code or config files committed to git.

---

## 10.4 Database Prohibitions

The agent must NEVER:

1. Edit a migration after it's merged.
2. Write a down migration for production.
3. Drop a column in the same deploy as code removal.
4. Drop a table without founder approval and a backup.
5. Add a nullable FK unless the relationship is truly optional.
6. Skip RLS on a tenant-scoped table.
7. Query without tenant scoping when tenant-scoped.
8. Store PII in indexes.
9. Store PII in logs.
10. Store passwords in plaintext or reversible form.
11. Store answer keys in client-accessible tables.
12. Bypass Prisma for routine writes.
13. Use database triggers for business logic (use application code + outbox).
14. Use `TRUNCATE` in production.
15. Run `prisma migrate reset` on any environment other than local.
16. Modify production data directly without an audit trail.
17. Write a query that returns unbounded rows.
18. Store binary blobs in Postgres (use R2).
19. Store files > 1 MB in Postgres.
20. Use `jsonb` for data that should be relational.

---

## 10.5 Security Prohibitions

The agent must NEVER:

1. Trust client input without validation.
2. Skip authorization checks on a resource.
3. Rely on UI to enforce permissions.
4. Log PII (name, email, phone, DOB, answers).
5. Log secrets or tokens.
6. Return stack traces to clients.
7. Return internal IDs that could be enumerated.
8. Use sequential IDs for anything user-visible.
9. Disable CORS protections without approval.
10. Disable Helmet or security headers.
11. Skip signature verification on webhooks.
12. Process a webhook non-idempotently.
13. Call external APIs without timeout.
14. Call external APIs inside a DB transaction.
15. Trust external API responses without schema validation.
16. Add a new external API integration without a DPA review.
17. Store refresh tokens in localStorage.
18. Store access tokens in cookies.
19. Skip rate limiting on a public endpoint.
20. Skip idempotency on a mutating endpoint.
21. Allow user enumeration on auth endpoints.
22. Reveal whether an email is registered.
23. Allow password reset links to be reused.
24. Allow refresh token reuse.
25. Skip email verification.
26. Allow weak passwords.
27. Skip password hashing.
28. Use a weak hashing algorithm (MD5, SHA1).
29. Store secrets in environment variables committed to git.
30. Commit `.env` files.

---

## 10.6 Child Safety Prohibitions

The agent must NEVER:

1. Allow a minor to sign up without guardian consent flow.
2. Allow a minor to pay without guardian email on file.
3. Show a minor's PII to anyone other than the minor, their guardian, or an authorized admin.
4. Show tutor conversations to a guardian.
5. Show individual answer responses to a guardian (only aggregates).
6. Allow teachers to access learners outside their cohorts.
7. Collect data not used by the product.
8. Add third-party trackers.
9. Add behavioral advertising.
10. Add social features for minors (friends, DMs) at MVP.
11. Add profile pictures for minors at MVP.
12. Add location collection.
13. Add contact list access.
14. Add biometric collection.
15. Add voice recording without explicit guardian consent.
16. Store data about a minor beyond the retention schedule.
17. Ignore a deletion request.
18. Ignore a consent revocation.
19. Send marketing to a minor.
20. Use dark patterns in the consent flow.
21. Bury the privacy notice.
22. Make deletion hard to find.
23. Make export hard to find.
24. Ship without a privacy notice.
25. Ship without a DPIA.

---

## 10.7 Content Prohibitions

The agent must NEVER:

1. Scrape WAEC, JAMB, NECO, NABTEB, or any exam body's content.
2. Generate exam questions with AI and publish them.
3. Publish a question without human review.
4. Publish a question without provenance.
5. Publish a question without an objective tag.
6. Modify an approved question in place (create a new version).
7. Delete an approved question used in attempts (retire it).
8. Claim affiliation with any exam body.
9. Imply official endorsement without a written agreement.
10. Reproduce copyrighted material without a license.
11. Use images without a license.
12. Use past questions that are not rights-cleared.
13. Publish content that isn't age-appropriate.
14. Publish content with errors in the answer key.
15. Ignore a content takedown request.

---

## 10.8 AI Prohibitions

The agent must NEVER:

1. Build the AI tutor before the approved corpus exists.
2. Let the tutor use open-web retrieval.
3. Let the tutor use general LLM knowledge.
4. Let the tutor answer off-syllabus questions.
5. Let the tutor give the answer key to an unattempted question.
6. Let the tutor ask for personal information.
7. Let the tutor give medical, legal, or psychological advice.
8. Let the tutor produce code or URLs.
9. Let the tutor engage in roleplay.
10. Let the tutor claim to be human.
11. Let the tutor claim exam body affiliation.
12. Skip citations in tutor responses.
13. Skip logging of tutor interactions.
14. Skip the human escalation queue.
15. Skip the red-team suite before a model change.
16. Ship the tutor without a kill switch.
17. Ship the tutor without cost caps.
18. Ship the tutor without the safety message.
19. Ship the tutor to under-13 users without guardian opt-in.
20. Let the AI score answers (deterministic scoring only).

---

## 10.9 Process Prohibitions

The agent must NEVER:

1. Merge a PR without founder review.
2. Merge a PR with failing tests.
3. Merge a PR with failing lint or typecheck.
4. Merge a PR with `any` in new code.
5. Merge a PR that touches security-critical code without explicit review.
6. Merge a PR that modifies the SKILL.md without approval.
7. Merge a PR that adds a dependency without approval.
8. Commit directly to `main`.
9. Force-push to a shared branch.
10. Rewrite history on a merged branch.
11. Commit secrets.
12. Commit generated files (build artifacts, coverage reports).
13. Skip the pre-commit hook (`--no-verify`).
14. Skip CI.
15. Deploy to production without a staging test.
16. Deploy on a Friday afternoon.
17. Deploy without a rollback plan.
18. Deploy without a smoke test.
19. Ignore a monitoring alert.
20. Ship a feature behind a flag without documenting the flag.

---

## 10.10 Product Prohibitions

The agent must NEVER:

1. Build a feature not in Section 2 (MVP Scope).
2. Build a feature "while I'm here."
3. Build a feature because it's easy.
4. Build a feature because the agent thinks it's useful.
5. Build for scale before product-market fit.
6. Build for a hypothetical user.
7. Build for a hypothetical country.
8. Build for an exam not in Section 1.
9. Build a native mobile app at MVP.
10. Build video lessons.
11. Build live classes.
12. Build gamification (badges, leaderboards).
13. Build social features.
14. Build a marketplace.
15. Build a publisher API at MVP.
16. Build a public API at MVP.
17. Build an admin mobile app.
18. Build a desktop app.
19. Build a browser extension.
20. Build a chatbot outside the tutor.
21. Build multi-language support at MVP.
22. Build multi-currency at MVP.
23. Build offline video.
24. Build push notifications at MVP.
25. Build SMS notifications at MVP.

---

## 10.11 Language & Communication Prohibitions

The agent must NEVER:

1. Claim to be affiliated with WAEC, JAMB, NECO, NABTEB, or any exam body.
2. Claim official endorsement without written agreement.
3. Use language that implies guaranteed exam success.
4. Promise outcomes ("you will pass").
5. Use fear-based marketing.
6. Compare unfavorably to named competitors.
7. Make claims about competitors' products.
8. Use legal jargon in user-facing copy.
9. Use technical jargon in user-facing copy.
10. Use language that isn't age-appropriate.
11. Use dark patterns in any UI.
12. Use manipulative copy.
13. Use fake urgency ("only 2 seats left").
14. Use fake scarcity.
15. Use fake social proof.

---

## 10.12 The Meta-Rule

**When in doubt, ask the founder.**

The agent must not interpret rules creatively. If a task seems to require
breaking a rule here, it doesn't — it means the task is wrong, or the
rule needs to change with founder approval.

Speed is not worth a security hole.
Speed is not worth a data leak.
Speed is not worth a child's privacy.
Speed is not worth a legal violation.

**The founder's judgment overrides this section only when explicitly stated
in writing (a message in the repo or a task instruction that says
"override Section X because Y").**


# 11. DEFINITION OF DONE

This section defines what "done" means at every level: a task, a feature,
a phase, and the MVP. Nothing is done until it meets the criteria here.

The agent must not mark work complete unless it satisfies the relevant
Definition of Done. "It works on my machine" is not done.

---

## 11.1 Definition of Done — A Task

A task (a single unit of work assigned to the agent) is done when ALL of
the following are true:

### Code
- [ ] Code is written in TypeScript with strict mode
- [ ] No `any` types
- [ ] No `console.log`
- [ ] No commented-out code
- [ ] No `TODO` without a linked issue
- [ ] File length < 400 lines
- [ ] Function length < 50 lines
- [ ] Follows naming conventions (Section 6.15)
- [ ] Follows the architecture rules (Section 4)

### Validation
- [ ] All inputs validated with Zod
- [ ] All API responses follow the envelope (Section 4.4)
- [ ] All mutating endpoints accept an `Idempotency-Key`
- [ ] All errors use the shared error codes

### Security
- [ ] All routes declare auth + roles
- [ ] Object-level authorization checked in the service layer
- [ ] No PII in logs
- [ ] No secrets in code
- [ ] Rate limiting applied (if public endpoint)

### Tests
- [ ] Unit tests written for business logic
- [ ] Integration tests written for the endpoint or flow
- [ ] Negative tests written (unauthorized, invalid input, not found)
- [ ] E2E test added if user-facing
- [ ] All tests pass locally
- [ ] All tests pass in CI

### Quality
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] No new warnings
- [ ] No new dependencies without approval
- [ ] No failing `pnpm audit`

### Documentation
- [ ] Code comments explain "why," not "how"
- [ ] JSDoc on any exported function in `packages/shared`
- [ ] ADR written if the task involved an architectural decision
- [ ] README updated if a new package or script was added

### Review
- [ ] PR opened with a clear description
- [ ] PR is < 500 lines changed
- [ ] PR references the task/issue
- [ ] Founder has reviewed and approved
- [ ] CI is green
- [ ] Branch merged (squash)

### Deployment
- [ ] Deployed to staging
- [ ] Smoke-tested on staging
- [ ] No new errors in Sentry
- [ ] No new warnings in logs
- [ ] Feature flag set (if applicable)

---

## 11.2 Definition of Done — A Feature

A feature (a user-facing capability composed of multiple tasks) is done
when ALL of the following are true, IN ADDITION to the task-level DoD:

### Product
- [ ] Feature matches the spec in Section 2 (MVP Scope)
- [ ] Acceptance criteria from the user story are met
- [ ] Feature works on mobile (360px width) and desktop
- [ ] Feature works on low-end Android (tested on real device or emulator)
- [ ] Feature works offline (if applicable to the feature)
- [ ] Empty states designed and implemented
- [ ] Loading states designed and implemented
- [ ] Error states designed and implemented

### UX
- [ ] Copy is reviewed for age-appropriateness
- [ ] Copy is reviewed for plain language
- [ ] No dark patterns
- [ ] Accessible (keyboard navigable, screen-reader friendly, WCAG AA contrast)
- [ ] Touch targets ≥ 44px
- [ ] Font sizes ≥ 16px for body text

### Data
- [ ] Database migrations written and tested
- [ ] Migrations reviewed by founder
- [ ] RLS policies added (if tenant-scoped)
- [ ] Seed data added (if needed)
- [ ] Backfill migration written (if modifying existing data)

### Observability
- [ ] Logs added for significant events
- [ ] Metrics added (if the feature has a success metric)
- [ ] Alerts configured (if the feature can fail silently)
- [ ] Feature flag added (if the feature is risky or experimental)

### Performance
- [ ] API p95 < 400ms for reads, < 800ms for writes
- [ ] No N+1 queries
- [ ] Frontend bundle size not regressed > 10%
- [ ] Content pack size within budget (if applicable)

### Compliance
- [ ] PII handling reviewed against Section 8
- [ ] Consent flow updated (if the feature touches minor data)
- [ ] Data retention updated (if the feature adds new data)
- [ ] ROPA updated (if the feature adds new processing)

### Documentation
- [ ] User-facing help text (if needed)
- [ ] Internal documentation updated
- [ ] Release notes written

### Launch
- [ ] Feature flag enabled for staging
- [ ] Tested end-to-end on staging
- [ ] Founder demoed the feature
- [ ] Rollback plan documented
- [ ] Feature flag enabled for production (if approved)

---

## 11.3 Definition of Done — A Phase

A phase (Month 1, Month 2, etc.) is done when ALL of the following are true:

### Deliverables
- [ ] All features in the phase are complete (Section 11.2)
- [ ] All tasks are closed
- [ ] No open P0/P1 bugs

### Quality
- [ ] Test coverage on critical paths ≥ 70%
- [ ] No known security issues
- [ ] No known data integrity issues
- [ ] Dependency audit clean
- [ ] All migrations applied cleanly to staging and production

### Operations
- [ ] Monitoring dashboards updated
- [ ] Alerts tested
- [ ] Backups verified (restore drill passed)
- [ ] Runbooks updated
- [ ] On-call rotation documented (even if it's just the founder)

### Metrics
- [ ] Phase success metrics defined
- [ ] Metrics instrumented
- [ ] Baseline captured

### Documentation
- [ ] Phase retrospective written
- [ ] Learnings added to SKILL.md (if applicable)
- [ ] Next phase planned

### Demo
- [ ] Live demo delivered to founder
- [ ] Feedback captured
- [ ] Adjustments planned

---

## 11.4 Definition of Done — The MVP

The MVP is done when ALL of the following are true:

### Product Scope
- [ ] All MVP features from Section 2 are live
- [ ] All out-of-scope items are truly out (verified)
- [ ] No half-built features in production

### Users
- [ ] At least 1 pilot tutorial centre signed
- [ ] 20–50 real learners onboarded
- [ ] Learners have completed at least one diagnostic
- [ ] Learners have completed at least one practice session
- [ ] Learners have completed at least one CBT simulation

### Content
- [ ] At least 300 approved questions in WAEC/JAMB Math
- [ ] At least 300 approved questions in WAEC/JAMB English
- [ ] Every question has provenance
- [ ] Every question has an objective tag
- [ ] Every question has been reviewed by a human

### Quality
- [ ] Zero known security issues
- [ ] Zero known data integrity issues
- [ ] Zero child safety incidents
- [ ] Test coverage on critical paths ≥ 70%
- [ ] Crash-free sessions ≥ 99.5%
- [ ] Offline sync success ≥ 99%

### Compliance
- [ ] NDPA compliance reviewed by a Nigerian lawyer
- [ ] Privacy notice published
- [ ] Consent flow tested end-to-end
- [ ] Data export tested end-to-end
- [ ] Data deletion tested end-to-end
- [ ] DPIA completed and signed off
- [ ] DPO appointed
- [ ] Processors have signed DPAs
- [ ] ROPA published internally

### Operations
- [ ] Production monitoring live
- [ ] Alerts configured and tested
- [ ] Backups running and verified
- [ ] Incident response plan documented
- [ ] Rollback procedure tested

### Payments
- [ ] Paystack integration live
- [ ] Webhook reconciliation working
- [ ] Receipts sending
- [ ] Subscription entitlements enforced
- [ ] Refund flow documented

### Metrics
- [ ] All success metrics instrumented
- [ ] Baseline captured
- [ ] Dashboard live

### Documentation
- [ ] READMEs updated
- [ ] ADRs complete
- [ ] Runbooks complete
- [ ] Onboarding doc for future contributors

### Go-Live Checklist
- [ ] Domain configured
- [ ] SSL working
- [ ] Email deliverability tested
- [ ] Analytics working
- [ ] Sentry working
- [ ] Uptime monitoring working
- [ ] Status page live
- [ ] Support email live
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] Child-friendly help page live

---

## 11.5 What "Done" Is NOT

The agent must not consider a task done when:

- It "works on my machine"
- It works in dev but not staging
- Tests pass but coverage is missing
- Lint passes but the code smells
- The feature works but has no empty/loading/error states
- The endpoint works but has no auth
- The endpoint works but has no rate limit
- The feature works online but not offline (when it should)
- The data is stored but not retained correctly
- The UI works but isn't accessible
- The UI works on desktop but not mobile
- The code is written but not reviewed
- The code is reviewed but not deployed
- The code is deployed but not smoke-tested
- The feature is deployed but not behind a flag (when risky)
- The feature is live but has no metrics
- The feature is live but has no docs

---

## 11.6 Bug Severity Definitions

For clarity when triaging:

- **P0 — Critical:** Security breach, data loss, child safety incident,
  payment failure, platform down. Fix immediately. All hands.
- **P1 — High:** Major feature broken for all users, data inconsistency,
  auth broken. Fix within 24 hours.
- **P2 — Medium:** Feature broken for some users, workaround exists.
  Fix within 1 week.
- **P3 — Low:** Cosmetic, edge case, minor UX. Fix when scheduled.
- **P4 — Trivial:** Typos, minor improvements. Backlog.

---

## 11.7 Definition of Done — The Golden Rules

1. **Tested, reviewed, deployed, monitored, documented — all five.**
2. **No feature ships without a rollback plan.**
3. **No feature ships without observability.**
4. **No feature ships without mobile verification.**
5. **No security-critical code ships without manual review.**
6. **No data change ships without a migration.**
7. **No user-facing change ships without empty/loading/error states.**
8. **No feature ships if it violates Section 10.**
9. **"Almost done" is not done.**
10. **If it can't be demoed, it isn't done.**

---

## 11.8 The MVP Success Criteria (Restated)

For absolute clarity, the MVP is successful when:

- Real learners are using it daily
- Real content is being consumed
- Real payments are being processed
- Real progress is being measured
- Real guardians are seeing reports
- Real teachers are running cohorts
- No child safety incidents
- NDPA compliance verified
- Unit economics are measurable
- The team knows what to build next

Everything else is Phase 2.

# 12. CURRENT SPRINT & NEXT ACTIONS

This is the only section that changes frequently. It tells the AI agent
what to work on right now. Everything else in the SKILL.md is stable.

The founder updates this section at the start of every sprint (every 2 weeks).

---

## 12.1 Current Phase

**Phase 1 — Foundation (Weeks 1–4)**

Goal: Stand up the platform skeleton with auth, roles, and the database.

By end of Phase 1, we will have:
- A live staging environment
- A working signup/login flow (email/password)
- Roles: learner, parent, teacher, admin
- Consent flow for under-18 learners
- Database with all core tables migrated
- Basic app shell (empty dashboards per role)
- CI/CD passing on every PR
- Sentry, logging, and uptime monitoring live

We will NOT have:
- Any content
- Any practice or CBT flow
- Any payments
- Any AI tutor
- Any offline packs

---

## 12.2 Current Sprint (Sprint 1 — Week 1–2)

### Sprint Goal
A user can sign up, verify email, log in, and land on an empty dashboard
matching their role — deployed to staging.

### Sprint Tasks (in order)

**Task 1 — Repo & Monorepo Setup**
- Initialize pnpm workspace with Turborepo
- Create `frontend` (Next.js 14)
- Create `backend` (NestJS)
- Create `packages/shared`, `packages/db`
- Add ESLint, Prettier, Husky, lint-staged
- Add `.cursorrules` and `CLAUDE.md` at root
- Add `.env.example`
- Verify `pnpm dev` runs both apps

**Task 2 — Local Infrastructure**
- Add `docker-compose.yml` with Postgres + Redis
- Add scripts to run/stop
- Verify API connects to both

**Task 3 — Prisma Setup**
- Initialize Prisma in `packages/db`
- Add `User` model (Section 5.1)
- Add `Session` model
- Add `PasswordReset` model
- Add `ConsentRecord` model
- Add `GuardianLink` model
- Write first migration
- Add seed script with 1 admin user

**Task 4 — Auth Backend**
- `POST /v1/auth/signup`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/reset-password/confirm`
- `POST /v1/auth/verify-email`
- JWT access + refresh token rotation
- bcrypt hashing
- Rate limiting on auth endpoints
- Zod validation
- Response envelope
- Integration tests for each endpoint

**Task 5 — Consent Flow Backend**
- `POST /v1/auth/signup` detects `isMinor` from DOB
- If minor: create user with `PENDING_GUARDIAN_CONSENT`
- `POST /v1/consent/guardian-invite` — sends email to guardian
- `POST /v1/consent/guardian-approve` — single-use token
- `ConsentRecord` written with evidence
- Integration tests

**Task 6 — Email Service**
- Resend integration
- React Email templates: welcome, verify-email, reset-password,
  guardian-invite, guardian-approved
- Outbox pattern for email sending
- BullMQ worker for outbox
- Integration test for outbox

**Task 7 — Auth Frontend**
- `/signup` page
- `/login` page
- `/verify-email` page
- `/reset-password` pages
- `/consent/pending` page (learner waiting for guardian)
- `/consent/approve` page (guardian)
- Zod-validated forms
- API client with refresh-on-401
- Zustand auth store
- Error and loading states
- Mobile-first layout

**Task 8 — Role Dashboards (Empty Shells)**
- `/learner` — empty dashboard
- `/parent` — empty dashboard
- `/teacher` — empty dashboard
- `/admin` — empty dashboard
- Route groups by role
- Role-based redirect after login
- Logout button

**Task 9 — CI/CD**
- GitHub Actions workflow:
  - Lint
  - Typecheck
  - Test
  - Build
  - Deploy to staging (Vercel + Railway)
- Preview deployments on PRs
- Staging URL posted in PR comment

**Task 10 — Observability**
- Pino logger configured
- Sentry configured (API + Web)
- Health endpoint `/v1/health`
- Uptime monitoring (Better Stack or UptimeRobot)
- Basic request logging with requestId

**Task 11 — Security Baseline**
- Helmet configured
- CORS restricted
- Rate limiting (Redis)
- Request body size limit
- Error filter (no stack traces)
- PII redaction in logs

**Task 12 — Documentation**
- Root README
- API README
- Web README
- ADRs: monorepo, NestJS, Prisma, JWT auth, outbox
- ROPA skeleton in `docs/compliance/`

### Sprint Acceptance Criteria
- [ ] A new user can sign up, verify email, and log in
- [ ] A minor signup triggers guardian consent flow
- [ ] Guardian can approve via email link
- [ ] Role-based dashboard renders after login
- [ ] All API endpoints have integration tests
- [ ] CI/CD passes and deploys to staging
- [ ] Sentry captures a test error
- [ ] No PII in logs (verified by inspection)
- [ ] Staging URL works on a real phone

---

## 12.3 Sprint 2 (Preview — Week 3–4)

Not started yet. Will be filled in at end of Sprint 1.

Planned focus:
- Curriculum data model + seed
- Admin content review console (basic)
- Question CRUD
- First 50 questions loaded
- Learner diagnostic flow (basic)
- Mastery event log (first version)

---

## 12.4 The Next 6 Weeks (Roadmap)

| Week | Focus |
|---|---|
| 1–2 | Foundation (Sprint 1) |
| 3–4 | Curriculum + question bank (Sprint 2) |
| 5–6 | Diagnostic + mastery + practice loop (Sprint 3) |
| 7–8 | CBT simulation + offline packs (Sprint 4) |
| 9–10 | Teacher/parent views + reports (Sprint 5) |
| 11–12 | Payments + notifications + hardening (Sprint 6) |

Then pilot launch in Month 4.

---

## 12.5 The Next 9 Days (Compressed Slice)

Since the founder wants a 9-day working slice, here is the exact
breakdown. The agent works on one day at a time.

### Day 1 — Repo + Infrastructure
- Monorepo setup
- Docker Compose (Postgres, Redis)
- Prisma init
- First migration (users, sessions, consent)
- `.cursorrules`, `CLAUDE.md`, `SKILL.md` at root

### Day 2 — Auth Backend
- Signup, login, refresh, logout
- JWT + bcrypt
- Rate limiting
- Zod validation
- Integration tests

### Day 3 — Consent + Email
- Minor detection
- Guardian invite + approve
- Resend integration
- Outbox + BullMQ
- Email templates

### Day 4 — Auth Frontend
- Signup, login, verify, reset pages
- API client
- Zustand auth store
- Role redirect

### Day 5 — Role Dashboards + CI/CD
- Empty dashboards per role
- GitHub Actions
- Staging deploy (Vercel + Railway)
- Sentry + logging

### Day 6 — Curriculum + Questions (Backend)
- Exam, Subject, Objective models
- Question + QuestionVersion models
- Seed: WAEC Math objectives (subset)
- Seed: 15 Math questions (founder-written)
- Admin endpoints for question CRUD

### Day 7 — Learner Diagnostic (Backend + Frontend)
- Diagnostic attempt creation
- Server-side scoring
- Mastery event log
- Diagnostic UI (mobile-first)
- Result screen with mastery bars

### Day 8 — Practice Loop (Frontend + Backend)
- Recommended next objective (deterministic)
- Practice session UI
- Answer submission (idempotent)
- Explanation display
- Mastery update

### Day 9 — Polish + Demo
- Empty/loading/error states
- Mobile verification on real device
- README + demo script
- Live demo to founder
- Retrospective

### What You Have at End of Day 9
- A live PWA where a learner can:
  - Sign up (with guardian consent if minor)
  - Take a real Math diagnostic
  - See mastery scores
  - Practice recommended objectives
  - See progress update
- All deployed, monitored, tested.
- ~15 real questions written by the founder.
- The full backend (auth, curriculum, questions, attempts, mastery).
- The foundation to build everything else.

### What You Do NOT Have at End of Day 9
- Payments
- Offline packs
- CBT timer
- Parent/teacher dashboards (beyond empty shells)
- AI tutor
- Content for other exams
- Mobile native app

Those come in Weeks 2–12.

---

## 12.6 Blockers & Questions for the Founder

The agent must escalate to the founder when:

- A task requires violating Section 10
- A task is ambiguous and the agent cannot resolve it from the SKILL.md
- A dependency needs to be added
- A schema change is needed
- A security-critical decision is needed
- A compliance question arises
- A content question arises
- A product scope question arises

Founder responds within 24 hours.

---

## 12.7 Sprint Retrospective Template

At the end of every sprint, the founder and agent fill out:

- What shipped
- What slipped
- What broke
- What was learned
- What to change in the SKILL.md
- What to change in the process
- What to change in the next sprint

Stored in `docs/retros/sprint-N.md`.

---

## 12.8 The Only Constant

Everything in Sections 1–11 is stable. This section (12) changes every
two weeks. The agent must always read the latest version of Section 12
before starting work.

The founder is responsible for keeping Section 12 accurate and current.

When in doubt about what to work on: read Section 12. If Section 12
doesn't answer it, ask the founder.

---

## 12.9 The Starting Command

When the agent begins work, it reads:

1. SKILL.md (this file) — all sections
2. `.cursorrules` or `CLAUDE.md` — condensed rules
3. Section 12.2 — current sprint tasks
4. The current task in the task list

Then it starts with Task 1 of the current sprint, unless told otherwise.

No work begins without reading these first.

---

## 12.10 The Final Rule

**The SKILL.md is a living document.**

If something in it is wrong, it gets fixed — with founder approval.
If something is missing, it gets added — with founder approval.
If something conflicts with reality, reality wins — and the SKILL.md is
updated to match.

But it is never ignored.

A project without a SKILL.md is a project that drifts.
A project that ignores its SKILL.md is worse — it pretends to have
discipline while having none.

Read it. Follow it. Update it when it's wrong. Never bypass it.
````
