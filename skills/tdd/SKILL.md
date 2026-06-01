---
name: tdd
description: Test-driven development with red-green-refactor loop. Use when the user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.
---

# tdd

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines. Examples in supporting files use TypeScript for concision; the principles apply to any language (PHP, Go, Python, etc.).

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" — treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes — they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

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
- [ ] List the behaviors to test (not implementation steps)
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This is your tracer bullet — proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:

- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

### 5. Close the loop

Once the implementation is settled:

- Run `/check-conventions` (often auto-invoked) to verify the diff against `CONTEXT.md` / ADRs / LESSONS before committing or opening a PR.
- If a generalisable rule emerged from the cycle (e.g. "every functional test rolls back", "this kind of mock always belongs at the boundary"), propose recording it via `/lessons-add`.

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```
