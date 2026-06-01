# LESSONS.md

Mistakes Claude has already made on this project, captured via the `lessons-add` skill. Read before any non-trivial task.

## Format

```
### <ID> — <one-line title>
<actionable rule>. *Why*: <concise reason, especially when not obvious>. → <optional ref> · YYYY-MM-DD
```

Keep entries to 2-3 lines max. Drop *Why* if obvious from the rule. Drop the `→` if no ref.

ID prefixes (adapt to the project): `SF` (Symfony / DI / config) · `DB` (Doctrine / migrations) · `CI` (CI/CD) · `TST` (tests) · `SEC` (security) · `BLD` (build / Docker) · `OTH` (other).

---

## Symfony

<!-- e.g. SF-001 — services_test.yaml does not inherit binds from services.yaml -->

## Doctrine / database

<!-- e.g. DB-001 — Always implement `down()` even if it only throws explicitly -->

## CI/CD

<!-- e.g. CI-001 — New build target must be referenced in compose.yaml -->

## Tests

<!-- e.g. TST-001 — Wrap functional tests in a transaction rollback -->
