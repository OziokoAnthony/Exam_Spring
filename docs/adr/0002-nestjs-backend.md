# 0002: NestJS backend (modular monolith)

## Status

Accepted (2026-10-02)

## Context

The API needs modules with clear boundaries (identity, curriculum, questions,
attempts, consent, outbox...), dependency injection, and testability. The
stack is TypeScript strict, no GraphQL, no microservices.

## Decision

NestJS 10 with a modular monolith. REST under `/v1/`. Every module exposes
controllers (HTTP), services (business logic + authorization), and a module
definition. Zod validates all inputs; a global exception filter maps errors
to the `{success, error, meta}` envelope.

## Consequences

- Object-level authorization lives in services, never controllers.
- Integration tests via Supertest + Vitest hit real HTTP routes.
- No WebSockets, no GraphQL, no K8s (SKILL.md Section 4).
