# Non-GitHub issue trackers as write targets

Adding GitLab, Linear, Jira, local-markdown, or any other issue tracker as a *write target* for `to-prd`, `to-issues`, or `triage` is out of scope.

## Why this is out of scope

`to-prd`, `to-issues`, and `triage` are GitHub-only by design: they use the `gh` CLI, native GitHub sub-issues, and GitHub labels. Each additional backend would hard-code a different CLI shape (commands, flags, output parsing) into all three skills, and that shape would need to keep working as each tool's CLI evolves. That is permanent maintenance surface for every backend added.

sp1ne's team uses GitHub, and the slicing model these skills rely on (PRD to issues to native sub-issues to triage) is built directly on GitHub's sub-issue and label primitives. A different tracker doesn't just need a different write call, it needs the slicing model re-derived for whatever hierarchy and labeling that tracker offers.

## Escape hatch

Jira and Linear are already supported, read-only, as an upstream reference:

- `grill-with-docs` accepts a Jira/Linear ticket as a read-only pre-seed.
- `to-prd` accepts a Jira/Linear ticket as a title prefix and parent reference, read-only.

Neither writes back to Jira or Linear. For a team that needs a different tracker as an actual write target, forking the skill is the intended path: copy the skill directory and swap the `gh` calls for the target tracker's CLI.

## Prior requests

None filed yet.
