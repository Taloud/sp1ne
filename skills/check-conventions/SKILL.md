---
name: check-conventions
description: Verify a code diff against the project's documented conventions — domain vocabulary (CONTEXT.md / .claude/GLOSSARY.md), architectural decisions (docs/adr/), and lessons (.claude/LESSONS.md). Read-only and advisory — surfaces violations, never refuses. Use at the end of a code session, before opening a PR, during a code review, or whenever the user wants to verify a diff against project conventions. Triggers: "check conventions", "vérifier les conventions", "/check-conventions", or proactively after finishing a coding task.
---

# check-conventions

Verify that a diff respects the project's documented conventions. **Read-only and advisory** — this skill reports violations but never blocks, edits, or commits. The user decides what to do with the findings.

## When to invoke

- **Proactively** after finishing a non-trivial code change session, before reporting the task complete.
- **Proactively** when about to open a PR (before `gh pr create`).
- **On demand** during a code review (`/pr-review` may call this).
- **On demand** via `/check-conventions` or "check conventions" / "vérifier les conventions".

Do not invoke after trivial changes (typo fixes, comment-only edits, version bumps, lockfile updates) — pure noise.

## Phase 0 — Detect the documentation layout

Reuse the layout detection from `/grill-with-docs`:

| Detected | Mode | Sources of truth |
|---|---|---|
| `.claude/CODEMAP.md` or `.claude/LESSONS.md` exists | **structured** | `CLAUDE.md`, `.claude/{LESSONS,GLOSSARY,CODEMAP}.md`, sub-`CLAUDE.md` for touched dirs, recent `docs/adr/` |
| `CONTEXT.md` or `docs/adr/` exists | **domain** | `CONTEXT.md` (or `CONTEXT-MAP.md` + per-context `CONTEXT.md`), `docs/adr/` |
| `CLAUDE.md` at root only | **light** | Glossary section of `CLAUDE.md` |
| none of the above | **bootstrap** | — exit immediately with `_(no conventions documented — nothing to check against)_` |

Announce the detected mode in one line.

## Phase 1 — Determine the scope to check

Pick the first matching case:

1. **Explicit argument** — file paths, a git range (`HEAD~5..HEAD`), or a PR number (`#1234`).
   - PR: `gh pr diff <N>`
   - Range: `git diff <range>`
   - Files: `git diff -- <files>` (staged + unstaged)
2. **PR context** detected (current branch tracks a PR, or `/pr-review` is the caller): `gh pr diff` for the current PR.
3. **Default** (post-session check): `git diff` (unstaged) + `git diff --cached` (staged).

Skip files that are pure infra / config noise unless the user said otherwise: lockfiles (`*.lock`, `package-lock.json`, `composer.lock`, `bun.lockb`), CI configs (`.github/workflows/*.yml`) unless those *are* the change, and generated files. Use judgment — domain code is what matters here.

If the resulting diff is empty after filtering, say so and stop.

## Phase 2 — Load conventions

For the detected mode, read:

- **structured**: `.claude/GLOSSARY.md` (canonical terms), `.claude/LESSONS.md` (rules), recent `docs/adr/` entries (architectural decisions), `.claude/CODEMAP.md` (module layout if present).
- **domain**: `CONTEXT.md` (or per-context `CONTEXT.md` for the touched area, via `CONTEXT-MAP.md` if present), `docs/adr/`.
- **light**: Glossary section of `CLAUDE.md`.

Skip ADRs that are obviously unrelated to the touched area (read titles first, full content only if a touched file/module matches).

## Phase 3 — Run checks

For each touched file in the diff, evaluate against:

### Vocabulary drift (`structured` + `domain` + `light`)
Terms used in code (identifiers, types, function names, comments, log messages, user-facing strings) that contradict the canonical term defined in the glossary.

Example: glossary defines `Cancellation` as customer-driven; diff introduces a service method `cancelOrderForFraud()` — that's a `Termination`, not a `Cancellation`.

### ADR contradiction (`structured` + `domain`)
Changes that violate a documented architectural decision.

Example: ADR-0042 "Postgres for write model"; diff introduces a Redis-backed write for orders.

Only flag with confidence — if the ADR's applicability is debatable, surface it as a *question*, not a violation.

### LESSON violation (`structured`)
Changes that contradict a rule recorded in `.claude/LESSONS.md`.

Example: LESSON `TST-007` "every functional test rolls back its transaction"; diff adds a functional test without rollback. Cite the LESSON id verbatim.

### CODEMAP drift (`structured`, if present)
A new module or file placed in a location that contradicts the documented module layout. Soft signal — sometimes the CODEMAP is out of date and *it* needs updating.

## Phase 4 — Report

Output a structured report. **Match the conversation's language** (FR if the diff/repo is in French, EN otherwise).

### If no violations

One line:

> ✓ Aucune violation détectée (`N` fichiers vérifiés contre `M` règles).

Stop here.

### If violations

For each violation:

```
[severity] <file>:<line>
  Rule: <doc>:<section/term/lesson-id>
  Issue: <one-line description of the contradiction>
  Suggested fix: <if obvious; otherwise "to discuss">
```

Severity levels:
- **violation** — clear contradiction (flag the LESSON id verbatim, the canonical glossary term, or the ADR number)
- **question** — possible drift, applicability not certain — surface for the user to judge

End the report with a one-line summary: `X violations, Y questions across N files. The user decides what to act on.`

## Phase 5 — Optional comment on PR

If invoked during a PR review **and** the user explicitly asks to post the report on the PR, do so as a comment with the AI disclaimer (matching `/triage` convention):

> *Généré par IA — vérification des conventions du projet.* (FR)
>
> *This was generated by AI — project conventions check.* (EN)

Default behavior is to print to the terminal, not to post.

## Anti-patterns

- **Don't refuse, don't block, don't auto-fix.** This skill is advisory only — fixing is the user's call.
- **Don't flag style/format issues** that linters/formatters handle (Prettier, PHP-CS-Fixer, etc.). Those are out of scope.
- **Don't re-flag the same violation** the user has already explicitly accepted in a previous turn of the current session.
- **Don't write to `LESSONS.md` / `CONTEXT.md` / `docs/adr/`.** If a finding suggests a doc is out of date (e.g. CODEMAP drift looks legitimate), recommend `/grill-with-docs` or `/lessons-add` to address it — don't update silently.
- **Don't run on trivial diffs** (lockfile bumps, typos in comments, formatting-only changes).
