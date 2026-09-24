# Test Budget

Read only when adding, changing, merging, deleting, or auditing tests.

About **20** meaningful automated tests. Not a target. If 12 protect what matters, keep 12. Do not add test #21 without auditing the suite.

## What to protect

**Critical:** authn/authz, user isolation, RLS, admin, payments, money, destructive actions, account deletion, ownership, integrity, important migrations/transactions, data-loss risks.

**High:** login lifecycle, core business rules, important APIs and status transitions, duplicate-request protection, important uploads, critical external calls, main user flows.

**Medium:** only if it caused a real bug, is easy to break, blocks an important action, corrupts data, has tricky edges, or cannot be covered higher up.

## Before adding

What serious production failure does this catch? Does an existing test catch it? Can a stronger integration test cover it? Are we testing our behavior or a library? Will it survive normal refactors? Would we care if this broke?

No serious consequence: do not add it. Do not test libraries, getters, constants, wrappers, static text, or code with no meaningful branch. Do not add a test because a file exists.

Prefer one flow test (permission → rule → persist → resulting state) over many mapper/wrapper unit tests.

## Regressions

Add a regression test for security, permissions, money, important data, auth, destructive behavior, a critical flow, or subtle logic likely to break again. Not for spacing, typos, or simple mistakes.

## At or over 20

Classify each test KEEP / MERGE / DELETE. Keep high-value protection. Merge weak overlaps. Delete trivial, duplicate, obsolete, or implementation-detail tests. Exceed 20 only when the new test is critical, uncovered, unmergeable, and replacing another test would drop equal protection — and say so.

When asked to clean the suite, classify every test and reduce toward 20 strong tests. Do not delete security, money, data, or critical-flow protection just to hit 20.
