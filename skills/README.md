# Skills

Single source of truth for my Claude skills. Edits here propagate instantly to every personal project (via the global symlinks created by `install link`). Team repos opt in deliberately via `install push`.

## Catalog

Each skill is **user-invoked** (you type its slash-command; `disable-model-invocation: true`, so its description never loads into the model's context) or **model-invoked** (Claude can reach for it on its own — or another skill can — so it keeps a trigger-rich description that costs context every turn).

### User-invoked

| Skill | Purpose |
|---|---|
| `sp1ne` | **Router** — names every skill and the flow that links them. Start here when you're unsure which to run. |
| `grill-with-docs` | Stress-test a plan against the project's docs (auto-detects layout) and update artifacts inline. |
| `to-prd` | Synthesize current context into a PRD published as a parent GitHub issue. |
| `to-issues` | Break a PRD into vertical-slice GitHub sub-issues. |
| `triage` | Triage GitHub issues through a small state machine of roles. |
| `handoff` | Compact the current conversation into a handoff document for a fresh session. |
| `pr-description` | Generate a PR description from the current branch's diff. Auto-detects Jira, parent issue, impacted areas, and Playwright URLs from the project's own config. Output in French. |

### Model-invoked

| Skill | Purpose |
|---|---|
| `tdd` | Test-driven development with the red-green-refactor loop, anchored in project docs. |
| `check-conventions` | Verify a diff against the project's documented conventions (glossary, ADRs, lessons). Read-only. |
| `lessons-add` | Append a structured lesson to `.claude/LESSONS.md` when the user corrects Claude on a generalisable rule. |

## Add a new skill

```bash
mkdir my-skill
cat > my-skill/SKILL.md <<'EOF'
---
name: my-skill
description: Triggers and capabilities (used by Claude to decide when to invoke).
---

# Skill content (instructions, what-to-do, supporting-info...)
EOF

../install link
git add my-skill && git commit -m "skill: add my-skill"
```

**Pick the invocation up front.** If only *you* will ever run it, add `disable-model-invocation: true` to the frontmatter and write a one-line, human-facing `description` (no trigger lists). If Claude should reach for it on its own — or another skill must — omit the flag and write a trigger-rich, model-facing `description`. See the taxonomy below.

## Conventions inside this folder

- **Invocation taxonomy.** Every skill is either **user-invoked** (`disable-model-invocation: true`; a human-facing one-line `description`, no trigger lists) or **model-invoked** (no flag; a trigger-rich, model-facing `description` that costs context every turn). The test for model-invoked: *could Claude usefully reach for it on its own, or must another skill reach it?* A user-invoked skill may invoke model-invoked skills, but never another user-invoked one.
- Skill instructions are written in **English** — they live in this bundle and are read by Claude. The skill's runtime output should match the **conversation language** (most skills detect it automatically; a few are intentionally locked to the team language, e.g. `pr-description` outputs French).
- Each skill is self-contained. The doc-layout detection table (`structured` / `domain` / `light` / `bootstrap`) is still duplicated across `grill-with-docs`, `check-conventions`, and `tdd` — keep the copies in sync when editing. (The mode *names* are now single-sourced; a future model-invoked `/detect-doc-layout` could own the detection itself.)
- Cross-skill references (`/to-prd`, `/lessons-add`, etc.) assume the referenced skill is available either in the bundle or globally in `~/.claude/skills/`. Skills the user keeps personal (like `pr-review`) live outside the bundle.
