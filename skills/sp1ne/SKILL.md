---
name: sp1ne
description: Which sp1ne skill fits your situation — a router over the bundle's skills and the flow that links them.
disable-model-invocation: true
---

# sp1ne

You don't remember every skill, so ask. This names them and says when to reach for each — it never runs them, it tells you what to type.

A **flow** is a path through the skills. Most work runs along one **main flow**; an **on-ramp** merges onto it, and a few skills stand alone.

## Main flow: idea → ship

The route most work travels — you have an idea and want it built.

1. **`/grill-with-docs`** — sharpen the idea by interview, against the project's own docs. Start here when you have a codebase: it's stateful, writing what it learns to `CONTEXT.md` / `GLOSSARY.md` / `LESSONS.md` / ADRs as decisions crystallise.
2. **`/to-prd`** — once the idea holds together, synthesize the thread into a PRD published as a **parent GitHub issue** (a container document, not a unit of work).
3. **`/to-issues`** — split that PRD into independently-grabbable vertical slices, attached as native sub-issues.

Then **clear context and work one slice per fresh session**. There is no implement skill — you build directly, and the model-invoked skills below (`/tdd`, `/check-conventions`, `/lessons-add`) assist on their own as you go.

### Context hygiene

Keep steps 1–3 in **one unbroken context window** — don't compact or clear until after `/to-issues` — so the grilling, the PRD, and the issues all build on the same thinking. If the session grows too long before `/to-issues`, don't push on degraded: `/handoff` and continue fresh.

## On-ramp

A starting situation that generates work, then merges onto the main flow.

- **Work arriving from outside** (a filed bug or feature request, not a conversation) → **`/triage`**. It moves issues through the triage-role state machine, runs a `/grill-with-docs` session when an issue needs fleshing out, and produces agent-ready slices. Triage is only for issues you **didn't** create — issues `/to-issues` produced are already ready, so don't re-triage them.

## Standalone

Off the main flow — reach for these at a specific moment.

- **`/handoff`** — when a session is full or you need to branch off, compact the conversation into a markdown doc, then open a **fresh session** and reference that file. The bridge between context windows. (Use the built-in `/compact` instead when you want to stay in the same conversation across a phase break — `/handoff` forks, `/compact` continues.)
- **`/pr-description`** — French, paste-ready PR text from the current branch's diff, right before you open the PR.

## These fire on their own — don't type them

Model-invoked skills: Claude reaches for them autonomously (or another skill does). Listed here so you know they aren't yours to summon.

- **`/tdd`** — the red-green-refactor loop, when building a feature or fixing a bug test-first. It works against the **seams the PRD already agreed on** (`/to-prd` step 2): the test boundary is decided upstream, so building a slice means filling in behind a known seam, not re-litigating the design. This is why there's no implement skill — free-build the slice, and reach for the loop where a pre-agreed seam needs covering.
- **`/check-conventions`** — verifies a diff against the project's docs; fires proactively after a non-trivial change or before a PR.
- **`/lessons-add`** — captures a lesson when you correct Claude on a generalisable, project-specific rule.
