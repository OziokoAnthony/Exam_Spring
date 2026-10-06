# 0005: Transactional outbox for side effects

## Status

Accepted (2026-10-02)

## Context

Emails (welcome, verify, guardian invite, password reset) and future webhooks
must not be lost when the API restarts, and must never block or fail a DB
transaction.

## Decision

All external side effects are written to an `outbox_events` table in the same
transaction as the state change. A BullMQ worker (Redis) polls/processes
pending events and calls the provider (Resend). Failures retry with backoff;
events are append-only.

## Consequences

- No external API call inside a DB transaction (SKILL.md Section 10).
- Email delivery is at-least-once; templates are idempotent by `eventId`.
- Auditability: every outbound email is traceable to a `ConsentRecord`,
  `Session`, or domain event.
