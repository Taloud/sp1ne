---
name: tdd
description: "Red-green-refactor TDD: one test, one minimal implementation, repeat. Use when the user wants test-first development, asks to build a feature or fix a bug with tests, or mentions \"red-green-refactor\"."
---

# tdd

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines. Examples in supporting files use TypeScript for concision; the principles apply to any language (PHP, Go, Python, etc.).

## Anti-Pattern: Horizontal Slices

**Vertical slices via tracer bullets**: one test → one implementation → repeat. Never write all tests then all code — horizontal slicing produces crap tests. See [tests.md](tests.md).

## Phase 0 — Anchor in project docs

Before any planning, detect the doc layout (same logic as `/grill-with-docs`):

| Detected | Mode | Read |
|---|---|---|
| `.claude/CODEMAP.md` or `.claude/LESSONS.md` exists | **structured** | `.claude/{GLOSSARY,LESSONS,CODEMAP}.md`, sub-`CLAUDE.md` for touched dirs, recent `docs/adr/` |
| `CONTEXT.md` or `docs/adr/` exists | **domain** | `CONTEXT.md` (or per-context via `CONTEXT-MAP.md`), `docs/adr/` |
| `CLAUDE.md` at root only | **light** | `CLAUDE.md` |
| none | **bootstrap** | — |

Use the project's domain glossary for test names and interface vocabulary. Respect ADRs in the area you're touching. Cite `.claude/LESSONS.md` entries verbatim when they apply (e.g. "`TST-007` requires functional tests to roll back the transaction").

If planning surfaces genuinely missing context (vague requirements, undefined terms), pause and suggest `/grill-with-docs` before continuing.

## Workflow

### 1. Planning

Before writing any code:

- [ ] Confirm with user what interface changes are needed
- [ ] Confirm with user which behaviors to test (prioritize)
- [ ] Identify opportunities for [deep modules](deep-modules.md) (small interface, deep implementation)
- [ ] Design interfaces for [testability](interface-design.md)
- [ ] For any non-obvious interface, sketch **two shapes under opposing constraints** (e.g. fewest-calls vs fewest-concepts) and pick deliberately — don't commit to the first shape that compiles
- [ ] List the behaviors to test (not implementation steps)
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

### 2. Red-Green Loop

For each behavior, one at a time:

```
RED:   Write next test → fails
GREEN: minimal code for the current test, nothing speculative → passes
```

The first test is your tracer bullet — it proves the path end-to-end. Each test responds to what you learned from the previous cycle; keep tests focused on observable behavior.

### 3. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Re-run the relevant tests after each refactor step (see cadence below)

**Test cadence.** Keep typecheck/compile running continuously, run the *targeted* test for the behavior you just touched on every step, and run the **full suite only once at the end** — not after every micro-step. A green targeted test plus a clean typecheck is enough to keep moving; the full suite is the final gate, not the inner loop.

**Never refactor while RED.** Get to GREEN first.

### 4. Close the loop

Once the implementation is settled:

- Run `/check-conventions` (often auto-invoked) to verify the diff against `CONTEXT.md` / ADRs / LESSONS before committing or opening a PR.
- If a generalisable rule emerged from the cycle (e.g. "every functional test rolls back", "this kind of mock always belongs at the boundary"), propose recording it via `/lessons-add`.

## Checklist Per Cycle

```
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] No speculative features added
```
