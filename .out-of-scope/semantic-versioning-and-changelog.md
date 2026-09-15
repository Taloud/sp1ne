# Semantic versioning and a changelog

Adding a `version` field to `.claude-plugin/plugin.json`, semver releases, a changesets-style workflow, or a `CHANGELOG.md` file is out of scope for this repo.

## Why this is out of scope

The repo deliberately has no `version` field: the git commit SHA is the version. Every push to `main` is a release. Consumers who opted into `autoUpdate: true` pick up that release automatically at their next Claude Code startup; everyone else runs `claude plugin update sp1ne@taloud-plugins` manually.

Introducing a `version` field or a semver release process would add a manual bump step to every change. That step can be forgotten, and worse, it would gate updates behind it: a consumer on `autoUpdate` would stop getting new commits the moment the maintainer forgets to bump the version, silently reintroducing the manual-update friction the current model avoids. A changelog file has the same failure mode: it drifts the moment an entry is skipped, while the commit history never can.

## Escape hatch

`git log` on this repo already is the changelog: every commit is a release, in order, with a message. To pin to a known-good state instead of tracking `main`, disable `autoUpdate` for the marketplace and run `claude plugin update sp1ne@taloud-plugins` manually whenever you choose to move forward.

## Prior requests

None filed yet.
