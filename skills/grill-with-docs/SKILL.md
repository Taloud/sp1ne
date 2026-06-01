---
name: grill-with-docs
description: Grilling session that stress-tests a plan against the project's existing documentation, sharpens terminology, and updates docs (CONTEXT.md / GLOSSARY.md / LESSONS.md / ADRs) inline as decisions crystallise. Auto-detects the project's documentation layout (structured `.claude/`, domain-driven `CONTEXT.md`, light `CLAUDE.md`, or bootstrap). Use when the user wants to challenge a plan against their project's language and documented decisions.
---

# grill-with-docs

<what-to-do>

Interview the user relentlessly about every aspect of their plan until reaching shared understanding. Walk down each branch of the design tree, resolving dependencies one at a time. For each question, provide a recommended answer.

**Universal rules** (apply to every phase):
- Ask questions **one at a time** and wait for the answer.
- Explore the codebase to answer your own question rather than asking, when possible.
- Update the relevant doc artefact **inline** as decisions crystallise — never batch at the end. Show the diff or insert briefly before moving on.

</what-to-do>

<supporting-info>

## Phase 0 — Detect the documentation layout

Before the first question, sniff the project root and `.claude/`. Pick the **first** mode whose marker is present.

| Detected | Mode | Read | Write target |
|---|---|---|---|
| `.claude/CODEMAP.md` or `.claude/LESSONS.md` exists | **structured** | `CLAUDE.md`, `.claude/{LESSONS,GLOSSARY,CODEMAP}.md`, sub-`CLAUDE.md` for affected dirs | `.claude/GLOSSARY.md` (terms), `.claude/LESSONS.md` via `lessons-add` (rules), existing `doc/<topic>.md` convention (wide decisions) |
| `CONTEXT.md` or `docs/adr/` exists | **domain** | `CONTEXT.md` (or `CONTEXT-MAP.md` + per-context `CONTEXT.md`), recent ADRs | `CONTEXT.md` (terms), `docs/adr/` sparingly (decisions — see [ADR-FORMAT.md](./ADR-FORMAT.md)) |
| `CLAUDE.md` at root only | **light** | `CLAUDE.md` | inline Glossary section of `CLAUDE.md`; propose bootstrapping `.claude/LESSONS.md` if a rule emerges |
| none of the above | **bootstrap** | nothing | ask the user where to record each finding before creating any file |

Announce the detected mode in one line so the user can override: `_(mode: structured — will update .claude/GLOSSARY.md and .claude/LESSONS.md)_`.

### Optional Step 0a — Ticket pre-seed

If a reference matching `[A-Z]+-\d+` is in the conversation (Jira/Linear style) **or** the user explicitly asks to grill on a ticket, fetch it before the first interview question.

1. Identify the reference. If multiple are present and ambiguous, ask which one.
2. Fetch via the relevant MCP connector (`mcp__claude_ai_Atlassian__getJiraIssue` for Jira, equivalent for Linear). For Jira, discover the `cloudId` via `mcp__claude_ai_Atlassian__getAccessibleAtlassianResources` if not known.
3. Read description, acceptance criteria, comments, and any preview/recipe URLs.
4. **Surface a 2-3 line summary** + flag obvious gaps so the user knows what you're working from.
5. If the ticket is effectively empty (placeholder description, no AC), say so and fall back to grilling from conversation context only.

**Use the ticket as input to interrogate, not to transcribe.** Translate it into pointed questions:

- Quote ambiguous PO phrases verbatim and ask for concrete meaning. _("The ticket says 'l'utilisateur doit pouvoir filtrer rapidement' — what counts as 'rapidement'? <50ms perceived? <300ms p99?")_
- Force vague acceptance criteria ("fast", "intuitive", "consistent") into testable form.
- Cross-reference ticket claims against the codebase; flag contradictions immediately.
- Surface hidden assumptions and implicit decisions the PO didn't make. Propose a recommended answer.

**Read-only on the tracker.** Do NOT update, transition, or comment on the ticket. The tracker remains the PO's source of truth.

## Phase 1 — Grilling behaviors (all modes)

| Behavior | When | Example |
|---|---|---|
| **Challenge glossary conflict** | a user term contradicts the existing glossary | _"Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"_ |
| **Sharpen fuzzy language** | user uses vague or overloaded terms | _"You're saying 'account' — do you mean Customer or User?"_ |
| **Stress-test scenarios** | a domain relationship is being decided | invent specific edge cases that force precision on boundaries |
| **Cross-reference code** | user claims X works a certain way | check the code; if contradiction, surface immediately |

## Phase 2 — Mode-specific extras

### `structured`

Extra challenge axes:
- Ambiguous PO/business term → cross-reference `.claude/GLOSSARY.md` for the canonical code mapping.
- Plan touches shared/cross-cutting code → ask the user whether a project-specific impact check (skill, grep convention, doc) has been run. Don't infer.
- Plan violates an existing LESSON → flag the LESSON id verbatim. _"This conflicts with `TST-007` — every functional test rolls back its transaction."_
- Legacy ↔ modern pattern coexistence → confirm which side the plan targets and surface implications.

Writes — see [LESSONS-FORMAT.md](./LESSONS-FORMAT.md) for tone. Delegate to skill `lessons-add` if available for the actual lesson-write.

### `domain`

Writes — see [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) for `CONTEXT.md`, [ADR-FORMAT.md](./ADR-FORMAT.md) for ADRs.

Treat `CONTEXT.md` as a glossary only — devoid of implementation details. Not a spec, not a scratch pad.

ADRs only when all three: (1) hard to reverse, (2) surprising without context, (3) result of a real trade-off. Skip if any criterion is missing.

### `light`

Writes:
- Term resolved → propose adding/extending a Glossary section in `CLAUDE.md`. Don't create new files of authority on your own.
- Generalisable rule → propose creating `.claude/LESSONS.md`. Ask first.
- Wider decision → ask the user where to record it (extend `CLAUDE.md`? new `docs/<topic>.md`? skip?).

### `bootstrap`

Don't pose files of authority on your own initiative. Resolve in conversation. On the first finding worth keeping, ask:

> "I'd like to record _X_. Options: (a) start a `.claude/GLOSSARY.md`, (b) add a Glossary section to your `README.md` / `CLAUDE.md`, (c) keep this in session-only memory, (d) bootstrap a full template if you have one. What works for you?"

Capture decisions in conversation only until the user picks. Never create files without explicit permission in this mode.

## Example session (`structured` mode)

```
User:  Plan to add a `cancel reason` field to the Order entity.

You:   _(mode: structured — will check .claude/GLOSSARY.md and .claude/LESSONS.md)_

You:   Your .claude/GLOSSARY.md defines **Cancellation** as "termination triggered
       by the customer". You also said 'cancel reason' will be filled when ops
       cancels for fraud — a different actor. Should the term cover both?
       Recommended: rename the entity-level concept to **Termination** and keep
       **Cancellation** for customer-driven only.

User:  Good catch — go with that split.

       [updates .claude/GLOSSARY.md inline]

You:   Next: where does `reason` live — on `Order` directly, or in a new
       `Termination` value object? Your code already shows Order carries
       6 nullable status fields. Recommended: value object.
```

## Anti-patterns

- Asking questions whose answer is in the code or in an index like `CODEMAP.md`/`CONTEXT.md` — read first.
- Creating `CONTEXT.md`, `docs/adr/`, or `.claude/` files on a project that has none, without explicit permission.
- Posing a `CONTEXT.md` on `structured` mode (duplicates `GLOSSARY.md`).
- Imposing `docs/adr/` on `structured` mode if the project already has its own doc convention.
- Updating `LESSONS.md` directly with verbose prose when the `lessons-add` skill is available — delegate to it.
- Batching updates at the end of the session — capture inline.

## Notes

- Works hand-in-hand with `lessons-add` (the LESSON-writer) and any ticket-fetching skill the user has set up.

</supporting-info>
