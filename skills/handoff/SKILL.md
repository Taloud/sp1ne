---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up in a fresh session. Use when the user wants to wrap up a session and prepare a baton-pass.
argument-hint: "What will the next session be used for?"
---

# handoff

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

## Output location and naming

Save the document to the OS temporary directory (`$TMPDIR` on macOS, typically `/var/folders/...`). **Do not** save it inside the user's workspace.

Filename convention: `handoff-<kebab-topic>-<YYYYMMDD-HHMM>.md`

Examples:
- `handoff-prd-checkout-flow-20260528-1530.md`
- `handoff-triage-backlog-20260528-1742.md`

This lets the user find recent handoffs with `ls -t $TMPDIR/handoff-*.md`.

## Language

Write the document in the language of the current conversation (detect from user messages and recently-touched docs like `CLAUDE.md`). When in doubt, ask.

## Content rules

- **Do not duplicate content already captured in other artifacts** (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead — the next agent can read them.
- **Redact sensitive information**: API keys, passwords, tokens, personally identifiable information, internal URLs that shouldn't leave the session.
- **If the user passed arguments**, treat them as a description of what the next session will focus on and tailor the doc accordingly (skew "What's next" toward that focus).

## Template

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

If the user passed `$ARGUMENTS`, the focus of "What's next" should match it.

## Suggested skills

List bundle skills the next agent should consider invoking, with a one-line reason each. Only include skills that are objectively next steps for the current state — don't be exhaustive.

Examples (pick what applies):
- `/grill-with-docs` — to finish stress-testing the plan against `CONTEXT.md`
- `/to-prd` — to publish the agreed PRD as a GitHub issue
- `/to-issues #<PRD>` — to break the PRD into vertical slices
- `/triage` — to evaluate incoming issues and route them
- `/lessons-add` — if a generalisable rule emerged during the session

## References

Links and paths only, no content copy:
- PRD: `#1234` or `https://github.com/.../issues/1234`
- ADRs touched: `docs/adr/0042-...md`
- Branch / commit: `feature/foo-bar @ abc1234`
- Related issues, slices, PRs
- External tracker tickets (Jira, Linear) if any
```

## Closing the session

After writing the file, surface the path explicitly with a one-liner on how to resume:

> "Handoff écrit dans `<path>`. Dans la prochaine session, lance `cat <path>` et colle le contenu en début de message, ou référence-le directement."

(Use the English variant of the closing line if the conversation is in English.)
