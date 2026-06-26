#!/bin/bash
# PreToolUse guardrail: block destructive git commands before Claude runs them.
#
# Trimmed for a develop / feature-branch workflow: plain `git push` is deliberately
# NOT blocked (pushing branches is routine here). Only history-rewriting or
# data-losing variants are caught. Exit code 2 + stderr tells Claude it lacks
# authority for the command; the user can still run it themselves.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

DANGEROUS_PATTERNS=(
  "reset --hard"
  "git clean -f"
  "git clean -fd"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "push -f"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from running this. Ask the user to run it themselves if it is truly needed." >&2
    exit 2
  fi
done

exit 0
