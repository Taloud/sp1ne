# sp1ne

This repo is a Claude Code plugin: `skills/` is shipped as-is, `plugins/sp1ne-hooks/` is a second, opt-in plugin. The commit SHA is the version, so every change on `main` reaches consumers on `autoUpdate` at their next startup. Treat every edit as a release.

## Invariants to keep in sync

- **The router must not lie.** `skills/sp1ne/SKILL.md` maps every skill and the flow linking them. When you add, rename, remove, or change how a skill fits the flows, re-read the router and update it in the same change.
- **The catalog mirrors `skills/`.** Every skill has a row in `skills/README.md`, under *User-invoked* or *Model-invoked*. Adding or renaming a skill updates the row.
- **Validate manifests.** After touching `.claude-plugin/*.json`, `plugins/sp1ne-hooks/**` or a skill's frontmatter, run `claude plugin validate .` and paste the result in the PR. The only acceptable output is "passed with warnings" where both warnings are the missing `version` fields (deliberate, see `.out-of-scope/`). `--strict` will always fail for that reason, so do not use it.
- **Doc-layout detection has one owner.** The `structured` / `domain` / `light` / `bootstrap` modes and the CONTEXT / ADR / LESSONS formats live in `skills/project-docs/`. Other skills reach them by calling the Skill tool with "project-docs", never by copying the table.

## Invocation

Every skill is either **user-invoked** (`disable-model-invocation: true`, one-line human-facing description, no trigger list) or **model-invoked** (no flag, trigger-rich description that costs context every turn). Decide up front; the test for model-invoked is: could Claude usefully reach for it on its own, or must another skill reach it?

When a skill's own steps tell the agent to run another skill right now, write it as `Call the Skill tool with "<name>"`, one skill per call (two skills means "twice"). A bare `/name` in prose is a label for a human to type, not an instruction the model reliably fires. A user-invoked skill can never be reached this way: phrase that as an instruction to the human ("suggest the user runs `/grill-with-docs`"). Full taxonomy in `skills/README.md`.

## Writing

- Skill instructions are written in English. Runtime output follows the conversation language unless the skill says otherwise (`pr-description` is French on purpose).
- No em-dashes anywhere in this repo's prose: skills, supporting files, READMEs, comments, hook messages. Rewrite the sentence with a comma, colon, period, parentheses, or a conjunction. Never do a blind character substitution.
- Keep `SKILL.md` focused; move reference material to a supporting file in the same skill folder (progressive disclosure).

## Decisions already taken

`.out-of-scope/` holds features deliberately not built, with the reasoning and the escape hatch. Read the folder before proposing hooks inside `sp1ne`, semantic versioning, or a non-GitHub issue tracker. Add a file there when declining a request whose reasoning will be needed again.

## Git

Do not commit or push unless asked. Commits carry no AI trailer of any kind.
