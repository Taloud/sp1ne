---
name: bootstrap-project
description: Scaffold a new project's CLAUDE.md + .claude/ docs from a bundled template (generic or symfony). Non-destructive — never overwrites an existing file.
disable-model-invocation: true
argument-hint: "generic | symfony (default: generic)"
---

# bootstrap-project

Drop a project-documentation skeleton — `CLAUDE.md` plus `.claude/{LESSONS,GLOSSARY,CODEMAP}.md` and a starter `settings.json` — into a project so the doc-aware skills (`/grill-with-docs`, `/check-conventions`, `/tdd`) have something to anchor on. This replaces the old `install init`: the templates now ship inside this skill and travel with the plugin.

## Input

- **Template type** — `generic` (any project / language) or `symfony` (Symfony APIs). Defaults to `generic` if the user didn't say.
- **Target** — the current working directory. Only scaffold elsewhere if the user explicitly passes a path.

## What to do

1. **Locate the templates.** They live at `<skill-dir>/templates/<type>/`, where `<skill-dir>` is the directory containing this `SKILL.md`. Resolve it via the `$CLAUDE_SKILL_DIR` environment variable; if that is empty in the shell, substitute the literal absolute path of this skill's directory (the harness tells you that path when it loads the skill).
2. **Check the type exists** under `templates/`. If not, list the available types and stop.
3. **Copy non-destructively.** Never overwrite an existing file; preserve the tree, including the hidden `.claude/` directory. Report each file as *posed* or *already present*.

Use this loop — it sidesteps the BSD/GNU `cp` flag differences and handles the dotfiles that a `*` glob would miss (it needs bash or zsh, which is what Claude Code's Bash tool runs):

```bash
SKILL_DIR="${CLAUDE_SKILL_DIR}"          # if empty, set to this skill's absolute path
TYPE="${1:-generic}"
SRC="$SKILL_DIR/templates/$TYPE"
TARGET="$(pwd)"

[ -d "$SRC" ] || { echo "unknown template: $TYPE — available: $(ls "$SKILL_DIR/templates")"; exit 1; }

posed=0; present=0
while IFS= read -r -d '' f; do
  rel="${f#"$SRC"/}"
  dst="$TARGET/$rel"
  if [ -e "$dst" ]; then
    printf '  exists   %s\n' "$rel"; present=$((present+1))
  else
    mkdir -p "$(dirname "$dst")"
    cp "$f" "$dst"
    printf '  posed    %s\n' "$rel"; posed=$((posed+1))
  fi
done < <(find "$SRC" -type f -print0)
echo "posed: $posed · already present: $present"
```

4. **Point at the next step.** Tell the user what landed, then suggest: open `CLAUDE.md`, fill the glossary, and run `/grill-with-docs` to start sharpening the model.

## Notes

- **Non-destructive by design** — safe to re-run; existing files are left untouched. The posed files belong to the project afterwards, not to the bundle — they're meant to diverge.
- A plugin cannot write files into a project on its own, which is why this is an explicit, user-invoked skill rather than an automatic step.
