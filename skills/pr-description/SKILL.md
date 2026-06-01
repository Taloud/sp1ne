---
name: pr-description
description: Generates a PR description (ready-to-paste markdown, in French) from the diff between the current branch and the base branch. Auto-detects Jira ticket, GitHub PRD/parent issue, impacted areas, and Playwright test URLs by reading the project's own config. Triggers on "description PR", "génère la description de la PR", "/pr-description", "PR description", "texte de PR", or any explicit PR-description request on the current branch.
---

# pr-description

Produces a standard PR description in French from the current branch's diff against the project's base branch. The output is one ready-to-paste markdown block; instructions below are in English for consistency with the rest of the bundle.

Goal: **same presentation across every PR**. Project-specific values (sites, hosts, ports, content-types, Jira prefix) are **discovered from the repo**, never hardcoded.

Final output = **one markdown block** ready to paste (template in §6), followed by a single line listing remaining placeholders to fill.

## 1. Collect diff

```bash
# Detect base branch (fallback chain)
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' \
  || git rev-parse --verify develop 2>/dev/null && echo develop \
  || echo main

git rev-parse --abbrev-ref HEAD
git log <base>..HEAD --oneline
git diff <base>...HEAD --stat
git diff <base>...HEAD --name-only
```

Use the detected base branch for every following command.

## 2. Jira ticket

- Look for a Jira-style key `[A-Z]{2,}-\d+` in:
  1. the current branch name (`git rev-parse --abbrev-ref HEAD`)
  2. the commit subjects (`git log <base>..HEAD --pretty=%s`)
- If found → prefill `[PREFIX-NNNN]`. Otherwise leave the placeholder `[À COMPLÉTER]` and list it at the end.

Do **not** hardcode a prefix (`ABC`, `PROJ`, …) — read what's actually used in the branch / commits.

## 3. PRD / parent issue

- Detect repo owner/name with `gh repo view --json nameWithOwner -q .nameWithOwner` (fallback: parse `git remote get-url origin`).
- If branch matches `(?:agent/)?prd-(\d+)` or commits reference `#\d+` as a parent issue → build link `https://github.com/<owner>/<repo>/issues/<N>` and fetch the title via `gh issue view <N> --json title -q .title` (best effort, otherwise leave `— titre`).
- If no PRD/parent issue is detected → **drop the entire `## 🧭 PRD` section** from the output.

## 4. Impacted areas & content-types (discovered, not hardcoded)

- **Areas / sites**: derive from the directory layout actually present in the diff. Inspect modified paths and look for a recurring second-level segment (`<root>/<area>/...`) under directories like `templates/`, `tests/`, `tests/playwright/`, `config/`, `assets/`, `apps/`, `packages/`, `sites/`. Treat shared roots (`common/`, `shared/`, `core/`) as "transverse" — mention them in *Description* but don't list them per-area.
- **Content-types / kind labels**: extract from the spec/template **filename** (strip extensions `.spec.{js,ts}`, `.html.twig`, `.tsx`, …). Use the filename as the label as-is; don't try to map to a hardcoded vocabulary.

If no clear per-area split exists, skip area grouping and list URLs flat.

## 5. Playwright test URLs (the part that has to stay generic)

Goal: build URLs **the same way the project's own Playwright setup builds them**, instead of hardcoding a host table.

### 5.1 Find the base URL pattern

In order, look for:

1. **Playwright config** (`playwright.config.{js,ts,mjs,cjs}` at repo root or under `tests/`). Read it and extract:
   - `use.baseURL` (string or expression)
   - per-project `use.baseURL` if `projects: [...]` is used (one base URL per area/site)
   - `webServer.url` as a fallback
2. **Environment helper** the tests use (e.g. a `navigateTo(page, path)` helper). Open it (`grep -rE "navigateTo\s*=|export.*navigateTo" tests/ playwright/ -l`) and read how it composes the URL (host template, port, query handling).
3. **An existing passing spec** in the repo (not necessarily one being modified). Extract a real `page.goto('https://…')` to see the concrete pattern.

Record the discovered pattern as `BASE_URL_TEMPLATE` (may contain a `{site}` / `{area}` slot) and a `PORT`. Note any per-area exceptions you actually observe in the config — do **not** invent any.

### 5.2 Extract the path from each modified spec

For each modified `**/*.spec.{js,ts}`:

```bash
grep -nE "navigateTo\(\s*page\s*,\s*['\"]|page\.goto\(\s*['\"]" <spec>
```

- Take the **first** path in the top-level / `Desktop` describe block (or the first call if no describe split).
- Keep any query string (`?todayDate=…`, etc.) verbatim.

### 5.3 Build the final URL

- If the spec calls `page.goto('https://…')` directly, **use that URL as-is**.
- Otherwise, substitute the path into the discovered `BASE_URL_TEMPLATE`, using the area detected in §4 for the `{site}`/`{area}` slot.
- Apply only exceptions you saw in the project's own config (e.g. a host alias like `foo → bar` if and only if it's encoded in playwright.config or the test helper).

If no Playwright spec is modified → **drop the `## 🔗 URLs de test` section**.

## 6. Description & "Comment tester"

- **Description**: 3-6 bullets summarizing the diff (added components, integrations, configs, helpers, unit tests). Mention transverse changes (`common/`, `shared/`, …) and per-area overrides (e.g. SCSS) when present.
- **Comment tester**: diff-specific steps (open URLs, verify rendering, run impacted specs + unit tests if any). No generic checklist filler.

## 7. URL formatting

When per-area grouping makes sense, group by area with kind labels as sub-bullets — **never** repeat the area name:

```
- <area-1>
  - <kind> : <https://...>
  - <kind> : <https://...>
- <area-2>
  - <kind> : <https://...>
```

Otherwise, list URLs flat under the section.

## 8. Final template (output stays in French)

```markdown
## 🎟️ Ticket Jira

[PREFIX-XXXX]

## 🎨 Maquettes

[Lien vers les maquettes](https://figma.com/file/...)

## 🧭 PRD

Lié au PRD : [#XXXX — <titre>](https://github.com/<owner>/<repo>/issues/XXXX)

## 📝 Description

- <puce 1>
- <puce 2>
- ...

## 🔍 Comment tester

1. <étape>
2. ...

## 🔗 URLs de test

**Environnement** : <env name si détecté, sinon "développement local">

- <area>
  - <kind> : <https://...>
  ...

## ✅ Checklist

- [ ] Modifications testées localement
- [ ] Tests unitaires / e2e à jour
- [ ] Assets Monitor à jour
```

Optional sections to drop:
- `## 🧭 PRD` if no PRD/parent issue was detected.
- `## 🔗 URLs de test` if no Playwright spec was modified.
- `## 🎨 Maquettes` placeholder stays (always asked).

## 9. After the block

A single line listing the remaining placeholders to fill (e.g. `À compléter : numéro Jira, lien Figma.`). Nothing else.

## Anti-patterns

- ❌ Hardcoding a site → host table inside this skill. Read it from `playwright.config.*` or the test helper instead.
- ❌ Hardcoding a port. Take it from the discovered base URL.
- ❌ Hardcoding a Jira prefix. Match `[A-Z]{2,}-\d+` in the branch / commits.
- ❌ Hardcoding a GitHub repo (`owner/name`). Use `gh repo view` or the `origin` remote.
- ❌ Repeating the area name in the URL list (`siteA — kindA`, `siteA — kindB`). Use grouping.
- ❌ Inventing URLs: extract **only** from `navigateTo` / `page.goto` calls in modified specs.
- ❌ Inflated checklist — keep the 3 template items.
- ❌ Running tests / linters — this skill only produces text.
