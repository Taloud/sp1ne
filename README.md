# sp1ne

A **Claude Code plugin** bundling generic skills: lessons capitalisation, PR descriptions, conventions check, plan grilling, TDD, the PRD/issues workflow, triage, handoff, project bootstrap, and cost-optimized orchestration.

The repo *is* the plugin. The only things that aren't shipped by the plugin are two Claude-Code limitations the plugin model can't cover: the **statusline** (plugins can't set the main `statusLine`) and **project scaffolding** (plugins can't write files into your repo). The latter is handled by a skill, the former needs one manual settings line. Both are below. [**Hooks**](#hooks-optional) ship too, but as a separate opt-in plugin (`sp1ne-hooks`) rather than inside the bundle.

## Install

sp1ne is a plugin of the **`taloud-plugins`** marketplace, whose public catalog lives in [Taloud/claude-plugins](https://github.com/Taloud/claude-plugins), a pure index where each plugin keeps its own repo. This repo only carries its `.claude-plugin/plugin.json` (plus a dev-mirror `marketplace.json`, see [local development](#local-development)); `skills/` is picked up natively.

Skills surface as `/<skill>` in the slash menu, tagged `(sp1ne)`; their canonical id is `sp1ne:<skill>`.

### Personal (all your projects)

```bash
claude plugin marketplace add Taloud/claude-plugins   # registers the "taloud-plugins" marketplace
claude plugin install sp1ne@taloud-plugins
```

To pick up every push to `main` automatically, opt the marketplace into auto-update in your **user** `~/.claude/settings.json`:

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

### Team (per repo)

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

Teammates are prompted to install the plugin when they trust the workspace: no vendored copies, no resync.

### Updates

No `version` field is set on purpose: the **git commit SHA is the version**, so every push to `main` is a new release. With `autoUpdate: true` consumers pick it up at the next Claude Code startup; otherwise `claude plugin update sp1ne@taloud-plugins`.

### Local development

The plugin is cached at install time (`~/.claude/plugins/cache/`), so local edits are **not** live. This repo carries a **dev-mirror** `marketplace.json` declaring the *same* marketplace name as the public catalog, but with `source: "./"`: register your clone instead of the catalog:

```bash
claude plugin marketplace add ~/personal/sp1ne   # once, registers "taloud-plugins" → your clone
# edit skills/…
claude plugin update sp1ne@taloud-plugins         # refresh the cache from the working tree
# then /reload-plugins inside a running session
```

Because the registry is keyed by name, your machine keeps resolving `taloud-plugins` to the local clone even inside repos that declare the GitHub catalog: same plugin id, your source wins on your machine, teammates get GitHub.

Two caveats:

- `plugin update` copies the **working tree**, uncommitted changes included (develop on a branch if you don't want half-finished edits live). But it **no-ops when HEAD hasn't moved** (it keys on the commit SHA): to pick up uncommitted-only changes, either commit first or reinstall (`claude plugin uninstall` + `install`).
- Keep the clone checked out on a branch that contains `.claude-plugin/`: without it, `plugin update` has no marketplace to read.

### An experimental skill outside the bundle

To try a skill without committing it, create it under `~/.claude/skills/<name>/`: personal skills and plugin skills coexist (different ids, no shadowing). Once mature, move it into `skills/` and push.

## Bootstrap a project

A plugin can't write files into your repo, so scaffolding is a skill rather than an automatic step:

```
/bootstrap-project symfony     # or: generic (the default)
```

It drops `CLAUDE.md` + `.claude/{LESSONS,GLOSSARY,CODEMAP}.md` and a starter `settings.json` into the current project, **non-destructively** (never overwrites). The templates ship inside the skill (`skills/bootstrap-project/templates/`), so they travel with the plugin. Once dropped, the files belong to the project, and they're meant to diverge. (This replaces the old `install init`.)

## Statusline (optional)

Plugins can only configure `subagentStatusLine`, never the main `statusLine`, so the statusline isn't shipped by the plugin. It's a single script in this repo (`scripts/statusline.mjs`); wire it up yourself, once, in your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"$HOME/path/to/sp1ne/scripts/statusline.mjs\"",
    "padding": 0
  }
}
```

Point the path at wherever you cloned this repo. After that, edits to the script are live. (Prefer a stable location? `ln -s ~/path/to/sp1ne/scripts ~/.claude/scripts` once, then reference `~/.claude/scripts/statusline.mjs`.)

## Hooks (optional)

Hooks are **not** bundled into sp1ne itself: a plugin's hooks register automatically for every consumer, and Claude Code offers no per-hook opt-out (disabling is all-or-nothing per plugin). A guardrail is a personal policy, so hooks live in a **second plugin**, `sp1ne-hooks`, hosted in this same repo under `plugins/sp1ne-hooks/` and cataloged separately. Nothing changes for `sp1ne` consumers who don't want it.

```bash
claude plugin install sp1ne-hooks@taloud-plugins
```

Same release model as sp1ne (commit SHA is the version, `autoUpdate` picks up pushes to `main`). Opting out later is one command, sp1ne itself is untouched:

```bash
claude plugin disable sp1ne-hooks@taloud-plugins
```

For local development the dev-mirror `marketplace.json` declares it too, so the [same workflow](#local-development) applies (`claude plugin update sp1ne-hooks@taloud-plugins`).

### deny-ssh

A `PreToolUse` hook that denies **any** Bash command invoking `ssh`: directly (`ssh host`), behind a wrapper (`sudo ssh`, `xargs ssh`), inside quotes (`bash -c "ssh host"`) or spelled as a path (`/usr/bin/ssh`). Matching is strict by design, so an innocent mention like `echo ssh` gets denied too; that's the accepted cost. Implicit ssh (a `git push` over an ssh remote, `cat ~/.ssh/config`) stays allowed.

To block more binaries the same way (`scp`, `sftp`, …), add them to the `BLOCKED` list at the top of `plugins/sp1ne-hooks/hooks/deny-ssh.mjs`.

### deny-risky-git-push

A `PreToolUse` hook that denies risky `git push` invocations:

- **any force push, to any branch**: `-f`, `--force`, `--force-with-lease[=…]`, `--force-if-includes`, a `+refspec`, `--mirror`;
- **any push targeting a protected branch** (`main`, `master`, `develop`): explicit (`git push origin main`, `HEAD:master`, `--delete origin main`, `--all`) or implicit (`git push` with no refspec while the current branch is protected, resolved by running `git` in the session's cwd, best effort);
- **any tag push**: `--tags`, `--follow-tags`, a `refs/tags/…` refspec, or a refspec naming a local tag (`git push origin v1.0.0`, resolved via `git tag -l` in the session's cwd, best effort).

Pushing feature branches stays allowed. The protected list is the `PROTECTED` array at the top of `plugins/sp1ne-hooks/hooks/deny-risky-git-push.mjs`.

### deny-destructive-git

A `PreToolUse` hook that denies working-tree and history-destroying `git` commands:

- **`git reset --hard`** (anywhere after the subcommand): discards working-tree changes irreversibly.
- **`git clean` with a force flag** (`-f`, `--force`, or a cluster containing `f` like `-fd`, `-dfx`): deletes untracked files permanently; `git clean -n` / `--dry-run` stays allowed.
- **`git branch -D`, or `--delete` combined with `--force`/`-f`**: force-deletes a branch even with unmerged commits; plain `branch -d` stays allowed.
- **`git checkout .` / `git checkout -- .` / `git restore .`** (and its `--worktree`/`--staged` variants): discards all working-tree changes; named files stay allowed.
- **`git stash drop` / `git stash clear`**: permanently deletes one or all stash entries.

## Without Claude Code (Codex, Cursor, other agents)

The plugin is a Claude Code convenience: the bundle itself is **plain files**. A skill is a directory holding a `SKILL.md` (markdown + YAML frontmatter `name`/`description`) and optional companion docs; nothing executes, nothing is Claude-specific in the content. Any agent that can read files can use it:

```bash
git clone https://github.com/Taloud/sp1ne ~/sp1ne
# copy a skill into a repo (files travel with git)
cp -R ~/sp1ne/skills/pr-description ~/work/team-repo/.claude/skills/pr-description
```

Then wire the content into your tool's instruction mechanism:

- **Codex / agents reading `AGENTS.md`**: reference the files (e.g. "for PR descriptions, follow `.claude/skills/pr-description/SKILL.md`"), or paste the relevant SKILL.md bodies in.
- **Cursor**: same idea from `.cursor/rules/` (one rule per skill, pointing at or embedding the SKILL.md).
- **Anything else**: the SKILL.md *is* the prompt; inject it however your tool ingests instructions.

Caveats for non-Claude consumers:

- The frontmatter (`name`/`description`) and trigger phrasing are Claude Code conventions: other tools ignore them; what matters is the body.
- A few skills assume Claude Code tooling (`gh` CLI calls, `.claude/LESSONS.md` paths); they degrade to "follow the written procedure manually".
- The statusline and templates are Claude Code-specific; for other agents, only the skills are worth consuming.

## Add a new skill

See [`skills/README.md`](skills/README.md#add-a-new-skill) for the step-by-step.
Skills follow the standard Claude Code format: https://docs.claude.com/en/docs/claude-code

## Structure

```
sp1ne/
├── README.md
├── LICENSE
├── .claude-plugin/
│   ├── marketplace.json    # dev mirror of "taloud-plugins" (source ./); public catalog: Taloud/claude-plugins
│   └── plugin.json         # metadata; no version field: the commit SHA is the version
├── plugins/
│   └── sp1ne-hooks/        # second plugin, opt-in; guardrail hooks (cataloged via git-subdir)
│       ├── .claude-plugin/plugin.json
│       └── hooks/
│           ├── hooks.json  # registers the hooks (PreToolUse → deny-*)
│           ├── deny-ssh.mjs
│           └── deny-risky-git-push.mjs
├── scripts/
│   └── statusline.mjs      # optional statusline; wired manually (plugins can't set statusLine)
└── skills/                 # the bundle, shipped by the plugin
    ├── README.md           # catalog + invocation taxonomy
    ├── bootstrap-project/  # /bootstrap-project: scaffolds CLAUDE.md + .claude/ (templates/ inside)
    ├── grill-with-docs/  to-prd/  to-issues/  triage/  handoff/
    ├── pr-description/  check-conventions/  lessons-add/  tdd/
    ├── orchestrator/       # /orchestrator: best-fit model delegation, capped at the session model
    └── sp1ne/              # the router: "which skill fits my situation?"
```

## Requirements

- macOS or Linux.
- Claude Code ≥ 2.x (plugin support).
- Node.js ≥ 18 for the optional statusline and hooks (ESM `node:` imports).
- `gh` CLI for skills that interact with GitHub (`to-prd`, `to-issues`, `triage`, etc.).
