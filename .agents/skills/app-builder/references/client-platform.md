# Client and Platform

Read only if this task touches TypeScript, UI, forms, files, deps, or config.

## TypeScript

Precise types. No `any`, unsafe casts, or optional fields added only to silence the compiler. Model real states so impossible combinations cannot occur.

## Frontend

One job per screen or component. Keep DB access, auth, and large business rules out of display components. Handle loading, empty, error, offline, and retry when the screen is network-backed. One source of truth per datum. Keep local UI state local.

## React / React Native / Expo / web

Match the stack already in the repo. Watch extra renders, unstable props, large lists, images, startup work, duplicate fetches, listeners, timers, and leaks. Virtualize large lists. Clean up subscriptions. Memoize only for a real performance problem.

## Forms

Validate on the server or database for correctness even if the client validates for UX. Check required fields, length, ranges, enums, IDs, dates, whitespace, unexpected fields, and double submit. Show useful user messages. Do not expose internal errors.

## Auth

Trace app start → session read → validate/refresh → load user → protected app. Handle expiry, 401s, failed refresh, and logout. On logout: revoke server session when applicable, clear tokens and private caches, reset navigation. Store tokens in secure storage when available.

## Files

Validate type, content or trusted MIME, size, authz, path, public/private, filename, overwrite, orphans, and delete. Do not trust client filenames or MIME. Do not expose private uploads.

## Deps and config

Do not add a package for a few ordinary lines. Prefer what the project already provides. Never commit secrets. Treat every value shipped in a client app as public.
