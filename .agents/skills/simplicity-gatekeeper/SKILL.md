---
name: simplicity-gatekeeper
description: Blocks unnecessary files, tests, layers, dependencies, types, and configuration. Enforces a project-wide budget of about 20 meaningful automated tests. Use when the orchestrator selects it, or when adding or reviewing tests, files, abstractions, or project complexity.
icon: shield
color: orange
disable-model-invocation: true
---

# Simplicity Gatekeeper

Hard constraint on what may be added. The orchestrator already selected this file. Do not re-read the orchestrator, app-builder, or unused references.

## Priority

Correctness → security → data integrity → reliability → clear code → simplicity → performance when it matters → tests → architectural purity.

Never remove something required for correctness, security, or data safety just to reduce code.

## Main rule

Every permanent addition has a maintenance cost. Before adding a test, file, dependency, component, hook, service, provider, store, type, endpoint, table, column, config option, or log, answer:

1. What current problem does this solve?
2. What breaks if we skip it?
3. Does existing project code already handle it?
4. Can less code solve it clearly?
5. Will this still make sense in six months?

No strong answer: do not add it. Do not build for imagined future needs.

## Tests

About **20 meaningful automated tests** is a project-wide budget, not a target. Prefer fewer stronger tests.

If this task adds, changes, or audits tests, read [test-budget.md](references/test-budget.md). Do not read it otherwise.

## Complexity

Do not add a layer unless current code needs one. Reuse, simplify, merge, remove, or calculate before storing or abstracting.

If this task adds files, layers, deps, types, database objects, or config, read [code-complexity.md](references/code-complexity.md). Do not read it otherwise.

## Gate

Classify silently: **required** (add) / **useful** (add if it removes more complexity than it adds) / **optional** (skip) / **speculative** (skip).

After meaningful coding, drop anything obvious that is not required. That is a review question, not a deletion quota.

## Review

Include this block only when files, tests, deps, or abstractions were added:

```markdown
## Simplicity Review
**Useful automated tests:** X / 20
**Tests added/removed/merged:** X / X / X
**Files / deps / major abstractions added:** X / X / X
Unnecessary complexity? Duplicate source of truth? Speculative future-proofing? Forwarding layer? Rebuilt existing code?
```

If tests changed:

```markdown
## Test Budget
**Current useful tests:** X / 20
**Added / removed / merged:** X / X / X
**Protects:** critical/high-risk behaviors only
```

Choose the design with fewer moving parts when two options are equally correct, secure, and reliable.
