# Adding a language

Course structure uses stable IDs (`day-01`, `lesson-01`, `day-01-meaning-1`) so progress
is independent from translated text.

To add a locale:

1. Copy `en/course.ts` and translate only user-facing values. Keep IDs, lesson
   numbers, section roles, prompt kinds, and array order aligned. Translate scenario
   answers to exactly match their corresponding translated option.
2. Copy `en/ui.ts` and translate every value while preserving `{placeholders}`.
3. Register the two files in `src/locales/index.ts`. The language picker reads
   that registry automatically.
4. Run `npm run typecheck` and `npm test`. Verify translated scenarios preserve
   their meaning, and Quran quotations match the named published translation.

The English course is authored directly in `en/course.ts`. The old fact-card
importer was retired because it recreated the fixed lesson and trivia template.
Each exploration contains 3–6 independently authored sections. Continuous reading
is the default; readers can choose to see one section at a time.

Daily understanding prompts have separate `day-NN-meaning-N` identities. Use a
scenario only when alternatives clarify a real distinction; otherwise use an
open consideration or connection. Do not reuse legacy question identities or
interpret old quiz mastery as completion of a rewritten prompt.

`CONTENT_AUDIT.md` records the disposition of every original lesson and question.
