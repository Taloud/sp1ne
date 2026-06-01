---
name: to-issues
description: Break a PRD into independently-grabbable vertical-slice issues on GitHub, each attached as a native sub-issue of the parent PRD. Use when the user wants to convert a PRD (typically created by /to-prd) into implementation tickets, or break down work into sub-issues with proper hierarchy.
---

# to-issues

Break a PRD into **tracer-bullet vertical-slice issues**, each attached as a **native GitHub sub-issue** of the parent PRD. The PRD's progress summary then aggregates slice completion automatically.

## Setup expected on the repo

This skill assumes a **GitHub** repo where slices enter triage via the **`needs-triage`** label. If that label is missing, create it on the fly the first time you need it:

```bash
gh label create needs-triage --description "Maintainer needs to evaluate" --color fbca04
```

If the repo uses a different label name for the triage state (e.g. `bug:triage`), substitute it everywhere `needs-triage` is referenced below.

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

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so. Issue titles and descriptions should use the project's domain glossary, and respect ADRs in the area you're touching.

### 3. Draft vertical slices

Break the plan into tracer-bullet issues. Each slice cuts through ALL integration layers end-to-end (schema, API, UI, tests) — NOT a horizontal slice of one layer.

Slices may be HITL or AFK:
- **HITL** — requires human interaction (architectural decision, design review)
- **AFK** — can be implemented and merged without human interaction

Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

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

### 5. Publish slices and attach as sub-issues

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

### Sub-issue vs. blocking — keep them separate

**Containment (sub-issue) and dependency (blocked-by) model different relationships. Do NOT conflate them:**

| Relationship | Meaning | How to express |
|---|---|---|
| Slice belongs to PRD | Containment | `sub_issues` API attachment to PRD |
| Slice X is blocked by slice Y | Dependency | Textual `## Blocked by #Y` in body |

Reasons to keep dependencies textual instead of nesting blocked slices as sub-sub-issues:

- The PRD's sub-issue progress summary needs every slice as a **direct** child to count correctly. Nesting hides slices from the count.
- A slice can be blocked by **multiple** other slices; sub-issue parenthood is single-parent — the model breaks for multi-blocker cases.
- A closed blocker with an open dependent looks visually "incomplete" in GitHub's UI when nested, even though the blocker is genuinely done.

**Optional enhancement** for blocking relationships: in the *blocker* slice's body, add a task list referencing dependents (e.g. `- [ ] #1108 — slice 2 unblocks here`). When #1108 closes GitHub auto-checks the box. Pure ergonomics, not a substitute for the textual `## Blocked by`.

## Issue body template

```markdown
## Parent

A reference to the parent PRD issue: `#<PRD_NUMBER>`.

(Optional: also reference the upstream tracker, e.g. `<TRACKER>: <TICKET-ID>` if the PRD itself references one.)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (e.g. `#1107`)

Or "None - can start immediately" if no blockers.
```

Do NOT close or modify the parent PRD issue. Do NOT modify any external tracker entry.
