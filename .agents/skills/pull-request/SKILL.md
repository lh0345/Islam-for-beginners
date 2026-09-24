---
name: pull-request
description: Pushes the branch if needed and opens a GitHub pull request with gh. Use only when the user explicitly asks to create a pull request.
icon: git-pull-request
color: gray
disable-model-invocation: true
---

# Pull request

Load only when the user asked to create a pull request. Use `gh` for GitHub work.

## Do

1. In parallel: `git status`, `git diff`, whether the branch tracks a remote and is up to date, `git log` and `git diff` against the base branch for the full PR range.
2. Create a branch if needed. Push with `-u` if the branch has no upstream.
3. Draft the PR from **all** commits on the branch, not just the latest.
4. `gh pr create` with a short title and body:

```markdown
## Summary
- why this change exists (1–3 bullets)

## Test plan
- [ ] checks the reviewer should run
```

5. Return the PR URL.

Do not update git config. Do not force-push `main`/`master`.
