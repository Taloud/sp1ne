# Handoff document scaffold

Fill only the sections that apply. Keep each to what the next agent needs — reference artifacts by path or URL instead of recopying them.

```markdown
# Handoff — <topic> — <YYYY-MM-DD HH:MM>

## Context

One short paragraph: what the session was about, the user's overarching goal, the relevant repo / branch / area of the codebase. Keep it to what the next agent needs to orient — not a full project briefing.

## Where we are

Bullet list of the concrete state at handoff time:
- What's been decided / done
- What's in progress (file changed but not committed, branch pushed but not merged, etc.)
- What's blocked or unresolved

Reference artifacts by path or URL — do not recopy their contents.

## What's next

Ordered list of the immediate next steps the fresh agent should take. Be specific:
- "Open PR #1234 and address the review comments around `OrderService`"
- "Run `/to-issues #1234` to break the PRD into slices"
- "Resume the grilling session on the Termination value object — see ADR draft in `docs/adr/0042-...md`"

Name the next skill in context where it helps (e.g. `/to-issues #1234`). If the fresh session is unsure where to start, it can run `/sp1ne` to see the whole flow.

## References

Links and paths only, no content copy:
- PRD: `#1234` or `https://github.com/.../issues/1234`
- ADRs touched: `docs/adr/0042-...md`
- Branch / commit: `feature/foo-bar @ abc1234`
- Related issues, slices, PRs
- External tracker tickets (Jira, Linear) if any
```
