---
name: lessons-add
description: Append an entry to .claude/LESSONS.md when the user corrects Claude on a project-specific, generalisable mistake. Triggers explicitly on "add to lessons", "/lessons add", "remember this", "don't forget that…", "you forgot X (note for later)". On an implicit trigger (the user just corrected Claude on a clear, generalisable rule), ALWAYS ask for confirmation before writing. Avoid duplicates — consolidate with existing entries.
---

# lessons-add

Capture a correction from the user into `.claude/LESSONS.md` of the current project, in a compact ID-prefixed format. If the project is team-versioned, the entry is shared on the next `git pull`.

## Steps

**1. Locate & read** — open `.claude/LESSONS.md` at the project root. If it does not exist, propose bootstrapping the project documentation layout or creating a minimal file. Scan for duplicates: if a similar entry exists, propose update or consolidation rather than a new line; if truly redundant, abandon.

**2. Read the prefix list** — each project defines its own ID prefixes at the top of `LESSONS.md`, under a header like `ID prefixes`, `Préfixes ID`, or equivalent. Pick the one that fits. If none fits, propose adding a new one (rare).

**3. Build & insert the entry**:

- **Title**: one-line factual rule (infinitive verb or short imperative).
- **Rule**: the correct approach in one sentence, actionable. Include a short inline example if useful.
- **Why**: optional — only if not obvious from the rule.
- **Ref**: optional — doc, skill, file, or PR.
- **ID**: `grep "^### <PREFIX>-" .claude/LESSONS.md` → max + 1, 3 digits (`SF-002`, `DB-003`).

Append under the matching category section (create the section if missing). Format:

```markdown
### <ID> — <title>
<actionable rule>. *Why*: <reason>. → <ref> · YYYY-MM-DD
```

Variants: drop *Why* if obvious. Drop ` → <ref>` if none. Always keep the date.

**4. Confirm** to the user: `"Added <ID> — <title> to .claude/LESSONS.md."`. If a git remote is present (team-versioned), append: `"Shared on next git pull."`

## Example

User: _"Don't run `composer update` without scoping it — it bumps everything and breaks staging."_

After confirming with the user, append under the `BLD` section:

```markdown
### BLD-003 — Scope `composer update` to a specific package
Always pass a package name (or `--lock`) on `composer update`. *Why*: unscoped updates have broken staging deploys repeatedly. → previous incident · 2026-05-21
```

## Quality criteria

- **Specific**: a concrete rule tied to a real pattern in the codebase, not universal advice ("watch for null" → too vague; "before renaming a shared interface, list its consumers via grep" → concrete).
- **Generalisable**: a recurring rule, not a one-off bug.
- **Actionable**: the reader knows what to do after one read.
- **Short**: 2-3 lines max — `LESSONS.md` is loaded at the start of non-trivial tasks; tokens add up.

## Anti-patterns

- Duplicating an existing lesson → consolidate instead.
- Adding a lesson when the rule already lives in a `CLAUDE.md` or a skill (Claude just forgot it once) → reinforce the existing doc or add a hook, not a new lesson.
- Verbose prose instead of the structured format.
- Project-agnostic advice → does not belong here.
- Implicit trigger + writing without explicit confirmation.

## Maintenance

Beyond ~150 entries, or when `LESSONS.md` becomes unreadable: propose a manual review to the user (merge duplicates, drop obsolete entries, sharpen vague ones). Don't run it autonomously.

## Notes

- When `lessons-add` is invoked indirectly by `grill-with-docs` (which delegates lesson-writes here), the trigger is implicit-but-permission-checked — the same confirmation rule applies before writing.
- The skill reads the project's existing header to discover prefixes; it does not impose its own set. If the header is in French (`Préfixes ID : SF · DB …`) the parsing still works.
