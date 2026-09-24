---
name: orchestrator
description: Routes each request to the smallest set of project skills and reference files so unused instructions are never loaded. Use first for any app change, review, debug, test, commit, pull request, UI verification, or repository question.
icon: route
color: green
---

# Orchestrator

This is the only project skill to load by default. Do not read other skills or references until this file names them.

## Token budget

- Questions that do not change or review the app: stop here. Answer from context already loaded.
- Never re-read a file already in this conversation.
- Never read a skill or reference whose trigger does not match this task.
- Never re-read `AGENTS.md`, `CLAUDE.md`, or this file.
- Never load both `app-builder` and `simplicity-gatekeeper` unless the task both implements code and adds files, tests, layers, deps, types, or config.
- Read Expo docs only when writing version-specific Expo or native API code.
- Prefer inspecting existing project code over reading generic skill prose.
- Do not recap skills in the reply. Do not emit unused review templates.
- Never read lockfiles, minified catalogs, or every locale/translation file at once. Grep a key.
- Do not read `docs/` unless the task is release, store listing, or deploy setup.

## Route

Classify once. Read only the files in the matching row.

| Task | Read |
| --- | --- |
| Question / explain, no edit | nothing else |
| Tiny local edit (copy, color, spacing, rename, one-liner) | nothing else |
| Screen, hook, component, or TypeScript/UI change | `app-builder/SKILL.md` and `app-builder/references/client-platform.md` |
| Stored data, API, auth, upload, or security | `app-builder/SKILL.md`, `app-builder/references/architecture-data-backend.md`, and `simplicity-gatekeeper/SKILL.md` |
| Add a file, layer, dep, type, provider, or config | also `simplicity-gatekeeper/SKILL.md` and `simplicity-gatekeeper/references/code-complexity.md` |
| Add, change, or audit tests | also `simplicity-gatekeeper/SKILL.md` and `simplicity-gatekeeper/references/test-budget.md` |
| Reliability, release, or production review | `app-builder/SKILL.md` and `app-builder/references/quality-release.md` |
| Cross-layer feature | `app-builder/SKILL.md`, only the matching reference files above, and `simplicity-gatekeeper/SKILL.md` |
| User asked to commit | `git-commit/SKILL.md` |
| User asked for a pull request | `git-commit/SKILL.md` only if also committing, and `pull-request/SKILL.md` |
| User-visible web / Expo-web UI, or user asked to verify UI | `verify-ui/SKILL.md` |

Paths are under `.agents/skills/`. Do not browse the skills folder. Do not read files this table does not name.

## Always (no extra read)

- Smallest correct change. Match existing architecture. Do not rewrite unrelated code.
- Do not add a file, test, layer, dependency, type, or config without a current need.
- About 20 meaningful tests is a budget, not a target. Add a test only for critical or high-risk behavior.
- Never claim a check ran unless it ran.
- Expo SDK 57 docs: `https://docs.expo.dev/versions/v57.0.0/` — only when needed.

## Finish

Tiny or localized change: a few sentences and the files touched. Omit unused sections.

Meaningful coding: what changed, checks actually run, and whether anything extra was added.

Add a Simplicity Review only when files, tests, deps, or abstractions were added.

Add a Sentry Report only when the change can affect security, data, auth, money, or a critical flow.

```markdown
# Completed
What changed.

## Checks
Only commands actually run.

## Simplicity Review
Only if something extra was added. Tests X/20. Files/deps/abstractions added.

## Sentry Report
Only if in scope. New issues found: X
```
