---
name: to-issues
description: Break a PRD into vertical-slice GitHub issues, each attached as a native sub-issue of the parent PRD.
disable-model-invocation: true
---

# to-issues

Break a PRD into **tracer-bullet vertical-slice issues**, each attached as a **native GitHub sub-issue** of the parent PRD. The PRD's progress summary then aggregates slice completion automatically.

## Setup expected on the repo

This skill assumes a **GitHub** repo where slices enter triage via the **`needs-triage`** label. If that label is missing, create it on the fly the first time you need it:

```bash
gh label create needs-triage --description "Maintainer needs to evaluate" --color fbca04
```

If the repo uses a different triage-state label (e.g. `bug:triage`), substitute it throughout.

The parent PRD itself is expected to carry a `prd` label (set by `/to-prd`); this skill only writes slices and does not need to create the `prd` label.

## Input

A reference to the parent PRD issue (REQUIRED):

- A GitHub issue number (`#1234`) on the current repo, or
- A full GitHub issue URL (`https://github.com/<owner>/<repo>/issues/1234`), or
- The conversation context if a PRD was just published (use the most-recently-published one).

**If no parent PRD reference is available, ask the user — do NOT proceed without one.** This skill exists specifically to attach slices as sub-issues; without a parent there is nothing to attach to.

## Process

### 1. Gather context

Fetch the parent PRD issue with `gh issue view <number> --repo <owner>/<repo> --json labels,title,body,comments` and read its full body and comments.

**Sanity check the parent is actually a PRD container:** verify the `prd` label is present in the returned labels. If absent, ask the user:

> "Issue #<N> does not carry the `prd` label — it does not look like a PRD container. Continue anyway?"

Do not proceed without explicit confirmation when the label is missing.

**Explore the codebase and load the domain language.** If the conversation hasn't already done so, explore the repo to understand the current state and read the domain vocabulary (`CONTEXT.md` / `.claude/GLOSSARY.md`) so slice titles and bodies use canonical terms. For a large repo, delegate the exploration to a sub-agent so it doesn't crowd the context. Note any **prefactoring** opportunity — "make the change easy, then make the easy change" — and surface it as the first slice (or a pre-slice) when the change lands cleaner after a refactor.

### 2. Draft vertical slices

Break the plan into tracer-bullet issues, using the project's domain glossary in titles and descriptions and respecting ADRs in the area you're touching.

<vertical-slice-rules>
- First decide whether the PRD even needs breaking down: split only when the slices have **separable failure modes** or can progress in parallel. If the work is one indivisible path, a single issue is the honest answer — don't manufacture slices.
- Each slice cuts through ALL integration layers end-to-end (schema, API, UI, tests) — NOT a horizontal slice of one layer
- Each slice delivers a narrow but COMPLETE path through every layer
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

Slices may be HITL or AFK:
- **HITL** — requires human interaction (architectural decision, design review)
- **AFK** — can be implemented and merged without human interaction

### 3. Quiz the user

Present the proposed breakdown as a numbered list. For each slice show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses

Ask:
- Granularity OK? (too coarse / too fine)
- Dependency relationships correct?
- Slices to merge or split?
- Correct slices marked HITL/AFK?

Iterate until the user approves the breakdown.

### 4. Publish slices and attach as sub-issues

**Confirm the publication step with the user before running any `gh` write commands** — creating issues is an external/shared action.

For each approved slice, **in dependency order (blockers first)** so real issue numbers can be referenced in subsequent slices' "Blocked by":

1. **Create the issue:**
   ```bash
   gh issue create --repo <owner>/<repo> \
     --title "<title>" \
     --label needs-triage \
     --body "<body>"
   ```
   Slice titles **inherit the parent PRD's title prefix convention** (e.g. an upstream ticket key like `[TICKET-ID]` if the PRD uses one).

2. **Capture the slice's issue number** from the returned URL (`.../issues/<N>`).

3. **Capture the slice's internal numeric ID:**
   ```bash
   gh api repos/<owner>/<repo>/issues/<N> --jq '.id'
   ```

4. **Attach as native sub-issue of the parent PRD:**
   ```bash
   gh api -X POST repos/<owner>/<repo>/issues/<PRD_NUMBER>/sub_issues \
     -F sub_issue_id=<INTERNAL_ID>
   ```

   **Gotchas:**
   - The sub-issues API expects an **integer**. Use `-F` (raw value), NOT `-f` (which sends a string and returns HTTP 422).
   - Use the **internal `id`** (a long integer like `4348893561`), NOT the human-readable issue `number`.

Containment (sub-issue) and dependency (blocked-by) are different relationships — never nest a blocked slice as a sub-sub-issue. For the reasoning, see containment-vs-dependency.md.

## Issue body template

```markdown
## Parent

A reference to the parent PRD issue: `#<PRD_NUMBER>`.

(Optional: also reference the upstream tracker, e.g. `<TRACKER>: <TICKET-ID>` if the PRD itself references one.)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Describe it as *behavior* in the project's domain language — avoid specific file paths, line numbers, or internal module names, which rot before the slice is picked up. Exception: if a prototype or a prior decision produced a snippet that encodes the decision more precisely than prose can (state machine, reducer, schema, type shape), inline it trimmed to the decision-rich parts.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (e.g. `#1107`)

Or "None - can start immediately" if no blockers.
```

Do NOT close or modify the parent PRD issue.
