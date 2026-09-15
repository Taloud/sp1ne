---
name: handoff
description: Compact the current conversation into a handoff document for a fresh agent to pick up.
disable-model-invocation: true
argument-hint: "What's next, or --bg to launch it now"
---

# handoff

## Output location and naming

Save the document to the OS temporary directory (`$TMPDIR` on macOS, typically `/var/folders/...`). **Do not** save it inside the user's workspace on your own, unless the user has explicitly opted into a location via `$HANDOFF_DIR` (below).

**If the `$HANDOFF_DIR` environment variable is set**, also write a copy of the same document there (creating the directory if needed). This gives the user a stable, persistent location for handoffs in addition to the ephemeral temp copy. Write to both locations with the same filename; if `$HANDOFF_DIR` is unset or empty, only write to `$TMPDIR`. Quote the path when creating it (`mkdir -p "$HANDOFF_DIR"`) and never clobber an existing file: suffix `-2` on a name collision. If `$HANDOFF_DIR` resolves inside the repo, mention it may be committed (suggest gitignoring it).

Filename convention: `handoff-<kebab-topic>-<YYYYMMDD-HHMM>.md`

Examples:
- `handoff-prd-checkout-flow-20260528-1530.md`
- `handoff-triage-backlog-20260528-1742.md`

This lets the user find recent handoffs with `ls -t $TMPDIR/handoff-*.md` (or `ls -t $HANDOFF_DIR/handoff-*.md` when configured).

## Language

Write the document in the language of the current conversation (detect from user messages and recently-touched docs like `CLAUDE.md`). When in doubt, ask.

## Content rules

- **Do not duplicate content already captured in other artifacts** (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead: the next agent can read them.
- **Redact sensitive information**: API keys, passwords, tokens, personally identifiable information, internal URLs that shouldn't leave the session.
- **If the user passed arguments**, treat them as a description of what the next session will focus on and tailor the doc accordingly (skew "What's next" toward that focus).

## Template

Write the document using the scaffold in [`TEMPLATE.md`](TEMPLATE.md) (same directory). Fill only the sections that apply.

## Modes: write (default) vs launch

Two modes. **Write** (default) only produces the handoff file, as above. **Launch** is opt-in: trigger it only when the user explicitly asks for it (e.g. "launch it", "start it in the background", "hand off and run") or the argument contains `--bg`. Never launch unprompted.

In launch mode:

1. Still write the handoff file first (paper trail), following the same output-location, naming, and template rules above.
2. Start a fresh background session in the current working directory, passing the handoff summary itself as its prompt (self-contained, so it doesn't depend on any file being read later):
   ```bash
   claude --bg --name "<short descriptive name>" "<handoff summary>"
   ```
3. Build `<handoff summary>` from the same content as the file: since it becomes a literal prompt, redact secrets and tokens, and reference specs, ADRs and issues by path or URL rather than restating them. Always include the "Suggested skills" section from `TEMPLATE.md` so the new session knows which skills to call. Mention the handoff file's path inside the prompt as a reference for extra detail.
4. Pick `<short descriptive name>` from the topic (kebab-case, short, matches the filename's `<kebab-topic>`).

## Closing the session

**Write mode:** after writing the file, surface the path(s) explicitly with a one-liner on how to resume. When you wrote to both locations, mention both (prefer the `$HANDOFF_DIR` copy for resuming, since it's persistent):

> "Handoff écrit dans `<path>`. Dans la prochaine session, lance `cat <path>` et colle le contenu en début de message, ou référence-le directement."

(Use the English variant of the closing line if the conversation is in English.)

**Launch mode:** after starting the session, tell the user its name and that `claude agents` lists it:

> "Handoff écrit dans `<path>`, et la session `<name>` tourne en arrière-plan. Utilise `claude agents` pour la retrouver."

(Use the English variant if the conversation is in English: "Handoff written to `<path>`, and session `<name>` is running in the background. Use `claude agents` to find it.")
