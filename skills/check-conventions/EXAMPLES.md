# check-conventions: worked examples

Concrete examples of each check type from Phase 3.

## Vocabulary drift

Glossary defines `Cancellation` as customer-driven; diff introduces a service method `cancelOrderForFraud()`, which is a `Termination`, not a `Cancellation`.

## ADR contradiction

ADR-0042 "Postgres for write model"; diff introduces a Redis-backed write for orders.

## LESSON violation

LESSON `TST-007` "every functional test rolls back its transaction"; diff adds a functional test without rollback. Cite the LESSON id verbatim.
