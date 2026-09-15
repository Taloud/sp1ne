---
name: grilling
description: Interview the user relentlessly about a plan or design, one question at a time, until it holds together. Use when the user wants to stress-test a plan before building, uses any 'grill' trigger phrase, or when another skill needs to grill a plan into shape.
---

# grilling

The interview engine. Interrogate the user relentlessly about every aspect of their plan until reaching shared understanding. Walk down each branch of the design tree, resolving dependencies one at a time. For each question, provide a recommended answer.

**Rules:**
- Ask questions **one at a time** and wait for the answer: several at once is bewildering.
- **Finding facts is your job, never the user's.** When a question needs a fact from the environment (filesystem, tools, git history) rather than a decision, don't ask the user for it: dispatch a sub-agent (the Agent tool) to find it. Don't block on the dispatch; while it runs, ask the next question whose answer doesn't depend on that fact, and come back to the dependent question once the sub-agent reports. Decisions stay the user's; only facts get delegated.

## Grilling behaviors

| Behavior | When | Example |
|---|---|---|
| **Challenge glossary conflict** | a user term contradicts an established term | _"Your glossary defines 'cancellation' as X, but you seem to mean Y: which is it?"_ |
| **Sharpen fuzzy language** | user uses vague or overloaded terms | _"You're saying 'account', do you mean Customer or User?"_ |
| **Stress-test scenarios** | a domain relationship is being decided | invent specific edge cases that force precision on boundaries |
| **Cross-reference code** | user claims X works a certain way | check the code; if it contradicts, surface immediately |
| **Force testable form** | acceptance phrased as "fast" / "intuitive" / "consistent" | push it into a measurable, testable statement |

## Notes

This is the interview engine only: it neither detects nor writes project docs. Skills that need grilling **and** documentation invoke this and layer their own behavior on top:

- `/grill-with-docs` runs a grilling session, then captures terms / lessons / decisions into the project's docs as they crystallise.
- `/triage` runs a grilling session to flesh out an under-specified issue before writing its agent brief.
