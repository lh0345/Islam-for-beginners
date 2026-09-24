---
name: git-commit
description: Creates a git commit using this repo's safety protocol and message style. Use only when the user explicitly asks to commit.
icon: git-commit
color: gray
disable-model-invocation: true
---

# Git commit

Load only when the user asked to commit. Do not commit otherwise.

## Safety

- Never update git config, skip hooks, or run interactive git (`-i`).
- Never force-push, hard-reset, or other destructive git unless the user explicitly asked.
- Never commit secrets (`.env`, credentials, key files). Warn if asked to.
- Do not amend unless the user asked, or a hook auto-modified a commit you just created that has not been pushed. Never amend after a hook rejection; make a new commit. Never amend a pushed commit unless the user asked (that needs force-push).
- Never force-push `main`/`master`. Warn if asked.

## Do

1. In parallel: `git status`, `git diff` (staged and unstaged), `git log` (recent message style).
2. Stage only the files that belong in this commit. Skip junk and secrets.
3. Commit with a 1–2 sentence message that says why, in this repo's style. PowerShell: `git commit -m "..."`. Bash: a HEREDOC is fine.
4. `git status` to confirm. Do not push unless asked.

If there is nothing to commit, stop. Do not create an empty commit.
