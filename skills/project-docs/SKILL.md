---
name: project-docs
description: Detect the project's doc layout (structured / domain / light / bootstrap) and say what to read and what may be written. Use before reading a glossary, LESSONS or ADRs, or before recording a decision or lesson.
---

# project-docs

Single owner of the project's documentation layer: which layout the project uses, what to read in that layout, what may be written there, and in which format.

## Detect the layout

Sniff the project root and `.claude/`. Pick the **first** mode whose marker is present.

| Detected | Mode | Read | May be written |
|---|---|---|---|
| `.claude/CODEMAP.md` or `.claude/LESSONS.md` exists | **structured** | `CLAUDE.md`, `.claude/{GLOSSARY,LESSONS,CODEMAP}.md`, sub-`CLAUDE.md` of the touched dirs, recent `docs/adr/` | `.claude/GLOSSARY.md` (terms), `.claude/LESSONS.md` (rules), the project's existing `doc/<topic>.md` convention for wider decisions |
| `CONTEXT.md` or `docs/adr/` exists | **domain** | `CONTEXT.md` (or `CONTEXT-MAP.md` plus the per-context `CONTEXT.md` of the touched area), recent ADRs under `docs/adr/` | `CONTEXT.md` (terms), `docs/adr/` sparingly (decisions) |
| `CLAUDE.md` at root only | **light** | `CLAUDE.md` | the inline Glossary section of `CLAUDE.md`; anything else only after asking |
| none of the above | **bootstrap** | nothing | nothing without explicit permission |

Announce the detected mode in one line so the user can override, for example `_(mode: structured, will read .claude/GLOSSARY.md and .claude/LESSONS.md)_`. A read-only caller that finds **bootstrap** has nothing to check against and should say so and stop.

## Write rules

- **structured**: terms go to `.claude/GLOSSARY.md`. For a rule, call the Skill tool with "lessons-add" (it computes the id and inserts in the right section); the format is in [LESSONS-FORMAT.md](./LESSONS-FORMAT.md). Do not impose `docs/adr/` if the project already has its own doc convention; extend that instead.
- **domain**: terms go to `CONTEXT.md` per [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md). Treat `CONTEXT.md` as a glossary only, devoid of implementation details. Decisions go to `docs/adr/` per [ADR-FORMAT.md](./ADR-FORMAT.md), and only when its three criteria all hold.
- **light**: propose adding or extending a Glossary section in `CLAUDE.md`. A generalisable rule means proposing `.claude/LESSONS.md`, ask first. A wider decision means asking where it belongs (extend `CLAUDE.md`, a new `docs/<topic>.md`, or skip).
- **bootstrap**: resolve in conversation. On the first finding worth keeping, ask where it goes:

  > "I'd like to record _X_. Options: (a) start a `.claude/GLOSSARY.md`, (b) add a Glossary section to your `README.md` / `CLAUDE.md`, (c) keep this in session-only memory, (d) bootstrap a full template if you have one. What works for you?"

  Never create a file of authority in `light` or `bootstrap` without explicit permission.

## Glossary `_Avoid_` aliases

A glossary entry may list `_Avoid_` aliases, banned synonyms of a canonical term. They are a contract between the skill that authors them (`grill-with-docs`) and the skill that checks them (`check-conventions`): any use of an alias is actionable vocabulary drift, named with its canonical replacement, not a judgement call.

## Supporting files

- [ADR-FORMAT.md](./ADR-FORMAT.md), when to write an ADR and how.
- [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md), the shape of `CONTEXT.md` / `CONTEXT-MAP.md`.
- [LESSONS-FORMAT.md](./LESSONS-FORMAT.md), the shape of `.claude/LESSONS.md` entries.

## Anti-patterns

- Creating `CONTEXT.md`, `docs/adr/` or `.claude/` files on a project that has none, without explicit permission.
- Posing a `CONTEXT.md` in `structured` mode; it duplicates `GLOSSARY.md`.
- Reporting a mode without saying what it implies for reads and writes.
