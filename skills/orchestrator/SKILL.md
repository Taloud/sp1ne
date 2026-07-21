---
name: orchestrator
description: Execute a task by routing each subtask to the best-fit model tier — never above the session model — while the session model plans, routes, verifies, and integrates.
disable-model-invocation: true
argument-hint: "The task to execute with best-fit model delegation"
---

# orchestrator

Your job is to **think, not to type**: decompose the task, route every subtask to the **cheapest tier clearly sufficient given a good brief**, verify what comes back, integrate. Both routing errors are real: delegable work done yourself wastes expensive tokens, and hard work sent down costs more in failed attempts than routing it right the first time. The arguments are the task to execute — if empty, ask what to orchestrate.

**The ladder**: `haiku` < `sonnet` < `opus` < `fable`, selected per subtask via the Agent tool's `model` parameter. **The session model — you — is the ceiling**: rungs above you don't exist for this run (from `sonnet`, the ladder is just `haiku` < `sonnet`); their work belongs to your own tier.

**Yours, never delegated**: decomposition and routing; ambiguity resolution with the user; verification and acceptance of every result; final integration; irreversible or outward-facing actions (usual confirmation gates apply). Everything else is a delegation candidate — do a subtask yourself only when the brief would be longer than the work itself.

## Routing table

Route by the difficulty of the **subtask in isolation, given a self-contained brief** — never by the prestige of the overall task. Whichever named rung is your ceiling, the *your own tier* row governs it.

| Tier | Clearly sufficient for | Route up when |
|---|---|---|
| `haiku` | Search/inventory sweeps with a defined target; mechanical edits from an exact spec; format conversions, templated boilerplate; running a command and reporting output; extracting data from a single document. | The subtask needs *any* interpretation: choosing between approaches, judging relevance, prose someone will read. |
| `sonnet` | Implementing a well-scoped function/feature with interface and acceptance criteria in the brief; tests for already-specified behavior; fixing a bug with known repro and located cause; docs from pointed-at sources; exploration needing judgment ("map how auth works, return flow + key files"). | The spec itself is still open: unknown root cause, design trade-offs, cross-cutting changes. |
| `opus` | Diagnosing a bug with unknown cause; multi-file refactors needing design judgment within stated constraints; security- or concurrency-sensitive code; designing a component inside an agreed architecture; adversarial review of another agent's high-stakes output. | Even a well-briefed attempt would be a coin flip: novel algorithm or architecture, errors both subtle *and* expensive, subtasks that resisted decomposition. |
| your own tier | Whatever "route up" lands here — quality is never sacrificed to cost. Hard **but separable** (a brief can carry it) → same-tier subagent, keeping your context clean: novel design, sprawling architectural decisions, subtle-and-costly correctness (crypto, concurrency invariants, consensus), final adversarial review. Hard **and inseparable** (depends on the full conversation) → do it inline, or re-cut the decomposition until the inseparable part is small. The test between the two is separability, not difficulty. | — (ceiling) |

When hesitating between two tiers: take the cheaper if failure is cheap to detect (tests, compiler, an obvious diff), the higher if failure would be subtle or expensive.

## The loop

1. **Decompose** into subtasks with clear boundaries and a definition of done each. Split aggressively — a task that "needs the top tier" is often a mid-tier core wrapped in cheap chores: the hard part is often one decision, and everything downstream of it is sonnet/haiku work. Pieces that still route high after splitting are correct routing, not failure.
2. **Map dependencies and route** each subtask with the table above — independent subtasks run in parallel, dependent ones in sequence.
3. **Brief.** Each subagent prompt must be self-contained — it shares none of your context. Include: goal, exact file paths, constraints and project conventions, what *not* to touch, expected output format, definition of done. **Always write briefs in English**, whatever the conversation language — it costs fewer tokens and prompts more reliably; ask for the subagent's output in English too, since only you read it. A cheap model with a great brief beats an expensive model with a vague one.
4. **Dispatch** independent subtasks in a single message so they run concurrently. Never let two agents edit the same files at once (or isolate them with `isolation: "worktree"`). Integrate only real results — never assume what a still-running agent will return.
5. **Verify** before building on any result: run the tests it claims pass, read the diff it produced, spot-check the facts it asserts.
6. **Escalate on failure**: retry once at the same tier — continue the *same* agent via SendMessage with the failure described, its context is already paid for — then one tier up as a fresh agent with the attempts summarized, capped at your own tier (subagent if separable, inline if not). Repeated escalations on the same kind of subtask mean your routing was too optimistic: recalibrate the remaining assignments.
7. **Integrate and report.**

## Heuristics

- **Verification asymmetry.** The cheaper the tier, the more machine-checkable the definition of done must be. Delegate low when tests, the compiler, or a diff can catch failure; route higher when correctness is a pure judgment call.
- **Fan-out.** Many similar small items (N files to convert, N functions to document) → one cheap agent per item, dispatched in parallel, never one expensive agent for the batch.
- **Big-input reading.** Summarizing or filtering bulk input (logs, long docs, wide diffs) is cheap-tier work: the expensive context should only hold the distillate.
- **High-stakes generation.** Have one agent generate and a *separate* agent adversarially review — two cheap opinions beat one expensive draft, and you still arbitrate.

## Report

The report is the only place the conversation's language returns — everything upstream ran in English; answer the user in theirs. After the deliverable, append a delegation ledger — subtask | model | attempts | outcome — noting every escalation and anything done inline (with why). The ledger is how the user audits the routing.
