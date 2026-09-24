---
name: app-builder
description: Implements app features, bug fixes, and production changes using this repo's architecture, Expo, TypeScript, and review workflow. Use when the orchestrator selects it, or when the user names app-builder for implementation work.
icon: code
color: blue
disable-model-invocation: true
---

# App Builder

Implementation workflow. The orchestrator already selected this file. Do not re-read the orchestrator, `AGENTS.md`, or unused references.

## Do

1. Inspect the existing implementation and related types, data, routes, and tests. Do not guess.
2. Make the smallest correct change. Match the current architecture. Do not add files, tests, layers, deps, types, or config unless required.
3. If this change adds a file, test, layer, dep, type, or config, and simplicity-gatekeeper is not already loaded, read `.agents/skills/simplicity-gatekeeper/SKILL.md`.
4. Read only the one reference that matches. Skip it if this conversation already has it:
   - Stored data, API, auth, upload, security: [architecture-data-backend.md](references/architecture-data-backend.md)
   - TypeScript, UI, Expo, forms, files, deps, config: [client-platform.md](references/client-platform.md)
   - Errors, tests, release, Sentry: [quality-release.md](references/quality-release.md)
5. Work in dependency order when layers meet: data → migration → security → backend → types → UI.
6. Handle real failure and edge cases. Add a test only for critical or high-risk behavior inside the 20-test budget.
7. Run checks proportional to risk. Report only checks that ran.

## Workflows

**Feature:** inspect → short plan only if cross-layer → implement → justified test only → proportional checks.

**Bug:** find the cause → fix the cause → check related paths → regression test only if security, data, auth, money, a critical flow, or subtle logic is involved.

**Data:** schema → migration → security → backend → types → UI. Never start at the UI and patch storage afterward.

For a major cross-layer feature, state files affected and whether data, API, or security changes. Skip the plan for localized work.

Expo SDK 57 docs (`https://docs.expo.dev/versions/v57.0.0/`) only when writing version-specific Expo or native API code.

## Finish

Follow the orchestrator report rules. Do not invent unused sections. Never claim completion while requested work remains.
