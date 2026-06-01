# LESSONS.md Format (mode `structured`)

`.claude/LESSONS.md` captures **rules** the dev has corrected Claude on — generalisable to the project, actionable, specific.

For one-shot adds, delegate to the `lessons-add` skill (it handles ID computation + section insertion). This file documents the format so `grill-with-docs` can read and update `LESSONS.md` inline when appropriate.

## Header (top of `LESSONS.md`)

```md
# LESSONS.md

Mistakes Claude has made on this project, captured via the `lessons-add` skill. Read before any non-trivial task.

## Format

\`\`\`
### <ID> — <one-line title>
<actionable rule>. *Why*: <concise reason>. → <optional ref> · YYYY-MM-DD
\`\`\`

ID prefixes: <project chooses its own — see this file's header>
```

The exact preset of prefixes is **project-specific**. Read the actual list from the project's `LESSONS.md` header — never assume a default set applies. Common patterns:
- A web API project might use `SF` (framework/DI) · `DB` (database/migrations) · `CI` (CI/CD) · `TST` (tests) · `SEC` (security) · `BLD` (build) · `OTH`.
- A library project might use `API` (public API) · `DEP` (dependencies) · `TST` · `DOC` · `OTH`.
- A data pipeline might use `IO` (input/output) · `PERF` · `DAT` (data quality) · `TST` · `OTH`.

## Entry format

```md
### TST-001 — Wrap functional tests in a transaction rollback
Every functional test that touches the DB must run inside a transaction that rolls back at teardown. *Why*: parallel runs share fixtures and the previous suite occasionally leaked rows. → `tests/Functional/AbstractTestCase.php` · 2026-05-04
```

Rules:
- **2-3 lines max** — `LESSONS.md` is read at the start of non-trivial tasks; tokens add up.
- **Actionable** — the reader knows what to do, not just what was wrong.
- **Specific** — not "be careful with null pointers" but a concrete rule tied to a real codebase pattern.
- **Generalisable** — not a one-off bug; a recurring rule.
- **Why is optional** — include only if the reason isn't obvious from the rule itself.
- **Ref is optional** — file path, doc, skill name, or PR number if useful.

## Anti-patterns

- Verbose prose instead of the compact format.
- Adding a lesson when the rule already lives in a `CLAUDE.md` or a skill — strengthen the existing doc instead.
- Duplicating an existing entry — consolidate.
- Project-agnostic advice ("write secure code") — doesn't belong here.

## Cross-reference with grill-with-docs

When `grill-with-docs` resolves a generalisable rule during a session:
- If skill `lessons-add` is available → invoke it for the structured-write.
- Otherwise → append directly to `.claude/LESSONS.md`, using this format.

In both cases, **confirm with the user** before writing, especially on implicit triggers (the user corrected Claude but didn't explicitly say "add to lessons").
