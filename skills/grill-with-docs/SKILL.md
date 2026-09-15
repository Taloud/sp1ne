---
name: grill-with-docs
description: A relentless interview that stress-tests a plan against the project's own docs and updates them (glossary, lessons, ADRs) inline as decisions crystallise.
disable-model-invocation: true
---

# grill-with-docs

Run a grilling session (the interview engine, relentless, one question at a time) and layer the project's documentation on top: detect the doc layout, sharpen the plan against the project's own glossary / lessons / ADRs, and update those docs **inline** as decisions crystallise.

<what-to-do>

The interview methodology lives in the `grilling` skill: call the Skill tool with "grilling" to run it. This skill adds the doc-aware layer:
- **Detect the documentation layout** first (Phase 0), so you know what to read and where to write.
- **Sharpen against the project's docs**, the mode-specific challenge axes in Phase 2, on top of the grilling engine's generic behaviors.
- **Write inline**, updating the relevant doc artefact **as decisions crystallise**, never batched at the end. Show the diff or insert briefly before moving on.

</what-to-do>

<supporting-info>

## Phase 0: Detect the documentation layout

Before the first question, call the Skill tool with "project-docs". It detects the mode (`structured` / `domain` / `light` / `bootstrap`), announces it, and defines what to read and what may be written in that mode, plus the doc formats. Phase 2 below adds only the grilling-specific behaviour per mode.

### Optional Step 0a: Ticket pre-seed

If a reference matching `[A-Z]+-\d+` is in the conversation (Jira/Linear style) **or** the user explicitly asks to grill on a ticket, fetch it before the first interview question.

1. Identify the reference. If multiple are present and ambiguous, ask which one.
2. Fetch via the relevant MCP connector (`mcp__claude_ai_Atlassian__getJiraIssue` for Jira, equivalent for Linear). For Jira, discover the `cloudId` via `mcp__claude_ai_Atlassian__getAccessibleAtlassianResources` if not known.
3. Read description, acceptance criteria, comments, and any preview/recipe URLs.
4. **Surface a 2-3 line summary** + flag obvious gaps so the user knows what you're working from.
5. If the ticket is effectively empty (placeholder description, no AC), say so and fall back to grilling from conversation context only.

**Use the ticket as input to interrogate, not to transcribe.** Translate it into pointed questions:

- Quote ambiguous PO phrases verbatim and ask for concrete meaning. _("The ticket says 'l'utilisateur doit pouvoir filtrer rapidement': what counts as 'rapidement'? <50ms perceived? <300ms p99?")_
- Force vague acceptance criteria ("fast", "intuitive", "consistent") into testable form.
- Cross-reference ticket claims against the codebase; flag contradictions immediately.
- Surface hidden assumptions and implicit decisions the PO didn't make. Propose a recommended answer.

**Read-only on the tracker.** Do NOT update, transition, or comment on the ticket. The tracker remains the PO's source of truth.

## Phase 1: Grilling behaviors

The core grilling behaviors (challenge glossary conflicts, sharpen fuzzy language, stress-test scenarios, cross-reference the code) live in the `grilling` skill. Call the Skill tool with "grilling" to run that session; the Phase 2 extras below sharpen it against the project's own docs.

## Phase 2: Mode-specific extras

### `structured`

Extra challenge axes:
- Ambiguous PO/business term → cross-reference `.claude/GLOSSARY.md` for the canonical code mapping.
- Plan touches shared/cross-cutting code → ask the user whether a project-specific impact check (skill, grep convention, doc) has been run. Don't infer.
- Plan violates an existing LESSON → flag the LESSON id verbatim. _"This conflicts with `TST-007`: every functional test rolls back its transaction."_
- Legacy ↔ modern pattern coexistence → confirm which side the plan targets and surface implications.

Writes: for the actual lesson-write, call the Skill tool with "lessons-add".

### `domain`

Extra challenge axes:
- A term used ambiguously across contexts → force one canonical word and list the losers as `_Avoid_` aliases.
- A decision that crosses a context boundary → ask whether it is an integration contract worth an ADR.

This skill *changes* the domain model: challenging terms, sharpening language, writing decisions down as they crystallise. Merely reading `CONTEXT.md` for vocabulary is a one-line habit any skill can do (it is what `check-conventions` does); don't mistake that passive consumption for the active grilling work here.

### `light` and `bootstrap`

The docs are thin, so the grilling itself carries the load: resolve terms and decisions in conversation and keep them visible in the thread. Follow the ask-first write rules `project-docs` gives for these modes; never create a file of authority on your own initiative.

## Example session (`structured` mode)

```
User:  Plan to add a `cancel reason` field to the Order entity.

You:   _(mode: structured, will check .claude/GLOSSARY.md and .claude/LESSONS.md)_

You:   Your .claude/GLOSSARY.md defines **Cancellation** as "termination triggered
       by the customer". You also said 'cancel reason' will be filled when ops
       cancels for fraud, a different actor. Should the term cover both?
       Recommended: rename the entity-level concept to **Termination** and keep
       **Cancellation** for customer-driven only.

User:  Good catch, go with that split.

       [updates .claude/GLOSSARY.md inline]

You:   Next: where does `reason` live, on `Order` directly, or in a new
       `Termination` value object? Your code already shows Order carries
       6 nullable status fields. Recommended: value object.
```

## Anti-patterns

- Asking questions whose answer is in the code or in an index like `CODEMAP.md`/`CONTEXT.md`: read first.
- Creating `CONTEXT.md`, `docs/adr/`, or `.claude/` files on a project that has none, without explicit permission.
- Updating `LESSONS.md` directly with verbose prose instead of calling the Skill tool with "lessons-add".
- Batching updates at the end of the session: capture inline.

## Notes

- Builds on the `grilling` skill (the interview engine) and on `project-docs` (layout detection and doc formats), and delegates lesson writes to `lessons-add`. Any ticket-fetching skill the user has set up plugs into Step 0a.

</supporting-info>
