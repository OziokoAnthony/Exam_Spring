# 0001: pnpm + Turborepo monorepo

## Status

Accepted (2026-10-02)

## Context

ExamSpring is a mobile-first exam-prep platform with a Next.js frontend, a
NestJS backend, and shared code (Zod schemas, types, constants, Prisma
package). The team is small and needs one repo, one install, one CI pipeline.

## Decision

Use a pnpm workspace with Turborepo for task orchestration.

- `frontend/` — Next.js 14 (App Router)
- `backend/` — NestJS API
- `packages/shared` — Zod schemas, types, constants
- `packages/db` — Prisma schema, migrations, seed

## Consequences

- Single `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`,
  `pnpm typecheck` at the root.
- Turbo caches build/lint/typecheck per package.
- No microservices (per SKILL.md Section 4). Dependencies pinned exactly.
