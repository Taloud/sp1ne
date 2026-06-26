# PRD template

Write the PRD body using this skeleton. Fill every section that applies; omit **Parent** when there is no upstream tracker ticket.

```markdown
## Parent

A reference to the parent ticket on the upstream tracker (Jira/Linear/etc.), if one exists. Otherwise omit this section.

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each in the format:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list should be extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions made:

- The modules to be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions (link to ADRs in `docs/adr/` when relevant)
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets — they rot quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts.

## Testing Decisions

- What makes a good test here (external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests in the codebase

## Out of Scope

What is explicitly out of scope for this PRD.

## Further Notes

Any further notes about the feature.
```
