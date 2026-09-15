# Bundling hooks into the `sp1ne` plugin itself

Requests to move the guardrail hooks (`deny-ssh`, `deny-risky-git-push`) into the `sp1ne` plugin, so a single install gives skills and hooks together, are out of scope. Hooks stay in the separate `sp1ne-hooks` plugin.

## Why this is out of scope

A plugin's hooks register automatically for every consumer of that plugin, and Claude Code offers no per-hook opt-out: disabling is all-or-nothing per plugin. Skills are opt-in by nature (a user invokes `/<skill>` or not), but a hook fires on every matching tool call whether the consumer wants it or not.

A guardrail like "deny any `ssh` in Bash" or "deny risky `git push`" is a personal policy choice, not a generic capability every `sp1ne` consumer should be forced into. Bundling it into `sp1ne` would mean every team or teammate who installs `sp1ne` for the skills also inherits the maintainer's own hook policy, with no way to keep the skills and skip the hooks.

## Escape hatch

Hooks already exist as their own install:

```bash
claude plugin install sp1ne-hooks@taloud-plugins
```

Opting out later is one command and leaves `sp1ne` itself untouched:

```bash
claude plugin disable sp1ne-hooks@taloud-plugins
```

Both plugins share the same release model (the git commit SHA is the version, `autoUpdate` picks up pushes to `main`), so installing them separately costs nothing beyond one extra command.

## Prior requests

None filed yet.
