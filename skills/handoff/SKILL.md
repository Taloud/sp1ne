---
name: handoff
description: Compact the current conversation into a handoff document for a fresh agent to pick up.
disable-model-invocation: true
argument-hint: "What will the next session be used for?"
---

# handoff

## Output location and naming

Save the document to the OS temporary directory (`$TMPDIR` on macOS, typically `/var/folders/...`). **Do not** save it inside the user's workspace.

**If the `$HANDOFF_DIR` environment variable is set**, also write a copy of the same document there (creating the directory if needed). This gives the user a stable, persistent location for handoffs in addition to the ephemeral temp copy. Write to both locations with the same filename; if `$HANDOFF_DIR` is unset or empty, only write to `$TMPDIR`.

Filename convention: `handoff-<kebab-topic>-<YYYYMMDD-HHMM>.md`

Examples:
- `handoff-prd-checkout-flow-20260528-1530.md`
- `handoff-triage-backlog-20260528-1742.md`

This lets the user find recent handoffs with `ls -t $TMPDIR/handoff-*.md` (or `ls -t $HANDOFF_DIR/handoff-*.md` when configured).

## Language

Write the document in the language of the current conversation (detect from user messages and recently-touched docs like `CLAUDE.md`). When in doubt, ask.

## Content rules

- **Do not duplicate content already captured in other artifacts** (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead — the next agent can read them.
- **Redact sensitive information**: API keys, passwords, tokens, personally identifiable information, internal URLs that shouldn't leave the session.
- **If the user passed arguments**, treat them as a description of what the next session will focus on and tailor the doc accordingly (skew "What's next" toward that focus).

## Template

Write the document using the scaffold in [`TEMPLATE.md`](TEMPLATE.md) (same directory). Fill only the sections that apply.

## Closing the session

After writing the file, surface the path(s) explicitly with a one-liner on how to resume. When you wrote to both locations, mention both (prefer the `$HANDOFF_DIR` copy for resuming, since it's persistent):

> "Handoff écrit dans `<path>`. Dans la prochaine session, lance `cat <path>` et colle le contenu en début de message, ou référence-le directement."

(Use the English variant of the closing line if the conversation is in English.)
