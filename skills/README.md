# Skills

Single source of truth for my Claude skills, shipped as the `sp1ne` Claude Code plugin (marketplace `taloud-plugins`). Every push to `main` is a release; consumers on `autoUpdate` pick it up at the next startup. See the [root README](../README.md) for install and local plugin development.

## Catalog

Each skill is **user-invoked** (you type its slash-command; `disable-model-invocation: true`, so its description never loads into the model's context) or **model-invoked** (Claude can reach for it on its own, or another skill can, so it keeps a trigger-rich description that costs context every turn).

### User-invoked

| Skill | Purpose |
|---|---|
| `sp1ne` | **Router**: names every skill and the flow that links them. Start here when you're unsure which to run. |
| `grill-with-docs` | Stress-test a plan against the project's docs (auto-detects layout) and update artifacts inline. |
| `to-prd` | Synthesize current context into a PRD published as a parent GitHub issue. |
| `to-issues` | Break a PRD into vertical-slice GitHub sub-issues. |
| `triage` | Triage GitHub issues through a small state machine of roles. |
| `handoff` | Compact the current conversation into a handoff document for a fresh session. |
| `pr-description` | Generate a PR description from the current branch's diff. Auto-detects Jira, parent issue, impacted areas, and Playwright URLs from the project's own config. Output in French. |
| `bootstrap-project` | Scaffold a new project's `CLAUDE.md` + `.claude/` docs from a template (`generic` or `symfony`). Non-destructive. Replaces the old `install init`. |

### Model-invoked

| Skill | Purpose |
|---|---|
| `project-docs` | The documentation layer: detects the project's doc layout (`structured` / `domain` / `light` / `bootstrap`) and owns what to read, what may be written, and the ADR / CONTEXT / LESSONS formats. Consumed by `grill-with-docs`, `check-conventions`, `tdd`. |
| `tdd` | Test-driven development with the red-green-refactor loop, anchored in project docs. |
| `check-conventions` | Verify a diff against the project's documented conventions (glossary, ADRs, lessons). Read-only. |
| `lessons-add` | Append a structured lesson to `.claude/LESSONS.md` when the user corrects Claude on a generalisable rule. |
| `grilling` | The interview engine, relentless, one question at a time. Invoked by `/grill-with-docs` and `/triage`, and reusable on its own to stress-test any plan. |
| `orchestrator` | Delegate a large, separable task to subagents routed by model tier, never above the session model, which keeps planning, verification and integration. Fires on big multi-file tasks and repo-wide mechanical passes; not for conversation-bound work. |

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

git add my-skill && git commit -m "skill: add my-skill"
# the plugin picks up skills/ natively (in local plugin dev,
# refresh the cache with: claude plugin update sp1ne@taloud-plugins)
```

**Pick the invocation up front.** If only *you* will ever run it, add `disable-model-invocation: true` to the frontmatter and write a one-line, human-facing `description` (no trigger lists). If Claude should reach for it on its own, or another skill must, omit the flag and write a trigger-rich, model-facing `description`. See the taxonomy below.

## Conventions inside this folder

- **Invocation taxonomy.** Every skill is either **user-invoked** (`disable-model-invocation: true`; a human-facing one-line `description`, no trigger lists) or **model-invoked** (no flag; a trigger-rich, model-facing `description` that costs context every turn). The test for model-invoked: *could Claude usefully reach for it on its own, or must another skill reach it?* A user-invoked skill may invoke model-invoked skills, but never another user-invoked one.
- Skill instructions are written in **English**: they live in this bundle and are read by Claude. The skill's runtime output should match the **conversation language** (most skills detect it automatically; a few are intentionally locked to the team language, e.g. `pr-description` outputs French).
- Each skill is self-contained, with one deliberate exception: the doc-layout detection (`structured` / `domain` / `light` / `bootstrap`), the per-mode read/write rules and the doc formats (`ADR-FORMAT.md`, `CONTEXT-FORMAT.md`, `LESSONS-FORMAT.md`) are single-sourced in the model-invoked `project-docs` skill. `grill-with-docs`, `check-conventions` and `tdd` call it instead of carrying a copy. Add mode-specific behaviour in the consumer, add mode *definitions* in `project-docs`.
- **Invoking another skill.** When a skill's own steps tell the agent to run a **model-invoked** skill right now, write `Call the Skill tool with "<name>"`, one skill per call (two skills means "twice"), never a bare `/name` left for the model to interpret. Router-style prose naming a skill for a human to type keeps the `/name` label. A user-invoked skill can only be reached by the human, so phrase that as an instruction to them ("suggest the user runs `/grill-with-docs`").
- **Glossary `_Avoid_` aliases are a contract, not a suggestion.** When a `CONTEXT.md` / `GLOSSARY.md` entry lists `_Avoid_` aliases (set during `grill-with-docs`), `check-conventions` treats any use of those aliases as actionable vocabulary drift, naming the banned word and its canonical replacement. Keep the `_Avoid_` lists current and the check stays sharp. This is the one deliberate coupling between an authoring skill and a checking one.
- Cross-skill references (`/to-prd`, `/lessons-add`, etc.) assume the referenced skill is available either in the bundle or globally in `~/.claude/skills/`. Skills the user keeps personal (like `pr-review`) live outside the bundle.
