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

### Undo a local copy (back to global mode)

```bash
~/personal/sp1ne/install unpush grill-with-docs ~/work/team-repo
# → removes the repo-local copy, precedence falls back to the global symlink
```

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

## Seeing drift between bundle and team copy

```bash
diff -r ~/personal/sp1ne/skills/grill-with-docs ~/work/team-repo/.claude/skills/grill-with-docs
```

Or shortcut:

```bash
alias cbdiff='_(){ diff -r ~/personal/sp1ne/skills/$1 $2/.claude/skills/$1; }; _'
cbdiff grill-with-docs ~/work/team-repo
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
