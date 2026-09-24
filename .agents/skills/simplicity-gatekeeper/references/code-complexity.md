# Code Complexity

Read only when adding files, layers, deps, types, database objects, config, or other production complexity.

Reuse, simplify, merge, remove, or calculate before adding. Do not add a layer that only forwards data.

**Files:** one meaningful unit. Do not split into service/repo/mapper/factory/interface folders for one operation. Split only for unrelated responsibilities or real unreadability.

**Functions:** extract when named, reused, or complex enough to clarify the main flow. Do not wrap `user.id`.

**Abstractions:** add when repeated real code proves the need. A little duplication beats a confusing abstraction. One implementation does not need an interface.

**Layers:** prefer UI → feature logic/API → backend → database. Remove hook→store→action→service→repo→adapter chains that only pass arguments.

**Deps:** use what the project already has. Do not install a package to save a few ordinary lines. Remove the abandoned one when replacing.

**UI:** extract a component when it repeats, has behavior, or clarifies the parent. Do not create `TitleText` / `CardText` wrappers.

**Hooks:** only for React state, effects, subscriptions, or reusable React behavior. Calculations stay functions.

**State:** do not store what you can derive. One source of truth. Prefer derived → local → feature → server/query → global only when genuinely shared. No provider or store for one screen.

**Types:** one name per shape. Separate types only when data actually differs. Prefer `createOrder()` over unused generic engines.

**API:** one endpoint per real operation. Do not split one user action into several requests for symmetry.

**Database:** every table, column, relation, enum, index, trigger, or JSON field must solve a current problem. Do not store cheap calculations. Do not denormalize just to cut tables. Index real query patterns only.

**Config:** constants unless a value actually changes by environment or user. No flags or env vars for values that never change.

**Validation:** frontend helps the user; backend protects the operation; database protects stored data. Do not own the same rule in three systems.

**Errors / defense:** handle at boundaries. No empty rethrow wrappers or huge error hierarchies. Be defensive at untrusted edges (input, APIs, uploads, env, tokens), not inside states the types already make impossible.

**Logs / comments / docs:** log useful failures, never secrets or every success. Comments explain why. Document unusual decisions and dangerous procedures, not every function.

**Scope:** fix related bloat when safe. Do not turn a small task into a rewrite. Report serious unrelated issues; do not silently expand. Deletion of unused wrappers, deps, state, and weak tests is real progress. Do not restyle working code.
