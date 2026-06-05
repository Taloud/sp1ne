# sp1ne

The shared backbone for my Claude Code setup — a single source of truth for generic skills, the statusline, and project bootstrap templates.

Each component has its own distribution channel, matched to what Claude Code supports:

| Component | Personal machines | Team repos | Why |
|---|---|---|---|
| **Skills** (`skills/`) | Claude Code **plugin** | plugin, declared in the repo's `.claude/settings.json` | plugins are the native distribution channel for skills |
| **Statusline** (`scripts/statusline.mjs`) | symlink (`install scripts`) | vendored copy (`install update`) | plugins cannot configure the main `statusLine` setting |
| **Templates** (`templates/`) | — | one-shot copy (`install init`) | bootstrap files are meant to diverge once dropped |

## Skills — install as a Claude Code plugin

The repo doubles as a plugin marketplace (`.claude-plugin/marketplace.json`) whose single plugin is the repo itself — `skills/` is picked up natively. Skills surface as `/<skill>` in the slash menu, tagged `(sp1ne)`; their canonical id is `sp1ne:<skill>`.

### Personal install (all your projects)

```bash
claude plugin marketplace add Taloud/sp1ne
claude plugin install sp1ne@sp1ne
```

### Team distribution (per repo)

In the consuming repo's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "sp1ne": {
      "source": { "source": "github", "repo": "Taloud/sp1ne" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "sp1ne@sp1ne": true
  }
}
```

Teammates are prompted to install the plugin when they trust the workspace — no vendored copies, no resync.

The marketplace registry is **per user, keyed by name** (`~/.claude/plugins/known_marketplaces.json`), and the plugin itself is installed once at user scope. A repo only ships a *pointer*: if your machine already knows `sp1ne` (e.g. as a local directory, see below), your source is used — projects don't shadow it the way vendored skills shadow `~/.claude/skills/`.

### Updates

No `version` field is set on purpose: the **git commit SHA is the version**, so every push to `main` is a new release. With `autoUpdate: true` consumers pick it up at the next Claude Code startup; otherwise `claude plugin update sp1ne@sp1ne`.

### Local development of a skill

The plugin is cached at install time (`~/.claude/plugins/cache/`), so local edits are **not** live. Use your clone as a dev marketplace:

```bash
claude plugin marketplace add ~/personal/sp1ne   # once — registers the name "sp1ne" → your clone
# edit skills/…
claude plugin update sp1ne@sp1ne                  # refresh the cache from the working tree
# then /reload-plugins inside a running session
```

Because the registry is keyed by name, your machine keeps resolving `sp1ne` to the local clone even inside repos that declare the GitHub source — same plugin id, your source wins on your machine, teammates get GitHub.

Two caveats:

- `plugin update` copies the **working tree**, uncommitted changes included — develop on a branch if you don't want half-finished edits live.
- Keep the clone checked out on a branch that contains `.claude-plugin/` — without it, `plugin update` has no marketplace to read.

### Experimental skill outside the bundle

To try a skill without committing it to the bundle, create it under `~/.claude/skills/<name>/` — personal skills and plugin skills coexist (different ids, no shadowing). Once mature, move it into `sp1ne/skills/` and push.

## Statusline

Plugins can only configure `subagentStatusLine`, never the main `statusLine` — so the statusline keeps its own channel:

- **Personal machines** — `./install scripts` symlinks `~/.claude/scripts` → the bundle's `scripts/`. Your `~/.claude/settings.json` points at it once, edits are live:

  ```json
  {
    "statusLine": {
      "type": "command",
      "command": "node \"$HOME/.claude/scripts/statusline.mjs\"",
      "padding": 0
    }
  }
  ```

- **Team repos** — a vendored copy at `.claude/scripts/statusline.mjs`, referenced via `$CLAUDE_PROJECT_DIR` in the repo's `.claude/settings.json` (project settings win over user settings, so teammates get it with zero setup). Resync after editing the bundle:

  ```bash
  ./install update ~/work/team-repo   # refreshes the vendored statusline (and any vendored skills) — diff + confirm
  ```

## Templates — bootstrap a project

```bash
cd ~/work/my-symfony-api
~/personal/sp1ne/install init symfony   # or: generic
# → drops CLAUDE.md + .claude/{LESSONS,GLOSSARY,CODEMAP,settings}.json
# → non-destructive: never overwrites an existing file
```

Templates are starting points, not synced artifacts — once dropped, they belong to the project.

## The `install` script

```
install scripts                       symlink ~/.claude/scripts -> bundle/scripts (statusline)
install init [generic|symfony] [path] drop template files into a project
install status <repo>                 report vendored skills/statusline: up-to-date / DRIFT / local-only
install update <repo>                 refresh drifted vendored skills + statusline copy (diff + one confirm)
install push <skill> <repo> [...]     vendor one bundle skill into a repo (deliberate pinning)
install unpush <skill> <repo>         remove a repo's vendored copy
install link                          [legacy] symlink ~/.claude/skills/* -> bundle/skills/*
install doctor                        [legacy] check symlink install health
```

All commands are non-destructive; `push`, `unpush` and `update` ask for confirmation.

### Vendored skills are now the exception

Before the plugin existed, skills reached personal machines through symlinks (`link`) and team repos through vendored copies (`push`/`update`). The plugin replaces both for skills. Vendoring one remains a deliberate act for the rare cases the plugin can't cover:

1. **Pinning** — the repo must freeze a skill's behaviour independently of bundle releases (a vendored copy *shadows* the plugin's short name).
2. **No-plugin consumers** — ephemeral CI, environments where adding a marketplace isn't possible.

For repos still on the vendored model (not yet migrated to the plugin), `status`/`update` keep working as before — they never touch project-specific skills (reported `local-only`) and never add new ones.

## Add a new skill

See [`skills/README.md`](skills/README.md#add-a-new-skill) for the step-by-step.
Skills follow the standard Claude Code format: https://docs.claude.com/en/docs/claude-code

## Structure

```
sp1ne/
├── README.md
├── .claude-plugin/
│   ├── marketplace.json    # the repo is its own marketplace; the plugin is the repo root
│   └── plugin.json         # metadata — no version field: the commit SHA is the version
├── install                 # script (scripts, init, status, update, push, unpush; legacy: link, doctor)
├── scripts/                # statusline + helpers (symlinked to ~/.claude/scripts)
├── skills/                 # single source of truth — shipped by the plugin
└── templates/
    ├── generic/            # any project, any language
    │   ├── CLAUDE.md
    │   └── .claude/{LESSONS.md, GLOSSARY.md, CODEMAP.md, settings.json}
    └── symfony/            # Symfony APIs (private bundles, SF/DB prefixes)
        ├── CLAUDE.md
        └── .claude/{LESSONS.md, GLOSSARY.md, CODEMAP.md, settings.json}
```

## Requirements

- macOS or Linux, bash.
- Claude Code ≥ 2.x (plugin support).
- Node.js ≥ 18 for the statusline (ESM `node:` imports).
- `gh` CLI for skills that interact with GitHub (`to-prd`, `to-issues`, `triage`, etc.).
