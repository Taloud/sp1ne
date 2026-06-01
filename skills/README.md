# Skills

Single source of truth for my Claude skills. Edits here propagate instantly to every personal project (via the global symlinks created by `install link`). Team repos opt in deliberately via `install push`.

## Catalog

| Skill | Purpose |
|---|---|
| `grill-with-docs` | Stress-test a plan against the project's docs (auto-detects layout) and update artifacts inline. |
| `to-prd` | Synthesize current context into a PRD published as a parent GitHub issue. |
| `to-issues` | Break a PRD into vertical-slice GitHub sub-issues. |
| `triage` | Triage GitHub issues through a small state machine of roles. |
| `tdd` | Test-driven development with the red-green-refactor loop, anchored in project docs. |
| `check-conventions` | Verify a diff against the project's documented conventions (glossary, ADRs, lessons). Read-only. |
| `lessons-add` | Append a structured lesson to `.claude/LESSONS.md` when the user corrects Claude on a generalisable rule. |
| `handoff` | Compact the current conversation into a handoff document for a fresh session. |
| `pr-description` | Generate a PR description from the current branch's diff. Auto-detects Jira, parent issue, impacted areas, and Playwright URLs from the project's own config. Output in French. |

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

## Conventions inside this folder

- Skill instructions are written in **English** — they live in this bundle and are read by Claude. The skill's runtime output should match the **conversation language** (most skills detect it automatically; a few are intentionally locked to the team language, e.g. `pr-description` outputs French).
- Each skill is self-contained. The doc-layout detection table (`structured` / `domain` / `light` / `bootstrap`) is duplicated across `grill-with-docs`, `check-conventions`, and `tdd` on purpose — keep them in sync when editing.
- Cross-skill references (`/to-prd`, `/lessons-add`, etc.) assume the referenced skill is available either in the bundle or globally in `~/.claude/skills/`. Skills the user keeps personal (like `pr-review`) live outside the bundle.
