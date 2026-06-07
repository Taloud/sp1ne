# sp1ne

The shared backbone for my Claude Code setup — a single source of truth for generic skills, the statusline, and project bootstrap templates.

Each component has its own distribution channel, matched to what Claude Code supports:

| Component | Personal machines | Team repos | Why |
|---|---|---|---|
| **Skills** (`skills/`) | Claude Code **plugin** | plugin, declared in the repo's `.claude/settings.json` | plugins are the native distribution channel for skills |
| **Statusline** (`scripts/statusline.mjs`) | symlink (`install scripts`) | vendored copy (`install update`) | plugins cannot configure the main `statusLine` setting |
| **Templates** (`templates/`) | — | one-shot copy (`install init`) | bootstrap files are meant to diverge once dropped |

## Skills — install as a Claude Code plugin

sp1ne is distributed as a plugin of the **`taloud-plugins`** marketplace, whose public catalog lives in [Taloud/claude-plugins](https://github.com/Taloud/claude-plugins) — a pure index where each plugin keeps its own repo. This repo only carries its `.claude-plugin/plugin.json` (plus a dev-mirror `marketplace.json`, see [local development](#local-development-of-a-skill)); `skills/` is picked up natively.

Skills surface as `/<skill>` in the slash menu, tagged `(sp1ne)`; their canonical id is `sp1ne:<skill>`.

### Personal install (all your projects)

```bash
claude plugin marketplace add Taloud/claude-plugins   # registers the "taloud-plugins" marketplace
claude plugin install sp1ne@taloud-plugins
```

To pick up every push to `main` automatically (see [Updates](#updates)), opt the marketplace into auto-update in your **user** `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "taloud-plugins": {
      "source": { "source": "github", "repo": "Taloud/claude-plugins" },
      "autoUpdate": true
    }
  }
}
```

Without it, updates stay manual (`claude plugin update sp1ne@taloud-plugins`).

### Team distribution (per repo)

In the consuming repo's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "taloud-plugins": {
      "source": { "source": "github", "repo": "Taloud/claude-plugins" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "sp1ne@taloud-plugins": true
  }
}
```

Teammates are prompted to install the plugin when they trust the workspace — no vendored copies, no resync.

The marketplace registry is **per user, keyed by name** (`~/.claude/plugins/known_marketplaces.json`), and the plugin itself is installed once at user scope. A repo only ships a *pointer*: if your machine already knows `taloud-plugins` (e.g. as a local directory, see below), your source is used — projects don't shadow it the way vendored skills shadow `~/.claude/skills/`.

### Updates

No `version` field is set on purpose: the **git commit SHA is the version**, so every push to `main` is a new release. With `autoUpdate: true` consumers pick it up at the next Claude Code startup; otherwise `claude plugin update sp1ne@taloud-plugins`.

### Local development of a skill

The plugin is cached at install time (`~/.claude/plugins/cache/`), so local edits are **not** live. This repo carries a **dev-mirror** `marketplace.json` declaring the *same* marketplace name as the public catalog, but with `source: "./"` — register your clone instead of the catalog:

```bash
claude plugin marketplace add ~/personal/sp1ne   # once — registers "taloud-plugins" → your clone
# edit skills/…
claude plugin update sp1ne@taloud-plugins         # refresh the cache from the working tree
# then /reload-plugins inside a running session
```

Because the registry is keyed by name, your machine keeps resolving `taloud-plugins` to the local clone even inside repos that declare the GitHub catalog — same plugin id, your source wins on your machine, teammates get GitHub. Keep the two `marketplace.json` (catalog and dev mirror) declaring the same name.

Two caveats:

- `plugin update` copies the **working tree**, uncommitted changes included — develop on a branch if you don't want half-finished edits live.
- Keep the clone checked out on a branch that contains `.claude-plugin/` — without it, `plugin update` has no marketplace to read.

### Experimental skill outside the bundle

To try a skill without committing it to the bundle, create it under `~/.claude/skills/<name>/` — personal skills and plugin skills coexist (different ids, no shadowing). Once mature, move it into `sp1ne/skills/` and push.

## Statusline

Plugins can only configure `subagentStatusLine`, never the main `statusLine` — so the statusline keeps its own channel:

- **Personal machines** — `./install scripts` symlinks `~/.claude/scripts` → the bundle's `scripts/`. The script **only creates the symlink** — it never edits your settings, so without the second step the statusline shows up nowhere. Add this to your `~/.claude/settings.json` yourself (once — after that, bundle edits are live through the symlink):

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

## Without Claude Code (Codex, Cursor, other agents)

The plugin and the symlink model are Claude Code conveniences — the bundle itself is **plain files**. A skill is a directory holding a `SKILL.md` (markdown + YAML frontmatter `name`/`description`) and optional companion docs; nothing executes, nothing is Claude-specific in the content. Any agent that can read files can use it.

Without plugin support, fall back to the file-based commands:

```bash
git clone https://github.com/Taloud/sp1ne ~/sp1ne

# vendor a skill into a repo (works for any consumer — files travel with git)
~/sp1ne/install push pr-description ~/work/team-repo
# → .claude/skills/pr-description/SKILL.md, committed like any other file

# resync later
~/sp1ne/install status ~/work/team-repo
~/sp1ne/install update ~/work/team-repo
```

Then wire the content into your tool's instruction mechanism:

- **Codex / agents reading `AGENTS.md`** — reference the vendored files from `AGENTS.md` (e.g. "for PR descriptions, follow `.claude/skills/pr-description/SKILL.md`"), or paste the relevant SKILL.md bodies in.
- **Cursor** — same idea from `.cursor/rules/` (one rule per skill, pointing at or embedding the SKILL.md).
- **Anything else** — the SKILL.md *is* the prompt; inject it however your tool ingests instructions.

Caveats for non-Claude consumers:

- The frontmatter (`name`/`description`) and trigger phrasing are Claude Code conventions — other tools ignore them; what matters is the body.
- A few skills assume Claude Code tooling (`gh` CLI calls, `.claude/LESSONS.md` paths); they degrade to "follow the written procedure manually".
- The statusline and templates are Claude Code-specific (statusline hooks into `settings.json`; templates drop `CLAUDE.md` + `.claude/`) — for other agents, only the skills are worth consuming.

## Add a new skill

See [`skills/README.md`](skills/README.md#add-a-new-skill) for the step-by-step.
Skills follow the standard Claude Code format: https://docs.claude.com/en/docs/claude-code

## Structure

```
sp1ne/
├── README.md
├── .claude-plugin/
│   ├── marketplace.json    # dev mirror of the "taloud-plugins" marketplace (source ./) — public catalog: Taloud/claude-plugins
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
