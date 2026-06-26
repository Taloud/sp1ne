---
name: to-prd
description: Turn the current conversation into a PRD published as a parent GitHub issue — a container document for the vertical-slice work tickets created later.
disable-model-invocation: true
---

# to-prd

Do NOT interview the user — synthesize what you already know. If genuinely missing context blocks the PRD, ask the minimum to unblock.

## Assumptions

- **GitHub** is the issue tracker. The PRD is published via `gh issue create`.
- The repo follows the bundle's documentation conventions where applicable: domain vocabulary in `CONTEXT.md` (or `.claude/GLOSSARY.md` in `structured` mode), decisions in `docs/adr/`.
- An upstream tracker (Jira, Linear, etc.) may exist as the parent of the PRD. Link to it, never modify it.

## Process

### 1. Explore the codebase

If not already done in the conversation, explore the repo to ground the PRD in real code, respecting ADRs in the touched area.

### 2. Sketch modules

Sketch the major modules to build or modify. Actively look for **deep modules** testable in isolation.

> A deep module encapsulates a lot of functionality behind a simple, testable interface that rarely changes (as opposed to a shallow module).

Check with the user that the modules match their expectations and which ones they want tests for.

### 3. Write the PRD

Write the PRD using the template in [`prd-template.md`](prd-template.md). Reuse the project's language conventions (e.g. write in French if the codebase / `CLAUDE.md` / sibling issues are in French).

If a grilling session (`/grill-with-docs`) produced ADRs or `CONTEXT.md` updates relevant to this PRD, reference them by path in `## Implementation Decisions` rather than restating their content.

**If the `$PRD_DIR` environment variable is set**, also write the PRD markdown to a file there (creating the directory if needed). This gives the user a persistent local copy alongside the published GitHub issue. Filename convention: `prd-<kebab-subject>-<YYYYMMDD-HHMM>.md`. If `$PRD_DIR` is unset or empty, skip this — the GitHub issue remains the source of truth.

### 4. Publish the PRD as a GitHub issue

**Confirm the publication step with the user before running `gh issue create`** — creating an issue is an external/shared action.

- Apply the **`prd`** label, NOT a triage state label like `needs-triage` — the PRD is a **container document**, not a unit of work, so the triage state machine applies to its sub-issues, not to the PRD itself.
- Also apply the relevant **category** label (`enhancement` or `bug`) since the underlying work has a category, even if the PRD itself isn't actionable directly.
- If the `prd` label does not exist on the repo, create it first:
  ```bash
  gh label create prd --description "Container document — work happens in sub-issues, not on this issue" --color 5319e7
  ```
- If a parent ticket exists in an upstream tracker (Jira, Linear, etc.), reference it in the title prefix **and** in the `## Parent` section of the body. Title format: `[TICKET-ID] subject`. Without an upstream parent, just `subject`.

### 5. Surface the issue number

After publication, output the PRD issue number explicitly and suggest the next step without launching it. If you also wrote a local copy to `$PRD_DIR`, surface that path too:

> "PRD published as #1234. When ready, run `/to-issues #1234` to break it into vertical slices attached as sub-issues."
