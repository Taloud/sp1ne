---
name: pr-description
description: Generate a ready-to-paste PR description (French) from the current branch's diff, auto-detecting the Jira ticket, parent PRD, impacted areas, and Playwright test URLs from the repo's own config.
disable-model-invocation: true
---

# pr-description

Produces a standard PR description in French from the current branch's diff against the project's base branch.

Goal: **same presentation across every PR**. Project-specific values (sites, hosts, ports, content-types, Jira prefix) are **discovered from the repo**, never hardcoded.

Final output = **one fenced markdown code block** ready to paste (template in §8), so the raw `##` headings and single-line bullets survive copy-paste from the terminal verbatim. After it, a single line listing remaining placeholders to fill.

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

## 3. PRD link & issue to close

- Detect repo owner/name with `gh repo view --json nameWithOwner -q .nameWithOwner` (fallback: parse `git remote get-url origin`).
- Collect every issue reference from the branch name and commit subjects:
  - branch patterns: `(?:agent/)?prd-(\d+)`, a bare issue number (`1234-…`, `issue-1234`, `feat/1234-…`), …
  - commit subjects: any `#\d+`, especially `(?:closes|fixes|resolves)\s+#(\d+)`.
- For each distinct number `N`, classify it with `gh issue view <N> --json labels,title` (best effort):
  - **carries the `prd` label** → it's the **parent PRD container** → *link* it (never `Closes` it; a PRD container is closed only when all its slices are done, not by a single slice PR).
  - **no `prd` label** → it's the **slice / work issue this PR resolves** → `Closes #N`.
- A `prd-(\d+)` branch with no other reference → treat that number as the parent PRD.
- Build the `## 🧭 PRD` section in this order:
  1. `Lié au PRD : [#<PRD> — <titre>](https://github.com/<owner>/<repo>/issues/<PRD>)` — only if a parent PRD was found (title via `gh issue view`, else leave `— titre`).
  2. `Closes #<slice>` — one line per slice/work issue the PR resolves (GitHub auto-closes it on merge).
- If neither a PRD nor a closable issue is detected → **drop the entire `## 🧭 PRD` section** from the output.

## 4. Impacted areas & content-types (discovered, not hardcoded)

- **Areas / sites**: derive from the directory layout actually present in the diff. Inspect modified paths and look for a recurring second-level segment (`<root>/<area>/...`) under directories like `templates/`, `tests/`, `tests/playwright/`, `config/`, `assets/`, `apps/`, `packages/`, `sites/`. Treat shared roots (`common/`, `shared/`, `core/`) as "transverse" — mention them in *Description* but don't list them per-area.
- **Content-types / kind labels**: extract from the spec/template **filename** (strip extensions `.spec.{js,ts}`, `.html.twig`, `.tsx`, …). Use the filename as the label as-is; don't try to map to a hardcoded vocabulary.

If no clear per-area split exists, skip area grouping and list URLs flat.

## 5. Playwright test URLs (the part that has to stay generic)

When the diff modifies any `**/*.spec.{js,ts}`, build the test URLs **the same way the project's own Playwright setup builds them** (discover the base-URL pattern, extract each spec's path, compose the URL) — see [`playwright-urls.md`](playwright-urls.md) for the procedure. If no Playwright spec is modified → **drop the `## 🔗 URLs de test` section**.

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

**Copy the raw markdown into the system clipboard** via Bash (`pbcopy` on macOS, `xclip -selection clipboard` or `xsel --clipboard --input` or `wl-copy` on Linux, `clip.exe` on Windows/WSL) using a **quoted** heredoc (`pbcopy <<'PRDESC' … PRDESC`). The single-quoted delimiter is mandatory: the body is full of backticks and `$()` and an unquoted `<<EOF` would shell-expand (or execute) them instead of copying them verbatim. Also display it in a fenced ```` ```md ```` block for review. After a successful copy, print `✅ Description copiée dans le presse-papier.`

Never insert a hard line break inside a sentence or a bullet — one continuous line per bullet/paragraph, however long. Let GitHub soft-wrap.

```markdown
## 🎟️ Ticket Jira

[PREFIX-XXXX]

## 🎨 Maquettes

[Lien vers les maquettes](https://figma.com/file/...)

## 🧭 PRD

Lié au PRD : [#XXXX — <titre>](https://github.com/<owner>/<repo>/issues/XXXX)

Closes #XXXX

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
- `## 🧭 PRD` if neither a PRD link nor a closable issue was detected. Inside it, drop the `Lié au PRD` line if no parent PRD was found, or the `Closes #XXXX` line(s) if no slice/work issue was found — keep whichever applies.
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
- ❌ Emitting the description as live markdown (rendered `##` headings). Wrap it in a fenced code block so the literal `##` survives copy-paste.
- ❌ Hard-wrapping a sentence or bullet across several lines — it pastes into GitHub with forced mid-sentence breaks. One logical line per bullet/paragraph.
- ❌ `Closes`-ing the parent PRD container (the `prd`-labelled issue). Link it; `Closes` only the slice/work issue the PR resolves.
- ❌ Unquoted heredoc (`<<EOF`) for the clipboard copy — the description's backticks/`$()` get shell-expanded. Always use `<<'PRDESC'`.
