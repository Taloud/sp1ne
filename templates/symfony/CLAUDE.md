# {{PROJECT}} — Claude instructions

[One or two sentences: what this API does, who consumes it, main constraints.]

## Stack

- PHP: (see `composer.json` → `require.php`)
- Symfony: (see `composer.json` → `symfony/framework-bundle`)
- Tests: PHPUnit ([+ PHPStan, Rector, Behat if present])
- CI: ([to fill in])

## Common commands

- Build / setup: (see `Makefile`, `Taskfile.yml`, `composer.json`)
- Test: `bin/phpunit` or the project's wrapper target
- Static analysis: `vendor/bin/phpstan analyse`
- Rector (if configured): `vendor/bin/rector`

## Internal bundles in use

[Fill in from `composer.json` — list proprietary/private bundles here so Claude knows them.]

## Index

- `.claude/LESSONS.md` — mistakes already made (extend via the `lessons-add` skill)
- `.claude/GLOSSARY.md` — domain vocabulary ↔ code mapping
- `.claude/CODEMAP.md` — high-level module map

## Conventions / golden rules

- Doctrine migrations via `bin/console doctrine:migrations:diff` — do not edit the migration class by hand.
- [Other project-specific constraints.]
