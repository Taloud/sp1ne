# Out-of-scope knowledge base

`/triage` records *rejected* enhancement requests under a `.out-of-scope/` directory at the repo root, so the reasoning survives the closed issue and future duplicates can be deduplicated against it. This is the durable, diffable replacement for searching closed `wontfix` issues on the tracker — it travels with the repo and stays readable even if the tracker changes.

## Directory layout

```
.out-of-scope/
├── dark-mode.md
├── plugin-system.md
└── multi-tenant.md
```

One file per **concept**, not per issue. Several issues asking for the same thing are grouped under one file and listed in its "Prior requests".

## File format

Write it as a short design note, not a database row — paragraphs and, where useful, a code sample. Match the project's language (write in French if the repo / issues are in French).

```markdown
# <Concept>

<One sentence: what was requested, and that it is out of scope.>

## Why this is out of scope

<The substantive reason — project scope/philosophy, a technical constraint, or a
deliberate strategic choice. Reference the code or architecture where it helps.
Durable reasons only: "we're too busy right now" is a deferral, not a rejection.>

## Prior requests

- #42 — "<original issue title>"
- #87 — "<duplicate title>"
```

Name the file in short kebab-case (`dark-mode.md`) so the directory is browsable at a glance.

## When `/triage` reads it

At step 1 (Gather context), read every file in `.out-of-scope/`. Match a new request against them **by concept similarity, not keywords** ("night theme" matches `dark-mode.md`). On a match, surface it before recommending:

> "This resembles `.out-of-scope/dark-mode.md` — rejected before because `<reason>`. Still feel the same way?"

The maintainer may **confirm** (append the issue to "Prior requests", then close), **reconsider** (delete or update the file, then proceed through normal triage), or judge them **distinct** (proceed).

## When `/triage` writes it

Only when an **enhancement** is *rejected* as `wontfix` (step 5). Append to the matching file, or create a new one (concept name, reason, first prior request). Then comment on the issue linking the file, and close with the `wontfix` label.

**Never write here for an *already-implemented* `wontfix`.** A built feature is not a rejected one — recording it would poison the dedup with false rejections. Point the closing comment at where the feature already lives instead.
