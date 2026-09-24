# Architecture, Data, Security, Backend, Contracts

Read only if this task touches stored data, APIs, auth, uploads, or security.

## Architect

Assign frontend, backend, database, types, and state on purpose. Trace user action → UI → state → API → validation → authz → logic → database → response → UI.

Do not add microservices, queues, Redis, new state libraries, repositories, factories, or DI unless the project already needs them.

## Database

For each stored field decide type, nullability, default, constraints, ownership, delete behavior, and real query patterns. Prefer columns and relations over JSON when they model the data. No speculative indexes or duplicate sources of truth. For user-owned data, define who may create, read, update, and delete it.

## Migrations

Use a migration for every schema change. Inspect existing rows first. Treat drops, renames, type changes, NOT NULL, enum, FK, unique, bulk rewrites, and deletes as dangerous. Stage incompatible changes: add compatible field → deploy compatible code → backfill → verify → constrain → remove the old field after nothing uses it.

## Security

Never trust client claims about auth, ownership, admin, prices, payment state, or protected transitions. Enforce on the server or in the database. For each protected operation: who, where checked, can the client bypass it? Changing an identifier must not expose another user's data.

## Backend

Validate raw input at the boundary. Keep privileged rules server-side. Use a transaction when several writes must succeed together. Make duplicate payments, purchases, signups, webhooks, and destructive requests idempotent when harmful.

## Contracts

Keep database, backend, API, TypeScript, and UI shapes aligned. Fix drift. Do not weaken types to hide a mismatch.
