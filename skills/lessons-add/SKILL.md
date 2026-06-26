---
name: lessons-add
description: Append a lesson to .claude/LESSONS.md when the user corrects Claude on a project-specific, generalisable rule. Use on explicit request ("add to lessons", "/lessons add", "remember this") or when the user has just corrected such a rule — in the implicit case, confirm before writing. Consolidate with existing entries rather than duplicate.
---

# lessons-add

Capture a lesson from a user correction into `.claude/LESSONS.md` of the current project, in a compact ID-prefixed format.

## Steps

**1. Locate, read & gate** — open `.claude/LESSONS.md` at the project root. If it does not exist, propose creating a minimal `.claude/LESSONS.md`. Scan for duplicates: if a similar entry exists, propose update or consolidation rather than a new line; if truly redundant, abandon. If the rule already lives in a `CLAUDE.md` or a skill (Claude just forgot it once), don't add a lesson — reinforce the existing doc or add a hook instead.

**2. Read the prefix list** — each project defines its own ID prefixes at the top of `LESSONS.md`, under a header like `ID prefixes`, `Préfixes ID`, or equivalent. Pick the one that fits. If none fits, propose adding a new one (rare). If the header is in French (`Préfixes ID : SF · DB …`), the parsing still works.

**3. Confirm if implicit** — on an explicit request, proceed. On an implicit trigger (the user just corrected Claude on a generalisable rule, including when `grill-with-docs` delegates a lesson-write here), ask for confirmation before writing.

**4. Build & insert the entry** — write it in the same language as the existing `LESSONS.md` entries (French, English, or other), regardless of the conversation language:

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

**5. Report** to the user: `"Added <ID> — <title> to .claude/LESSONS.md."`. If a git remote is present (team-versioned), append: `"Shared on next git pull."`

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

## Maintenance

Beyond ~150 entries, or when `LESSONS.md` becomes unreadable: propose a manual review to the user (merge duplicates, drop obsolete entries, sharpen vague ones). Don't run it autonomously.
