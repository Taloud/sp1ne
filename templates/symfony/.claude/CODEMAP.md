# CODEMAP.md

High-level module map for this Symfony project. Surfaces broader context when working in an unfamiliar area.

Keep this file shallow: one bullet per top-level module/package, one sentence each. The goal is orientation, not documentation.

## Format

```
- `<path>` — what lives here (one sentence). Owns: <key concept>. Used by: <consumers>.
```

## Rules

- One bullet per top-level bundle, package, or significant `src/` directory. Don't drill below 2 levels.
- Use the project's domain vocabulary (see `GLOSSARY.md`). Call out the mapping when a class/namespace doesn't match a glossary term.
- For Doctrine entities, point to the namespace that owns them, not every entity class.
- Update opportunistically when a module is added, moved, or substantially renamed — not eagerly.

---

## Application

<!-- e.g. - `src/Controller/` — HTTP entry points. Owns: request validation. Used by: external clients. -->

## Domain

<!-- e.g. - `src/Domain/Order/` — Order aggregate and value objects. Owns: order lifecycle. Used by: `Application/`, `Infrastructure/Persistence/`. -->

## Infrastructure

<!-- e.g. - `src/Infrastructure/Persistence/` — Doctrine repositories and migrations. Owns: read/write to Postgres. -->

## Internal bundles

<!-- e.g. - `vendor/acme/logging-bundle/` — centralised logging. Used by: every controller via Monolog channel `app`. -->
