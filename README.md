# sp1ne

The shared backbone for my Claude setup — single source for my skills + bootstrap templates, symlinked into every project.

## Initial setup

```bash
cd ~/personal/sp1ne
chmod +x install
./install link
./install scripts
./install doctor   # verify the install is healthy
```

- `link` creates symlinks `~/.claude/skills/<X>` → `~/personal/sp1ne/skills/<X>`. All my personal projects (no local copy) immediately see every edit made in the bundle.
- `scripts` symlinks `~/.claude/scripts` → the bundle's `scripts/` directory (statusline + future helpers).
- `doctor` validates that every bundle skill is linked, that `~/.claude/scripts` points to the bundle, and that `settings.json` references the bundle statusline.

## Commands

```
install link
install scripts
install init [generic|symfony] [path]
install push <skill> <repo> [<repo>...]
install unpush <skill> <repo>
install status <repo>
install update <repo>
install doctor
```

All commands are non-destructive. `init`, `link`, and `scripts` never touch an existing file. `push` and `unpush` ask for confirmation.

## Workflow

### Bootstrap a new project

```bash
cd ~/work/my-symfony-api
~/personal/sp1ne/install init symfony
# → drops CLAUDE.md + .claude/{LESSONS,GLOSSARY,CODEMAP,settings}.json
# → never touches .claude/skills/ (the project inherits the global symlinks)
```

### Edit a skill (auto-propagates to personal projects)

```bash
vim ~/personal/sp1ne/skills/grill-with-docs/SKILL.md
# → IMMEDIATE effect on every personal project
#   (no local copy — they inherit through the global symlink)
git -C ~/personal/sp1ne commit -am "..."
```

### Push a skill to a team repo

```bash
~/personal/sp1ne/install push grill-with-docs ~/work/team-repo
# → shows the diff, asks for confirmation, copies
# → you then commit in the team repo
cd ~/work/team-repo && git add .claude/skills/grill-with-docs && git commit -m "skill: bump grill-with-docs"
```

### Refresh a team repo's vendored skills (after editing the bundle)

```bash
~/personal/sp1ne/install status ~/work/team-repo   # read-only: see what drifted
~/personal/sp1ne/install update ~/work/team-repo   # refresh every drifted skill at once (diff + one confirm)
cd ~/work/team-repo && git add .claude/skills && git commit -m "skill: sync vendored skills with sp1ne"
```

### Undo a local copy (back to global mode)

```bash
~/personal/sp1ne/install unpush grill-with-docs ~/work/team-repo
# → removes the repo-local copy, precedence falls back to the global symlink
```

## Link vs. push — the core trade-off

Because a repo-local skill **shadows** the global one (see [precedence](#claude-code-precedence-good-to-know)), you can't have both active for the same skill. Every choice collapses to a single arbitrage:

> **Auto-propagation** (the skill tracks the bundle) **vs. self-containment** (the skill travels with the repo).

It's the same call you already make with dependencies:

| sp1ne | Composer equivalent | Property |
|---|---|---|
| `link` (global symlink) | `composer global require` / system package | Shared, auto-updated — but the machine must have the bundle installed |
| `push` (copy into repo) | a committed `vendor/` | Self-contained, travels with git, pinned — but you re-sync to update |

A skill under `~/.claude/skills/` is **live** (tracks the bundle); one under `repo/.claude/skills/` is **vendored** (a snapshot you control). So `push` is the right tool only when:

1. **Consumers don't have the bundle** — a repo shared with people who won't install sp1ne, an open-source project, ephemeral CI. The skill must ship with the repo or they never get it.
2. **You want a pinned version** — frozen on the team side so a bundle refactor can't silently change behaviour mid-sprint. `push` re-shows the diff before overwriting: a deliberate refresh, on your terms.
3. **The repo is published externally** — skills embedded for anyone who clones, zero dependency on your private setup.

If none of those hold (every consumer has sp1ne, and you want your edits to propagate), use `link` and **don't** copy — a copy would only buy you drift.

### Decision rule

```
Do all consumers have sp1ne installed?
├─ No  → push (copy): the only way the skill reaches them
└─ Yes → Do you want the team version frozen, independent of the bundle?
         ├─ Yes → push (copy): a snapshot you refresh on your terms
         └─ No  → link (symlink): auto-propagation   ← the default
```

`install init` never creates a copy: `link` is the default, `push` is the deliberate exception.

## Mental model

| Repo | Local skills copy? | Bundle edits propagate? |
|---|---|---|
| Personal projects | no | yes, instantly (via global symlink) |
| Team repo | yes (deliberate) | no — needs `install push` |

**Rule**: a local copy is a deliberate act to pin a stable version on the team side. `install init` never creates one.

## Claude Code precedence (good to know)

```
{repo}/.claude/skills/<X>   wins over   ~/.claude/skills/<X>
```

So if a repo carries a local copy, that's what's used — even if the global symlink is newer. That's exactly what we want for pinning on the team side.

## Seeing — and fixing — drift between bundle and a vendored repo

For a repo that vendors skills (the `push` model), `status` reports which local copies have drifted, and `update` re-syncs them all at once:

```bash
install status ~/work/team-repo   # read-only: up-to-date / DRIFT / local-only, per skill
install update ~/work/team-repo   # refresh every drifted vendored skill (diff + one confirm)
```

`status` is the repo-side analogue of `doctor`. `update` only refreshes skills present in **both** the repo and the bundle — it never adds a skill (that's `push`) and never touches project-specific skills (those show as `local-only`). A symlink-model repo (nothing vendored) reports everything as `local-only`, and `update` is a no-op.

For a one-off single-skill diff:

```bash
diff -r ~/personal/sp1ne/skills/grill-with-docs ~/work/team-repo/.claude/skills/grill-with-docs
```

## Structure

```
sp1ne/
├── README.md
├── install                 # script (link, scripts, init, push, unpush, doctor)
├── scripts/                # statusline + helpers (symlinked to ~/.claude/scripts)
├── skills/                 # single source of truth — edit here = effect everywhere
└── templates/
    ├── generic/            # any project, any language
    │   ├── CLAUDE.md
    │   └── .claude/{LESSONS.md, GLOSSARY.md, CODEMAP.md, settings.json}
    └── symfony/            # Symfony APIs (private bundles, SF/DB prefixes)
        ├── CLAUDE.md
        └── .claude/{LESSONS.md, GLOSSARY.md, CODEMAP.md, settings.json}
```

## Add a new skill

See [`skills/README.md`](skills/README.md#add-a-new-skill) for the step-by-step.
Skills follow the standard Claude Code format: https://docs.claude.com/en/docs/claude-code

## Experimental skill outside the bundle

If you want to try out a skill without committing it to the bundle, create it directly under `~/.claude/skills/<name>-wip/`. `install link` is non-destructive: it won't touch a local skill that isn't a symlink. Once the skill is mature, move it into `sp1ne/skills/` and re-run `install link`.

## Requirements

- macOS or Linux, bash.
- Node.js ≥ 18 for the statusline (ESM `node:` imports).
- `gh` CLI for skills that interact with GitHub (`to-prd`, `to-issues`, `triage`, etc.).
