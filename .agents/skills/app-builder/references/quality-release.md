# Quality and Release

Read only if this task is a production review, release, or reliability/Sentry pass.

## Errors and reliability

No empty catch. Handle, return, show, log, or retry safely. Distinguish user, validation, auth, permission, network, server, and unexpected errors. Do not leak stack traces, SQL, or secrets.

For important flows, design so network loss, double taps, mid-operation exit, concurrent requests, and lost responses after a successful write cannot corrupt data.

## Tests

Follow simplicity-gatekeeper if tests change. Budget: about 20 meaningful tests. Add a test only for serious harm. Prefer one strong integration or flow test over many implementation-unit tests.

## Logging and release

Log what failed, where, and enough safe context to reproduce. Never log passwords, tokens, auth headers, or payment data. Unexpected crashes go to monitoring; routine validation failures do not.

Before release or after native/config changes, check prod vs dev builds, each shipped platform, env, IDs, permissions, assets, API target, source maps, migrations, version, and crash reporting.

## Production review

Review only changed and directly related paths: obvious bugs, debug leftovers, migrations, authz, UI failure states, secrets, and whether important behavior still has a justified test.

## Sentry

Inspect changed and related files only. Do not invent findings. Use only when the orchestrator says this change is in Sentry scope:

```markdown
## Sentry Report
**New issues found:** X
### [SEVERITY] Issue
**Where:** file/table/function
**Problem:** what is wrong
**Fix:** what should change
```

If none: `**New issues found: 0**`.
