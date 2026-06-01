---
name: to-prd
description: Turn the current conversation context into a PRD and publish it as a parent GitHub issue. The PRD acts as a container document for vertical-slice work tickets created later. Use when the user wants to create a PRD from the current context.
---

# to-prd

Take the current conversation context and codebase understanding, produce a PRD, and publish it as a GitHub issue that will act as the **parent container** for vertical-slice work tickets.

Do NOT interview the user — synthesize what you already know. If genuinely missing context blocks the PRD, ask the minimum to unblock.

## Assumptions

- **GitHub** is the issue tracker. The PRD is published via `gh issue create`.
- The repo follows the bundle's documentation conventions where applicable: domain vocabulary in `CONTEXT.md` (or `.claude/GLOSSARY.md` in `structured` mode), decisions in `docs/adr/`. Reuse this vocabulary in the PRD.
- An upstream tracker (Jira, Linear, etc.) may exist as the parent of the PRD. Link to it, never modify it.

## Process

### 1. Explore the codebase

If not already done in the conversation, explore the repo to ground the PRD in real code. Use the project's domain vocabulary throughout and respect ADRs in the touched area.

### 2. Sketch modules

Sketch the major modules to build or modify. Actively look for **deep modules** testable in isolation.

> A deep module encapsulates a lot of functionality behind a simple, testable interface that rarely changes (as opposed to a shallow module).

Check with the user that the modules match their expectations and which ones they want tests for.

### 3. Write the PRD

Use the template at the end of this file. Reuse the project's language conventions (e.g. write in French if the codebase / `CLAUDE.md` / sibling issues are in French).

If a grilling session (`/grill-with-docs`) produced ADRs or `CONTEXT.md` updates relevant to this PRD, reference them by path in `## Implementation Decisions` rather than restating their content.

### 4. Publish the PRD as a GitHub issue

**Confirm the publication step with the user before running `gh issue create`** — creating an issue is an external/shared action.

- Apply the **`prd`** label, NOT a triage state label like `needs-triage`. The PRD is a **container document**, not a unit of work — the triage state machine applies to its sub-issues, not to the PRD itself. The `prd` label lets agents and maintainers skip containers when filtering "what needs my attention".
- Also apply the relevant **category** label (`enhancement` or `bug`) since the underlying work has a category, even if the PRD itself isn't actionable directly.
- If the `prd` label does not exist on the repo, create it first:
  ```bash
  gh label create prd --description "Container document — work happens in sub-issues, not on this issue" --color 5319e7
  ```
- If a parent ticket exists in an upstream tracker (Jira, Linear, etc.), reference it in the title prefix **and** in the `## Parent` section of the body. Title format: `[TICKET-ID] subject`. Without an upstream parent, just `subject`.

### 5. Surface the issue number

After publication, output the PRD issue number explicitly and suggest the next step without launching it:

> "PRD published as #1234. When ready, run `/to-issues #1234` to break it into vertical slices attached as sub-issues."

Do NOT close, transition, or comment on any parent ticket on an external tracker.

## PRD Template

```markdown
## Parent

A reference to the parent ticket on the upstream tracker (Jira/Linear/etc.), if one exists. Otherwise omit this section.

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each in the format:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list should be extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions made:

- The modules to be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions (link to ADRs in `docs/adr/` when relevant)
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets — they rot quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts.

## Testing Decisions

- What makes a good test here (external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests in the codebase

## Out of Scope

What is explicitly out of scope for this PRD.

## Further Notes

Any further notes about the feature.
```
