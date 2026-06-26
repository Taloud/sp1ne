# Sub-issue vs. blocking — keep them separate

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
