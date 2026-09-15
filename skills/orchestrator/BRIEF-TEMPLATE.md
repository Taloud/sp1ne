# Brief template

A subagent shares none of your context: it has not read the conversation, the repo's `CLAUDE.md` may not be loaded in its window, and it does not know which files another agent is editing. Everything it needs travels in the brief. Fill every section below; a section you cannot fill is a sign the subtask is not yet separable.

Write the brief in English, and ask for the report in English. Only you read it.

```
You are working in <repo path>. Work on the working tree only. Do NOT commit, do NOT push.

## Goal
<one paragraph: what to produce and why it exists, so the agent can make small judgment calls in the right direction>

## Files you own (edit, create, move only these)
- <exact path>
- <exact path or folder>
Touch nothing else. If the task needs a change outside this list, do not make it: report the exact lines you recommend and the orchestrator will integrate them.

## Context you need
<the facts the agent cannot discover cheaply: conventions of the repo, decisions already taken in the conversation, verified CLI facts, names already chosen, what a sibling agent is doing in parallel and where the boundary lies>
<paths to read first, read-only>

## Task
<numbered steps, each with its expected result>

## Constraints
- <project conventions: language of the files, naming, structure, invocation rules>
- <style rules: e.g. no em-dashes in any text or line you touch; rewrite the sentence, never a blind substitution>
- <what must stay byte-identical: format markers, ids, public names>

## Definition of done
<machine-checkable wherever possible: a grep count, a test command and its expected output, a validation command, a file listing. The cheaper the model, the more mechanical this list must be.>

## Report (English)
<exactly what you want back: per-file summary, verbatim snippets you will need to integrate, command outputs, the list of judgment calls with before/after quotes, anything left unsure>
```

## Rules the template encodes

- **Ownership is exclusive.** Two agents never own the same file. When ownership cannot be split cleanly, give one agent the file and have the other report recommended lines, or isolate with `isolation: "worktree"`.
- **Style rules go in every brief.** A rule you forget in one brief out of six is a rule that will be broken once. Copy them, do not summarise them.
- **Verified facts, not assumptions.** If a step depends on a fact about the environment (a CLI flag exists, a file has a given shape), verify it yourself before dispatch and state it in the brief as verified.
- **Definition of done before dispatch.** If you cannot write a checkable definition of done, you are not ready to delegate: either verify the result by reading the whole diff (count that cost) or route the subtask higher.
- **Ask for the judgment calls.** A good report lists where the agent hesitated, with before/after quotes. That list is where your verification time should go first.
